-- プロジェクトにサンプル脆弱性結果データを追加するSQL
-- このSQLはSupabaseのダッシュボードにあるSQL Editorで実行してください
-- 管理者権限が必要です

-- サンプルプロジェクトに脆弱性結果データを追加
DO $$
DECLARE
    project_id1 UUID;
    project_id2 UUID;
    project_id4 UUID;
    project_id5 UUID;
BEGIN
    -- サンプルプロジェクトのIDを取得
    SELECT id INTO project_id1 FROM projects WHERE name = 'サンプルプロジェクト1' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO project_id2 FROM projects WHERE name = 'サンプルプロジェクト2' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO project_id4 FROM projects WHERE name = 'サンプルプロジェクト4' ORDER BY created_at DESC LIMIT 1;
    SELECT id INTO project_id5 FROM projects WHERE name = 'サンプルプロジェクト5' ORDER BY created_at DESC LIMIT 1;
    
    -- サンプルプロジェクト1（実行中）の脆弱性データを追加
    IF project_id1 IS NOT NULL THEN
        UPDATE projects
        SET results = jsonb_build_array(
            jsonb_build_object(
                'id', '1',
                'type', 'xss',
                'severity', 'high',
                'path', '/search?q=test',
                'description', 'クロスサイトスクリプティングの脆弱性が検出されました',
                'fixed', false
            ),
            jsonb_build_object(
                'id', '2',
                'type', 'sqli', 
                'severity', 'medium',
                'path', '/products?id=1',
                'description', 'SQLインジェクションの脆弱性が検出されました',
                'fixed', false
            )
        )
        WHERE id = project_id1;
    END IF;
    
    -- サンプルプロジェクト2（完了）の脆弱性データを追加
    IF project_id2 IS NOT NULL THEN
        UPDATE projects
        SET results = jsonb_build_array(
            jsonb_build_object(
                'id', '3',
                'type', 'xss',
                'severity', 'medium',
                'path', '/contact',
                'description', 'フォーム入力でのXSS脆弱性',
                'fixed', true
            ),
            jsonb_build_object(
                'id', '4',
                'type', 'csrf',
                'severity', 'low',
                'path', '/account/settings',
                'description', 'CSRFトークンが実装されていません',
                'fixed', true
            ),
            jsonb_build_object(
                'id', '5',
                'type', 'sqli',
                'severity', 'high',
                'path', '/admin/users',
                'description', '管理画面でのSQLインジェクション脆弱性',
                'fixed', false
            )
        )
        WHERE id = project_id2;
    END IF;
    
    -- サンプルプロジェクト4（失敗）の脆弱性データを追加（部分的な結果）
    IF project_id4 IS NOT NULL THEN
        UPDATE projects
        SET results = jsonb_build_array(
            jsonb_build_object(
                'id', '6',
                'type', 'error',
                'severity', 'info',
                'path', '/',
                'description', 'スキャン実行中にエラーが発生しました。URLにアクセスできません。',
                'fixed', false
            )
        )
        WHERE id = project_id4;
    END IF;
    
    -- サンプルプロジェクト5（キャンセル）の脆弱性データを追加（部分的な結果）
    IF project_id5 IS NOT NULL THEN
        UPDATE projects
        SET results = jsonb_build_array(
            jsonb_build_object(
                'id', '7',
                'type', 'xss',
                'severity', 'high',
                'path', '/blog?post=1',
                'description', 'ブログ投稿ページでのXSS脆弱性',
                'fixed', false
            ),
            jsonb_build_object(
                'id', '8',
                'type', 'openredirect',
                'severity', 'medium',
                'path', '/redirect?url=https://example.com',
                'description', 'オープンリダイレクト脆弱性',
                'fixed', false
            )
        )
        WHERE id = project_id5;
    END IF;
    
    RAISE NOTICE 'プロジェクトの脆弱性結果データが正常に更新されました。';
END $$; 