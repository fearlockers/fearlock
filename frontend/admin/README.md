# FearLock 管理者向け手順書

このディレクトリには、FearLockアプリケーションの管理者機能に関連するファイルが含まれています。

## データベースセットアップ手順

以下の手順でデータベースのテーブル作成とサンプルデータの投入を行います。

### 1. テーブル作成

Supabaseダッシュボードの「SQL Editor」で以下のSQLファイルを実行します:

- `create_tables.sql` - 基本的なテーブル構造を作成します
- `create_projects_table.sql` - プロジェクト管理のテーブルを作成します

### 2. サンプルデータの投入

アプリケーションのテスト用にサンプルデータを投入するには、以下のSQLファイルを順番に実行します:

1. `insert_sample_projects.sql` - サンプルプロジェクトのデータを作成します
2. `update_project_results.sql` - サンプルプロジェクトに脆弱性結果データを追加します

### 3. テーブル削除

テーブルとデータをリセットする必要がある場合は、以下のSQLファイルを実行します:

- `drop_project_results.sql` - プロジェクト結果テーブルを削除します

## 実行手順

1. Supabaseダッシュボードにログインします
2. 左側のメニューから「SQL Editor」を選択します
3. SQLファイルの内容をコピーしてエディタに貼り付けます
4. 「Run」ボタンをクリックして実行します

## 注意事項

- これらのSQLはデータベース管理者権限で実行する必要があります
- 本番環境では実行前に必ずバックアップを取ってください
- サンプルデータはテスト用であり、テスト完了後は削除することをお勧めします 