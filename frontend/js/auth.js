// Supabaseの設定
const supabaseUrl = 'https://gvwvgukqpopfhrjtvscp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2d3ZndWtxcG9wZmhyanR2c2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2MzU2NjksImV4cCI6MjA2MDIxMTY2OX0.NjowVscyeXqsNwfXrYzwkO7ayxg9jJ97fEtpdlnavsE';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ユーザーのセッションをチェック
async function checkSession() {
    try {
        console.log('セッションをチェック中...');
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('セッションの取得に失敗しました:', error);
            return null;
        }
        
        console.log('セッションデータ:', data);
        return data.session;
    } catch (e) {
        console.error('セッションチェック中にエラーが発生しました:', e);
        return null;
    }
}

// ページの初期化
async function initPage() {
    try {
        const currentPage = window.location.pathname.split('/').pop();
        console.log('現在のページ:', currentPage);
        
        const session = await checkSession();
        console.log('セッション状態:', session ? 'ログイン中' : '未ログイン');

        // ログインが必要なページで未ログインの場合はリダイレクト
        if (currentPage === 'dashboard.html' && !session) {
            console.log('未ログインのため、ログインページへリダイレクト');
            window.location.href = 'login.html';
            return;
        }

        // ログイン状態でログインページや登録ページにアクセスした場合はダッシュボードへリダイレクト
        if ((currentPage === 'login.html' || currentPage === 'signup.html') && session) {
            console.log('ログイン済みですが、ログインページへのアクセスを許可します');
            // ダッシュボードへの自動リダイレクトを削除
            return;
        }

        // ダッシュボードページの場合はユーザー情報を表示
        if (currentPage === 'dashboard.html' && session) {
            console.log('ダッシュボードにユーザー情報を表示');
            displayUserInfo(session.user);
        }
    } catch (e) {
        console.error('ページ初期化中にエラーが発生しました:', e);
    }
}

// ユーザー情報の表示
function displayUserInfo(user) {
    if (!user) {
        console.error('ユーザー情報が存在しません');
        return;
    }

    console.log('表示するユーザー情報:', user);

    // ユーザーのメールアドレスを表示
    const userEmailElement = document.getElementById('user-email');
    if (userEmailElement) {
        userEmailElement.textContent = user.email;
    }

    // ユーザーの詳細情報を表示
    const userDetailsElement = document.getElementById('user-details');
    if (userDetailsElement) {
        userDetailsElement.innerHTML = `
            <p><strong>ユーザーID:</strong> ${user.id}</p>
            <p><strong>メールアドレス:</strong> ${user.email}</p>
            <p><strong>最終更新:</strong> ${new Date(user.updated_at || user.created_at).toLocaleString()}</p>
        `;
    }
}

// パスワードの強度をチェック
function checkPasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: 'パスワードは8文字以上である必要があります' };
    }
    
    if (!hasUpperCase || !hasLowerCase) {
        return { valid: false, message: 'パスワードは大文字と小文字を含む必要があります' };
    }
    
    if (!hasNumbers) {
        return { valid: false, message: 'パスワードは数字を含む必要があります' };
    }
    
    if (!hasSpecialChars) {
        return { valid: false, message: 'パスワードは特殊文字を含む必要があります' };
    }
    
    return { valid: true };
}

// 新規登録フォームのイベントリスナー
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // パスワードの強度をチェック
        const passwordCheck = checkPasswordStrength(password);
        if (!passwordCheck.valid) {
            alert(passwordCheck.message);
            return;
        }
        
        // Supabaseで新規登録
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });
            
            if (error) {
                throw error;
            }
            
            const user = data.user;
            console.log('新規登録成功:', user);
            
            // ユーザーテーブルにデータを保存
            if (user) {
                try {
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert([{ id: user.id, email: user.email }]);
                        
                    if (insertError) {
                        console.error('ユーザー情報の保存に失敗しました:', insertError);
                    }
                } catch (dbError) {
                    console.error('データベース操作でエラーが発生しました:', dbError);
                }
            }
            
            alert('登録が完了しました！メールを確認してアカウントを有効化してください。');
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('新規登録中にエラーが発生しました:', error);
            alert(`新規登録に失敗しました: ${error.message}`);
        }
    });
}

// ログインフォームのイベントリスナー
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            
            if (error) {
                throw error;
            }
            
            console.log('ログイン成功:', data);
            window.location.href = 'dashboard.html';
            
        } catch (error) {
            console.error('ログイン中にエラーが発生しました:', error);
            alert(`ログインに失敗しました: ${error.message}`);
        }
    });
}

// ログアウトボタンのイベントリスナー
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                throw error;
            }
            
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('ログアウト中にエラーが発生しました:', error);
            alert(`ログアウトに失敗しました: ${error.message}`);
        }
    });
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', initPage); 