-- プロジェクト結果テーブルを削除するSQL

-- 1. テーブルに関連するポリシーの削除
DROP POLICY IF EXISTS "プロジェクト所有者は結果を参照可能" ON project_results;

-- 2. インデックスの削除
DROP INDEX IF EXISTS project_results_project_id_idx;
DROP INDEX IF EXISTS project_results_severity_idx;

-- 3. テーブルの削除
DROP TABLE IF EXISTS project_results;

-- 注意: このSQLはSupabaseのダッシュボードのSQL Editorで実行してください。
-- 実行にはデータベース管理者権限が必要です。 