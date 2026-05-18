-- ============================================================
-- VAST 8.0 专利智能生产系统 - 数据库 Schema v1.0
-- PostgreSQL 16 + pgvector 扩展
-- 执行方式：psql -U vast_user -d vast_db -f docs/schema.sql
-- ============================================================

-- ============================================================
-- 前置要求（需用超级用户 postgres 执行）：
--   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--   CREATE EXTENSION IF NOT EXISTS vector;
-- ============================================================

-- ============================================================
-- 1. 用户与权限系统（成员 B 负责）
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'applicant' 
        CHECK (role IN ('applicant', 'engineer', 'reviewer', 'admin')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'inactive', 'locked')),
    avatar_url TEXT,
    department VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS '系统用户表';
COMMENT ON COLUMN users.role IS '角色：applicant(交案人), engineer(专利工程师), reviewer(专利审核员), admin(管理员)';

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 2. 案件管理（成员 A 负责：M05 立案 + M09 交案库）
-- ============================================================

CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('invention', 'utility', 'design')),
    status VARCHAR(30) NOT NULL DEFAULT 'draft' 
        CHECK (status IN (
            'draft', 'assigning', 'searching', 'confirming', 'filing',
            'disclosure_pending', 'writing', 'reviewing', 'completed', 'rejected'
        )),
    applicant_id UUID REFERENCES users(id),
    engineer_id UUID REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    description TEXT,
    priority VARCHAR(20) DEFAULT 'normal' 
        CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cases IS '案件主表';
COMMENT ON COLUMN cases.case_id IS '业务编号，如 PAT-20250101-0001';
COMMENT ON COLUMN cases.status IS '案件状态：draft(草稿) → assigning(待分配) → searching(待检索) → confirming(待确认) → filing(待立案) → disclosure_pending(交底书补全中) → writing(撰写中) → reviewing(审核中) → completed(已完成) / rejected(已驳回)';

CREATE TABLE case_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100),
    size BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE case_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    operator_id UUID REFERENCES users(id),
    remark TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. 交底书引擎（成员 C 负责：M06）
-- ============================================================

CREATE TABLE disclosure_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    content_json JSONB NOT NULL DEFAULT '{}',
    ai_suggestions JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'generating', 'completed', 'approved')),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN disclosure_documents.content_json IS '结构化交底书内容，JSON 格式存储各章节';

CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1024),
    source VARCHAR(255),
    source_type VARCHAR(20) 
        CHECK (source_type IN ('patent', 'paper', 'template', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE knowledge_base IS '知识库/RAG 向量库';
COMMENT ON COLUMN knowledge_base.embedding IS '文本向量，1024 维，用于语义检索';
COMMENT ON COLUMN knowledge_base.field IS '技术领域，如 electronics, mechanical, chemical';

CREATE TABLE terminology (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field VARCHAR(50) NOT NULL,
    term VARCHAR(100) NOT NULL,
    definition TEXT,
    synonyms TEXT[],
    usage_example TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(field, term)
);

COMMENT ON TABLE terminology IS '术语库，用于交底书术语统一';

-- ============================================================
-- 4. 专利创作（成员 D 负责：M07 撰写中心 + M08 质检审核）
-- ============================================================

CREATE TABLE patent_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('spec', 'claims', 'abstract', 'drawings')),
    content TEXT,
    status VARCHAR(20) DEFAULT 'draft' 
        CHECK (status IN ('draft', 'writing', 'ai_checking', 'approved')),
    ai_rate INTEGER,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN patent_documents.type IS '文档类型：spec(说明书), claims(权利要求书), abstract(摘要), drawings(附图说明)';
COMMENT ON COLUMN patent_documents.ai_rate IS 'AI 生成比例，0-100';

CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES patent_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    operator_id UUID REFERENCES users(id),
    change_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE document_versions IS '文档版本快照，用于历史回溯';

CREATE TABLE edit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES patent_documents(id) ON DELETE CASCADE,
    paragraph_id VARCHAR(50),
    operation VARCHAR(20) NOT NULL 
        CHECK (operation IN ('insert', 'delete', 'update')),
    old_value TEXT,
    new_value TEXT,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE edit_logs IS '编辑记录，用于 AI 学习和操作审计';

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    result VARCHAR(20) 
        CHECK (result IN ('pass', 'reject', 'pending')),
    comments TEXT,
    ai_suggestions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE review_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL 
        CHECK (type IN ('completeness', 'uniformity', 'novelty', 'form', 'support')),
    content TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium' 
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'resolved', 'ignored')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN review_items.type IS '审核类型：completeness(完整性), uniformity(统一性), novelty(新颖性), form(形式), support(支持性)';

-- ============================================================
-- 索引优化
-- ============================================================

-- 案件查询索引
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_applicant ON cases(applicant_id);
CREATE INDEX idx_cases_engineer ON cases(engineer_id);
CREATE INDEX idx_cases_created ON cases(created_at DESC);

-- 文件查询索引
CREATE INDEX idx_case_files_case ON case_files(case_id);

-- 状态历史索引
CREATE INDEX idx_status_history_case ON case_status_history(case_id, created_at DESC);

-- 知识库向量索引（HNSW 近似最近邻）
CREATE INDEX idx_knowledge_embedding ON knowledge_base 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_field ON knowledge_base(field);

