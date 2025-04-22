// 環境変数からSupabase接続情報を取得するためのconfig
const config = {
  // 本番環境用の設定
  production: {
    supabaseUrl: 'https://gvwvgukqpopfhrjtvscp.supabase.co',  // 実際のデプロイ時は環境変数に置き換え
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2d3ZndWtxcG9wZmhyanR2c2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzU2NjksImV4cCI6MjA2MDIxMTY2OX0.NjowVscyeXqsNwfXrYzwkO7ayxg9jJ97fEtpdlnavsE',
    apiUrl: '/api'
  },
  // 開発環境用の設定
  development: {
    supabaseUrl: 'https://gvwvgukqpopfhrjtvscp.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2d3ZndWtxcG9wZmhyanR2c2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzU2NjksImV4cCI6MjA2MDIxMTY2OX0.NjowVscyeXqsNwfXrYzwkO7ayxg9jJ97fEtpdlnavsE',
    apiUrl: 'http://localhost:5000/api'
  }
};

// 環境に応じた設定を選択
const currentConfig = location.hostname === 'localhost' || location.hostname === '127.0.0.1' 
  ? config.development 
  : config.production;

export default currentConfig; 