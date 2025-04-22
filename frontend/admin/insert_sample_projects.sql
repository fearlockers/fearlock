-- サンプルプロジェクトデータを挿入するSQL
-- このSQLはSupabaseのダッシュボードにあるSQL Editorで実行してください
-- 管理者権限が必要です

-- サンプルユーザーIDを取得（既存のユーザーIDに置き換えてください）
-- セキュリティ上の理由から、実際の使用時には特定のユーザーIDを指定する必要があります
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- 既存のユーザーからIDを取得（最初のユーザーを使用）
    SELECT id INTO user_id FROM auth.users LIMIT 1;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'ユーザーが存在しません。ユーザーを作成してからこのSQLを実行してください。';
    END IF;
    
    -- 既存のサンプルプロジェクトを削除（テスト用）
    -- DELETE FROM projects WHERE name LIKE 'サンプルプロジェクト%';
    
    -- サンプルプロジェクト1：実行中（45%完了）
    INSERT INTO projects (
        user_id, name, target_url, scan_type, scan_options, 
        status, progress, created_at, updated_at
    ) VALUES (
        user_id, 
        'サンプルプロジェクト1', 
        'https://example.com', 
        'full', 
        '["xss", "sqli", "csrf"]', 
        'running', 
        45, 
        NOW() - INTERVAL '2 hours', 
        NOW() - INTERVAL '30 minutes'
    );
    
    -- サンプルプロジェクト2：完了済み
    INSERT INTO projects (
        user_id, name, target_url, scan_type, scan_options, 
        status, progress, created_at, updated_at, completed_at
    ) VALUES (
        user_id, 
        'サンプルプロジェクト2', 
        'https://test-site.co.jp', 
        'quick', 
        '["xss", "sqli"]', 
        'completed', 
        100, 
        NOW() - INTERVAL '1 day', 
        NOW() - INTERVAL '23 hours',
        NOW() - INTERVAL '23 hours'
    );
    
    -- サンプルプロジェクト3：準備完了
    INSERT INTO projects (
        user_id, name, target_url, scan_type, scan_options, 
        status, progress, created_at, updated_at
    ) VALUES (
        user_id, 
        'サンプルプロジェクト3', 
        'https://dev.example.org', 
        'custom', 
        '["xss", "openredirect"]', 
        'pending', 
        0, 
        NOW() - INTERVAL '12 hours', 
        NOW() - INTERVAL '12 hours'
    );
    
    -- サンプルプロジェクト4：失敗
    INSERT INTO projects (
        user_id, name, target_url, scan_type, scan_options, 
        status, progress, created_at, updated_at
    ) VALUES (
        user_id, 
        'サンプルプロジェクト4', 
        'https://invalid-url.example', 
        'quick', 
        '["xss"]', 
        'failed', 
        23, 
        NOW() - INTERVAL '3 days', 
        NOW() - INTERVAL '2 days 23 hours'
    );
    
    -- サンプルプロジェクト5：キャンセル済み
    INSERT INTO projects (
        user_id, name, target_url, scan_type, scan_options, 
        status, progress, created_at, updated_at
    ) VALUES (
        user_id, 
        'サンプルプロジェクト5', 
        'https://cancelled.example.net', 
        'full', 
        '["xss", "sqli", "csrf", "openredirect"]', 
        'cancelled', 
        67, 
        NOW() - INTERVAL '5 days', 
        NOW() - INTERVAL '4 days 22 hours'
    );
    
    RAISE NOTICE 'サンプルプロジェクトが正常に作成されました。';
END $$; 