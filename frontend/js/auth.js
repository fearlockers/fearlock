// Supabaseの設定
const supabaseUrl = 'https://tvdckgrexwhqrzszynjh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZGNrZ3JleHdocXJ6c3p5bmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzMTQzNTIsImV4cCI6MjA2MDg5MDM1Mn0.ZZTp66LPji6NOXfI9X7ece1gm2RN6f9vwFHVw3rqb2I';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'sb-session-cookie',
        storage: {
            getItem: (key) => {
                return getCookie(key);
            },
            setItem: (key, value) => {
                setCookie(key, value, 7); // 7日間有効なCookie
            },
            removeItem: (key) => {
                removeCookie(key);
            }
        }
    }
});

// Cookieヘルパー関数
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=/; SameSite=Strict";
    console.log(`Cookieを設定: ${name}`);
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
            return value;
        }
    }
    return null;
}

function removeCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict';
    console.log(`Cookieを削除: ${name}`);
}

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
        const currentPage = window.location.pathname.split('/').pop() || 'login.html';
        console.log('現在のページ:', currentPage);
        
        const session = await checkSession();
        console.log('セッション状態:', session ? 'ログイン中' : '未ログイン');

        // ダッシュボードページの場合、セッションをチェック
        if (currentPage === 'dashboard.html') {
            if (!session) {
                console.log('未ログインのため、ログインページへリダイレクト');
                window.location.href = 'login.html';
                return;
            } else {
                console.log('ログイン済みのため、ダッシュボードを表示します');
                // ユーザー情報を表示
                displayUserInfo(session.user);
            }
        } else if ((currentPage === 'login.html' || currentPage === 'signup.html') && session) {
            // ログインまたは新規登録ページにアクセスしたが、すでにログイン済みの場合
            console.log('ログイン済みのため、ダッシュボードへリダイレクト');
            window.location.href = 'dashboard.html';
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
    const userEmailElements = document.querySelectorAll('#user-email, #welcome-user-email');
    userEmailElements.forEach(element => {
        if (element) {
            element.textContent = user.email;
        }
    });

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
            
            alert('登録が完了しました！ログインページに移動します。');
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
            console.log('ダッシュボードページに遷移します');
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