-- ============================================================
-- 迁移脚本：补齐 B 同学 M07 专利文档相关表和字段
-- ============================================================

BEGIN;

-- 1. patent_documents 说明书六章字段
ALTER TABLE patent_documents
    ADD COLUMN IF NOT EXISTS tech_field TEXT,
    ADD COLUMN IF NOT EXISTS background TEXT,
    ADD COLUMN IF NOT EXISTS summary TEXT,
    ADD COLUMN IF NOT EXISTS drawings_desc TEXT,
    ADD COLUMN IF NOT EXISTS embodiment TEXT,
    ADD COLUMN IF NOT EXISTS effects TEXT;

COMMENT ON COLUMN patent_documents.tech_field IS '技术领域章节，type=spec 时使用';
COMMENT ON COLUMN patent_documents.background IS '背景技术章节，type=spec 时使用';
COMMENT ON COLUMN patent_documents.summary IS '发明内容章节，type=spec 时使用';
COMMENT ON COLUMN patent_documents.drawings_desc IS '附图说明章节，type=spec 时使用';
COMMENT ON COLUMN patent_documents.embodiment IS '具体实施方式章节，type=spec 时使用';
COMMENT ON COLUMN patent_documents.effects IS '有益效果章节，type=spec 时使用';

-- 2. 扩展 patent_documents status CHECK，添加 pending_review
ALTER TABLE patent_documents DROP CONSTRAINT IF EXISTS patent_documents_status_check;
ALTER TABLE patent_documents ADD CONSTRAINT patent_documents_status_check
    CHECK (status::text = ANY (ARRAY[
        'draft'::character varying,
        'writing'::character varying,
        'ai_checking'::character varying,
        'approved'::character varying,
        'pending_review'::character varying
    ]::text[]));

-- 3. 创建 document_images 表
CREATE TABLE IF NOT EXISTS document_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES patent_documents(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    caption TEXT,
    description TEXT,
    position INTEGER DEFAULT 0,
    section VARCHAR(50) DEFAULT 'drawings',
    is_abstract_figure BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE document_images IS '说明书附图存储，通过 document_id 绑定说明书';
COMMENT ON COLUMN document_images.document_id IS '所属说明书（patent_documents type=spec）';
COMMENT ON COLUMN document_images.section IS '所属说明书章节：tech-field/background/summary/drawings/embodiment/effects';
COMMENT ON COLUMN document_images.is_abstract_figure IS '是否为摘要附图，每个 case 仅一张';

CREATE INDEX IF NOT EXISTS idx_document_images_case ON document_images(case_id);
CREATE INDEX IF NOT EXISTS idx_document_images_document ON document_images(document_id);

-- 4. 创建 document_versions 表
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES patent_documents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    content TEXT,
    content_json JSONB,
    change_summary TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 创建 edit_logs 表
CREATE TABLE IF NOT EXISTS edit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES patent_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    content_before TEXT,
    content_after TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMIT;

-- 验证
SELECT 'patent_documents.new_cols: ' || COUNT(*) FROM information_schema.columns WHERE table_name = 'patent_documents' AND column_name IN ('tech_field','background','summary','drawings_desc','embodiment','effects')
UNION ALL
SELECT 'document_images exists: ' || COUNT(*) FROM information_schema.tables WHERE table_name = 'document_images'
UNION ALL
SELECT 'document_versions exists: ' || COUNT(*) FROM information_schema.tables WHERE table_name = 'document_versions'
UNION ALL
SELECT 'edit_logs exists: ' || COUNT(*) FROM information_schema.tables WHERE table_name = 'edit_logs';
