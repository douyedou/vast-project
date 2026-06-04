-- ============================================================
-- 迁移脚本：专利文档表增加权利要求从属关系支持
-- 执行方式：psql -U vast_user -d vast_db -f scripts/migrate-claims-table.sql
--
-- 改动：
--   1. patent_documents.type 增加 'claim'（单条权利要求）
--   2. 新增 parent_claim_id 自引用外键（从属关系）
--   3. 新增 claim_number, support_status, support_paragraphs 列
--   4. 迁移旧 JSON 数据（patent_documents type='claims' → 逐条 type='claim'）
-- ============================================================

BEGIN;

-- 1. 放宽 type CHECK 约束，增加 'claim'
ALTER TABLE patent_documents DROP CONSTRAINT IF EXISTS patent_documents_type_check;
ALTER TABLE patent_documents ADD CONSTRAINT patent_documents_type_check
    CHECK (type IN ('spec', 'claims', 'abstract', 'drawings', 'claim'));

-- 2. 新增列
ALTER TABLE patent_documents
    ADD COLUMN IF NOT EXISTS parent_claim_id UUID,
    ADD COLUMN IF NOT EXISTS claim_number INTEGER,
    ADD COLUMN IF NOT EXISTS support_status VARCHAR(20) DEFAULT 'unchecked',
    ADD COLUMN IF NOT EXISTS support_paragraphs TEXT[] DEFAULT '{}';

-- 3. 添加外键约束（自引用）
ALTER TABLE patent_documents
    ADD CONSTRAINT fk_patent_docs_parent
    FOREIGN KEY (parent_claim_id) REFERENCES patent_documents(id)
    ON DELETE RESTRICT;

-- 4. support_status CHECK
ALTER TABLE patent_documents DROP CONSTRAINT IF EXISTS patent_documents_support_status_check;
ALTER TABLE patent_documents ADD CONSTRAINT patent_documents_support_status_check
    CHECK (support_status IN ('supported', 'weak', 'unsupported', 'unchecked'));

-- 5. 唯一约束（同 case 下 claim_number 不重复）
CREATE UNIQUE INDEX IF NOT EXISTS idx_patent_docs_case_claim_number
    ON patent_documents(case_id, claim_number)
    WHERE type = 'claim';

-- 6. 索引
CREATE INDEX IF NOT EXISTS idx_patent_docs_parent ON patent_documents(parent_claim_id);

-- 7. 迁移旧数据：从 patent_documents type='claims' 的 JSON content 拆成逐条 type='claim'
DO $$
DECLARE
    pd_row RECORD;
    cj JSONB;
    new_id UUID;
    claims_arr JSONB;
BEGIN
    FOR pd_row IN
        SELECT id, case_id, content
        FROM patent_documents
        WHERE type = 'claims' AND content IS NOT NULL AND content != '[]' AND content != ''
    LOOP
        BEGIN
            claims_arr := pd_row.content::jsonb;
        EXCEPTION WHEN OTHERS THEN
            CONTINUE;
        END;

        FOR cj IN SELECT * FROM jsonb_array_elements(claims_arr)
        LOOP
            INSERT INTO patent_documents (case_id, type, content, claim_number,
                                           support_status, support_paragraphs, status, ai_rate)
            VALUES (
                pd_row.case_id,
                'claim',
                COALESCE(cj->>'text', ''),
                (cj->>'number')::int,
                COALESCE(cj->>'supportStatus', 'unchecked'),
                COALESCE((SELECT array_agg(x) FROM jsonb_array_elements_text(cj->'supportParagraphs') x), '{}'),
                'draft',
                0
            )
            RETURNING id INTO new_id;
        END LOOP;
    END LOOP;

    -- 回填 parent_claim_id（refClaim number → UUID）
    UPDATE patent_documents child
    SET parent_claim_id = parent.id
    FROM patent_documents parent
    WHERE child.type = 'claim'
      AND parent.type = 'claim'
      AND parent.case_id = child.case_id
      AND child.parent_claim_id IS NULL
      AND parent.claim_number = (
          SELECT (el->>'refClaim')::int
          FROM patent_documents pd,
               jsonb_array_elements(pd.content::jsonb) el
          WHERE pd.case_id = child.case_id
            AND pd.type = 'claims'
            AND (el->>'number')::int = child.claim_number
          LIMIT 1
      );
END $$;

COMMIT;

-- 验证
SELECT '迁移完成：' ||
       (SELECT COUNT(*) FROM patent_documents WHERE type = 'claim') || ' 条权利要求' AS result;

