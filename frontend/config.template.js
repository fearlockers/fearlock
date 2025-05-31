// 環境変数からSupabase接続情報を取得するためのconfig
// SUPABASE_SETUP.mdの手順に従って新しいプロジェクトを作成した後、
// このファイルをコピーしてconfig.jsとして保存し、URLとキーを更新してください。

const config = {
  // 本番環境用の設定（GitHub Pages）
  production: {
    supabaseUrl: '新しいプロジェクトURL', // 例: https://abcdefghijklm.supabase.co
    supabaseKey: '新しいAPIキー',        // プロジェクト設定のAPIセクションから「anon/public」キー
    apiUrl: 'https://fearlockers.github.io/fearlock/api'
  },
  // 開発環境用の設定
  development: {
    supabaseUrl: '新しいプロジェクトURL', // 例: https://abcdefghijklm.supabase.co
    supabaseKey: '新しいAPIキー',        // プロジェクト設定のAPIセクションから「anon/public」キー
    apiUrl: 'http://localhost:5000/api'
  }
};

// 環境に応じた設定を選択
const currentEnv = location.hostname.includes('github.io') ? 'production' : 'development'; 
const currentConfig = config[currentEnv];

console.log('現在の環境:', currentEnv);
console.log('設定:', currentConfig);

export default currentConfig; 