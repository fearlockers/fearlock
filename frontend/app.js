import config from './config.js';

// デバッグ情報を表示
console.log('アプリケーション初期化中...');
console.log('環境設定:', config);

// パス修正用ヘルパー関数
function getBasePath() {
  // GitHub Pagesでのパスを正しく処理
  return window.location.pathname.includes('/frontend/') ? './' : './';
}

// Supabaseクライアントの初期化
let supabase;
try {
  console.log('Supabaseクライアントを初期化します...');
  console.log('URL:', config.supabaseUrl);
  console.log('Key:', config.supabaseKey ? 'キーが設定されています' : 'キーが未設定です');
  
  supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseKey);
  console.log('Supabaseクライアントの初期化が完了しました', supabase);
} catch (error) {
  console.error('Supabaseクライアントの初期化に失敗しました:', error);
}

// ログインフォームの取得と処理
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    console.log('ログイン試行中...', email);

    try {
        // Supabaseのログイン処理
        console.log('Supabaseログイン処理開始...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        console.log('ログイン応答:', { data, error });

        if (error) {
            console.error('ログインエラー:', error);
            alert('ログインに失敗しました: ' + error.message);
        } else {
            console.log('ログイン成功:', data);
            // ログイン状態をローカルストレージに保存
            localStorage.setItem('isLoggedIn', 'true');
            console.log('ログイン状態をローカルストレージに保存しました');
            window.location.href = 'dashboard.html';
        }
    } catch (e) {
        console.error('ログイン処理中に例外が発生しました:', e);
        alert('ログイン処理中にエラーが発生しました: ' + e.message);
    }
  });
}

// パスワード強度のチェック
function checkPasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) return false;
    if (!hasUpperCase || !hasLowerCase) return false;
    if (!hasNumbers) return false;
    if (!hasSpecialChars) return false;
    
    return true;
}

// 新規登録フォームのイベントリスナー（signup.htmlページで使用）
// コード内で定義しておくが、signup.htmlページでのみ実行される
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log('新規登録フォームが送信されました');
        console.log('Email:', email);
        console.log('Password:', password);

        if (!checkPasswordStrength(password)) {
            alert('パスワードは8文字以上で、大文字、小文字、数字、特殊文字を含む必要があります。');
            return; // パスワードが弱い場合は処理を中断
        }

        try {
            console.log('Supabase新規登録処理開始...');
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            console.log('新規登録応答:', { data, error });

            if (error) {
                console.error('新規登録に失敗しました:', error.message);
                alert('新規登録に失敗しました: ' + error.message);
                return;
            }

            console.log('新規登録成功:', data);
            
            // ユーザー情報をデータベースに保存
            try {
                const user = data.user;
                console.log('ユーザー情報:', user);
                
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([{ id: user.id, email: email }]);

                console.log('データベース挿入応答:', { insertError });

                if (insertError) {
                    console.error('データベースへの保存に失敗しました:', insertError);
                    alert('データベースへの保存に失敗しました: ' + JSON.stringify(insertError));
                } else {
                    console.log('データベースに保存されました');
                    alert('新規登録成功');
                    window.location.href = 'login.html'; // 新規登録後にログイン画面にリダイレクト
                }
            } catch (e) {
                console.error('データベース処理中にエラーが発生しました:', e);
                alert('データベース処理中にエラーが発生しました: ' + e.message);
            }
        } catch (e) {
            console.error('認証処理中にエラーが発生しました:', e);
            alert('認証処理中にエラーが発生しました: ' + e.message);
        }
    });
} 