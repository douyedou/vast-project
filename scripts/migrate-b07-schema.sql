-- ============================================================
-- 迁移脚本：适配 B 同学 M07/M08 提交的数据库变更
-- 执行方式：psql -U vast_user -d vast_db -f scripts/migrate-b07-schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. cases 表
-- ============================================================

-- 添加 returned_count
ALTER TABLE cases ADD COLUMN IF NOT EXISTS returned_count INTEGER DEFAULT 0;

-- 扩展 status CHECK 约束，添加 writingcheck
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;
ALTER TABLE cases ADD CONSTRAINT cases_status_check
    CHECK (status::text = ANY (ARRAY[
        'draft'::character varying,
        'assigning'::character varying,
        'searching'::character varying,
        'confirming'::character varying,
        'filing'::character varying,
        'disclosure_pending'::character varying,
        'writing'::character varying,
        'writingcheck'::character varying,
        'reviewing'::character varying,
        'completed'::character varying,
        'rejected'::character varying
    ]::text[]));

COMMENT ON COLUMN cases.returned_count IS 'M08退回修改次数，审核员退回时+1';

-- ============================================================
-- 2. disclosure_documents 表 - 添加 M06 交底模型字段
-- ============================================================

ALTER TABLE disclosure_documents
    ADD COLUMN IF NOT EXISTS tech_problem TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS tech_feature TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS action_relation TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS tech_effect TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS key_protection TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS alternative_solution TEXT DEFAULT '';

COMMENT ON COLUMN disclosure_documents.tech_problem IS 'M06交底模型-技术问题文本';
COMMENT ON COLUMN disclosure_documents.tech_feature IS 'M06交底模型-技术特征文本';
COMMENT ON COLUMN disclosure_documents.action_relation IS 'M06交底模型-作用关系文本';
COMMENT ON COLUMN disclosure_documents.tech_effect IS 'M06交底模型-技术效果文本';
COMMENT ON COLUMN disclosure_documents.key_protection IS 'M06交底模型-关键保护点文本';
COMMENT ON COLUMN disclosure_documents.alternative_solution IS 'M06交底模型-替代方案文本';

-- ============================================================
-- 3. case_engineers 表 - 协作撰写人
-- ============================================================

CREATE TABLE IF NOT EXISTS case_engineers (
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    engineer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (case_id, engineer_id)
);

COMMENT ON TABLE case_engineers IS '案件协作撰写人，主撰写记录在 cases.engineer_id，本表存邀请的协作人';

-- ============================================================
-- 4. reviews 表 - 扩展 result 枚举 + 添加阶段标记
-- ============================================================

ALTER TABLE reviews
    ADD COLUMN IF NOT EXISTS preliminary_done BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS disclosure_done BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS five_books_done BOOLEAN DEFAULT FALSE;

-- 扩展 result CHECK 约束
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_result_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_result_check
    CHECK (result::text = ANY (ARRAY[
        'pass'::character varying,
        'reject'::character varying,
        'pending'::character varying,
        'reject-m06'::character varying,
        'reject-m07'::character varying,
        'reject-case'::character varying
    ]::text[]));

-- ============================================================
-- 5. review_items 表 - 添加阻断项和阶段
-- ============================================================

ALTER TABLE review_items
    ADD COLUMN IF NOT EXISTS is_blocking BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS step VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN review_items.step IS '所属审核步骤：preliminary(初审)/disclosure(交底审核)/five_books(五书审核)/NULL(手动添加)';
COMMENT ON COLUMN review_items.is_blocking IS '是否为审核结论自动生成的阻断项，结论改通过时自动清除';

-- ============================================================
-- 6. 索引优化
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_patent_docs_type ON patent_documents(type);
CREATE INDEX IF NOT EXISTS idx_patent_docs_status ON patent_documents(status);
CREATE INDEX IF NOT EXISTS idx_case_engineers_case ON case_engineers(case_id);
CREATE INDEX IF NOT EXISTS idx_case_engineers_engineer ON case_engineers(engineer_id);

COMMIT;

-- 验证
SELECT 'cases.returned_count: ' || COUNT(*) FROM information_schema.columns WHERE table_name = 'cases' AND column_name = 'returned_count'
UNION ALL
SELECT 'disclosure_documents.new_cols: ' || COUNT(*) FROM information_schema.columns WHERE table_name = 'disclosure_documents' AND column_name IN ('tech_problem','tech_feature','action_relation','tech_effect','key_protection','alternative_solution')
UNION ALL
SELECT 'case_engineers exists: ' || COUNT(*) FROM information_schema.tables WHERE table_name = 'case_engineers'
UNION ALL
SELECT 'reviews.new_cols: ' || COUNT(*) FROM information_schema.columns WHERE table_name = 'reviews' AND column_name IN ('preliminary_done','disclosure_done','five_books_done')
UNION ALL
SELECT 'review_items.new_cols: ' || COUNT(*) FROM information_schema.columns WHERE table_name = 'review_items' AND column_name IN ('is_blocking','step');
