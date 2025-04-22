import config from './config.js';

// Supabaseクライアントの初期化
const supabase = supabase.createClient(config.supabaseUrl, config.supabaseKey);

document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Supabaseのログイン処理
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('ログインに失敗しました: ' + error.message);
    } else {
        alert('ログイン成功');
        window.location.href = 'dashboard.html';
    }
});

function checkPasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars) {
        return true;
    } else {
        return false;
    }
}

// 新規登録フォームのイベントリスナー（signup.htmlページで使用）
// コード内で定義しておくが、signup.htmlページでのみ実行される
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        console.log('新規登録フォームが送信されました');
        console.log('Email:', email);
        console.log('Password:', password);

        if (!checkPasswordStrength(password)) {
            alert('パスワードは8文字以上で、大文字、小文字、数字、特殊文字を含む必要があります。');
            return; // パスワードが弱い場合は処理を中断
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

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