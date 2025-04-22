-- プロジェクト管理のためのテーブルを作成するSQL

-- 1. プロジェクトテーブルの作成
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    target_url TEXT NOT NULL,
    scan_type TEXT NOT NULL,
    scan_options JSONB,
    status TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    results JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLSポリシーの設定（Row Level Security）
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 3. 所有者（ユーザー自身のプロジェクト）に対するポリシー
CREATE POLICY "ユーザーは自分のプロジェクトを参照可能" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のプロジェクトを作成可能" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のプロジェクトを更新可能" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ユーザーは自分のプロジェクトを削除可能" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- 4. インデックスの作成（パフォーマンス向上のため）
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects (user_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects (created_at);

-- 5. プロジェクト結果テーブルの作成（詳細結果用）
CREATE TABLE IF NOT EXISTS project_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    vuln_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    target_path TEXT,
    description TEXT,
    remediation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 結果テーブルのRLSポリシー設定
ALTER TABLE project_results ENABLE ROW LEVEL SECURITY;

-- 7. 関連するプロジェクトの所有者のみが結果を参照可能
CREATE POLICY "プロジェクト所有者は結果を参照可能" ON project_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE projects.id = project_results.project_id 
            AND projects.user_id = auth.uid()
        )
    );

-- 8. インデックス作成
CREATE INDEX IF NOT EXISTS project_results_project_id_idx ON project_results (project_id);
CREATE INDEX IF NOT EXISTS project_results_severity_idx ON project_results (severity);

-- 注意: このSQLはSupabaseのダッシュボードのSQL Editorで実行してください。
-- 実行にはデータベース管理者権限が必要です。 