-- プロジェクト情報を保存するためのテーブル作成スクリプト
-- Supabaseダッシュボードの「SQL Editor」で実行してください

-- projects テーブルの作成
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_url TEXT NOT NULL,
  scan_type TEXT NOT NULL,
  scan_options JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  results JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX projects_user_id_idx ON public.projects (user_id);
CREATE INDEX projects_status_idx ON public.projects (status);

-- RLSポリシーの設定（Row Level Security）
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のプロジェクトのみ参照可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ参照可能" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのみ追加可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ追加可能" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのみ更新可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ更新可能" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーは自分のプロジェクトのみ削除可能
CREATE POLICY "ユーザーは自分のプロジェクトのみ削除可能" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- テーブルの公開設定
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO anon, authenticated, service_role;

-- プロジェクトステータス用の自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- プロジェクトテーブルに更新時刻の自動更新トリガーを設定
CREATE TRIGGER update_projects_timestamp
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- 確認メッセージ
SELECT 'projects テーブルが正常に作成されました' as message; 