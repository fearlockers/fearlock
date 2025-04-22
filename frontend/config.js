// 環境変数からSupabase接続情報を取得するためのconfig
const config = {
  // 本番環境用の設定（GitHub Pages）
  production: {
    supabaseUrl: 'https://tvdckgrexwhqrzszynjh.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZGNrZ3JleHdocXJ6c3p5bmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTQzNTIsImV4cCI6MjA2MDg5MDM1Mn0.ZZTp66LPji6NOXfI9X7ece1gm2RN6f9vwFHVw3rqb2I',
    apiUrl: 'https://fearlockers.github.io/fearlock/api'
  },
  // 開発環境用の設定
  development: {
    supabaseUrl: 'https://tvdckgrexwhqrzszynjh.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZGNrZ3JleHdocXJ6c3p5bmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTQzNTIsImV4cCI6MjA2MDg5MDM1Mn0.ZZTp66LPji6NOXfI9X7ece1gm2RN6f9vwFHVw3rqb2I',
    apiUrl: 'http://localhost:5000/api'
  }
};

// 環境に応じた設定を選択
const currentEnv = location.hostname.includes('github.io') ? 'production' : 'development'; 
const currentConfig = config[currentEnv];

console.log('現在の環境:', currentEnv);
console.log('設定:', currentConfig);

export default currentConfig; 