-- 术语库索引
CREATE INDEX idx_terminology_field ON terminology(field);

-- 专利文档索引
CREATE INDEX idx_patent_docs_case ON patent_documents(case_id);
CREATE INDEX idx_patent_docs_type ON patent_documents(type);

-- 编辑日志索引
CREATE INDEX idx_edit_logs_doc ON edit_logs(document_id, created_at DESC);

-- 审核索引
CREATE INDEX idx_reviews_case ON reviews(case_id);

-- ============================================================
-- 初始数据：角色与权限
-- ============================================================

INSERT INTO roles (id, name, description) VALUES
    (uuid_generate_v4(), '交案人', '提交案件、上传材料、查看进度'),
    (uuid_generate_v4(), '专利工程师', '交底书补全、专利撰写'),
    (uuid_generate_v4(), '专利审核员', '质检审核、审批决策'),
    (uuid_generate_v4(), '系统管理员', '用户管理、权限配置、系统设置');

INSERT INTO permissions (id, module, action, description) VALUES
    -- 立案模块
    (uuid_generate_v4(), 'm05', 'read', '查看立案'),
    (uuid_generate_v4(), 'm05', 'create', '创建案件'),
    (uuid_generate_v4(), 'm05', 'update', '修改案件'),
    (uuid_generate_v4(), 'm05', 'delete', '删除案件'),
    -- 交底书模块
    (uuid_generate_v4(), 'm06', 'read', '查看交底书'),
    (uuid_generate_v4(), 'm06', 'create', '生成交底书'),
    (uuid_generate_v4(), 'm06', 'update', '编辑交底书'),
    -- 撰写模块
    (uuid_generate_v4(), 'm07', 'read', '查看文档'),
    (uuid_generate_v4(), 'm07', 'create', '创建文档'),
    (uuid_generate_v4(), 'm07', 'update', '编辑文档'),
    -- 审核模块
    (uuid_generate_v4(), 'm08', 'read', '查看审核'),
    (uuid_generate_v4(), 'm08', 'create', '提交审核'),
    (uuid_generate_v4(), 'm08', 'update', '审核决策'),
    -- 案件管理
    (uuid_generate_v4(), 'm09', 'read', '查看案件库'),
    -- 系统设置
    (uuid_generate_v4(), 'system', 'read', '查看设置'),
    (uuid_generate_v4(), 'system', 'update', '修改设置');

-- 交案人权限：m05(自己的), m09, m06(查看)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = '交案人' AND p.module IN ('m05', 'm09') AND p.action = 'read';

-- 专利工程师权限：m05, m06, m07, m09
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = '专利工程师' AND p.module IN ('m05', 'm06', 'm07', 'm09');

-- 专利审核员权限：m08, m09
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = '专利审核员' AND p.module IN ('m08', 'm09');

-- 管理员权限：全部
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = '系统管理员';

-- 插入测试用户（密码统一为 123456 的 bcrypt hash）
-- UUID 固定，与 seed-data.sql 中的外键引用保持一致
INSERT INTO users (id, username, password_hash, name, email, role) VALUES
    ('53472e7d-b8b1-4ece-ac6a-5b33da933248', 'admin', '$2b$10$9aF54htLESv148/6Ie2bdub3nbeHYIantKUhfvqkYE5t5B3pQxgga', '系统管理员', 'admin@vast.local', 'admin'),
    ('eed9a9d8-6fa1-41c6-8e18-35b42062f087', 'engineer1', '$2b$10$9aF54htLESv148/6Ie2bdub3nbeHYIantKUhfvqkYE5t5B3pQxgga', '张工程师', 'eng1@vast.local', 'engineer'),
    ('00884c9f-ad3c-419a-ad1e-7b7642f9ab5c', 'reviewer1', '$2b$10$9aF54htLESv148/6Ie2bdub3nbeHYIantKUhfvqkYE5t5B3pQxgga', '李审核员', 'rev1@vast.local', 'reviewer'),
    ('f036e1bb-d055-424e-92ec-0b7bf973fcef', 'applicant1', '$2b$10$9aF54htLESv148/6Ie2bdub3nbeHYIantKUhfvqkYE5t5B3pQxgga', '王交案人', 'app1@vast.local', 'applicant');

-- 插入术语库示例数据
INSERT INTO terminology (field, term, definition, synonyms, usage_example) VALUES
    ('electronics', '传感器', '能感受规定的被测量并按照一定规律转换成可用输出信号的器件', 
     ARRAY['sensor', '换能器'], '所述传感器模块用于采集环境温度数据'),
    ('electronics', '深度学习', '基于多层神经网络的机器学习方法',
     ARRAY['deep learning', '神经网络'], '所述AI处理单元采用深度学习模型');

-- 插入知识库示例数据
INSERT INTO knowledge_base (field, title, content, source, source_type) VALUES
    ('electronics', '智能温控系统综述', '智能温控系统通过传感器采集环境数据，利用AI算法预测温度变化趋势...', 
     '专利 CN202310000001', 'patent');

-- ============================================================
-- ============================================================
-- 触发器：自动更新 updated_at
-- 注意：以下需在 superuser 下执行，或确保 vast_user 有创建函数权限
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$func$ language plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disclosure_docs_updated_at BEFORE UPDATE ON disclosure_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patent_docs_updated_at BEFORE UPDATE ON patent_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
