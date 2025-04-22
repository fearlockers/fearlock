// Supabaseの設定とCookieベースのセッション管理
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

// 現在のユーザーのセッション情報
let currentUser = null;

// ページ読み込み時のイベントリスナー
document.addEventListener('DOMContentLoaded', async function() {
    console.log('ダッシュボードの初期化を開始します...');
    
    try {
        // ユーザーセッションの取得
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('セッション取得エラー:', error);
            window.location.href = 'login.html';
            return;
        }
        
        if (!data.session) {
            console.warn('有効なセッションがありません。ログインページにリダイレクトします。');
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = data.session.user;
        console.log('現在のユーザー:', currentUser);
        
        // データベーステーブルの存在確認
        await checkAndCreateProjectsTable();
        
        // ダッシュボードの初期化
        initializeDashboard();
        
        // プロジェクト一覧の読み込み
        loadUserProjects();
        
        // イベントリスナーの設定
        setupEventListeners();
    } catch (err) {
        console.error('ダッシュボード初期化中にエラーが発生しました:', err);
        alert('ダッシュボードの読み込み中にエラーが発生しました。ページをリロードしてください。');
    }
});

// データベースのプロジェクトテーブルが存在するか確認し、必要に応じて作成
async function checkAndCreateProjectsTable() {
    try {
        console.log('データベースの確認を行っています...');
        
        // Supabaseスキーマ情報を取得
        const { error: schemaError } = await supabase
            .from('projects')
            .select('id')
            .limit(1);
        
        if (schemaError) {
            console.warn('プロジェクトテーブルが存在しないか、アクセスできません:', schemaError);
            console.log('テーブルの自動作成はSupabaseのRlSポリシー制限により実行できません。');
            console.log('Supabaseダッシュボードでテーブルが正しく設定されていることを確認してください。');
        } else {
            console.log('プロジェクトテーブルが正常に確認できました');
        }
    } catch (err) {
        console.error('データベース確認中にエラーが発生しました:', err);
    }
}

// ダッシュボードの初期化
function initializeDashboard() {
    console.log('ダッシュボードUIを初期化中...');
    
    // ユーザー情報の表示
    displayUserInfo();
    
    // サイドナビゲーションのセットアップ
    setupNavigation();
}

// ユーザー情報の表示
function displayUserInfo() {
    if (!currentUser) return;
    
    // ユーザーのメールアドレスを表示
    const userEmailElements = document.querySelectorAll('#user-email, #welcome-user-email');
    userEmailElements.forEach(element => {
        if (element) element.textContent = currentUser.email;
    });
    
    // ユーザーの詳細情報を表示
    const userDetailsElement = document.getElementById('user-details');
    if (userDetailsElement) {
        userDetailsElement.innerHTML = `
            <p><strong>ユーザーID:</strong> ${currentUser.id}</p>
            <p><strong>メールアドレス:</strong> ${currentUser.email}</p>
            <p><strong>最終更新:</strong> ${new Date(currentUser.updated_at || currentUser.created_at).toLocaleString()}</p>
        `;
    }
}

// サイドナビゲーションのセットアップ
function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav li a');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // アクティブなナビアイテムを更新
            navItems.forEach(nav => nav.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');
            
            // 対応するセクションを表示
            const targetId = this.getAttribute('href').slice(1);
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId + '-section') {
                    section.classList.add('active');
                }
            });
            
            // ヘッダータイトルを更新
            const headerTitle = document.querySelector('.dashboard-header h1');
            if (headerTitle) {
                headerTitle.textContent = this.textContent.trim();
            }
        });
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    // ログアウトボタン
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                await supabase.auth.signOut();
                window.location.href = 'login.html';
            } catch (error) {
                console.error('ログアウトエラー:', error);
                alert('ログアウト中にエラーが発生しました。');
            }
        });
    }
    
    // 新規プロジェクト作成フォーム
    const newScanForm = document.getElementById('new-scan-form');
    if (newScanForm) {
        newScanForm.addEventListener('submit', handleNewProjectSubmit);
    }
    
    // スキャンタイプの選択
    const scanTypeOptions = document.querySelectorAll('.scan-type-option');
    scanTypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            scanTypeOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            const radioInput = this.querySelector('input[type="radio"]');
            if (radioInput) radioInput.checked = true;
            
            // カスタムタイプが選択された場合、オプションを有効化
            const isCustom = this.getAttribute('data-type') === 'custom';
            const scanOptionCards = document.querySelectorAll('.scan-option-card');
            if (isCustom) {
                scanOptionCards.forEach(card => {
                    card.classList.remove('disabled');
                    card.addEventListener('click', toggleScanOption);
                });
            } else {
                // 非カスタムの場合はすべてのオプションを選択状態にする
                scanOptionCards.forEach(card => {
                    if (this.getAttribute('data-type') === 'quick') {
                        // クイックスキャンでは基本的なオプションのみ選択
                        const option = card.getAttribute('data-option');
                        if (['xss', 'sqli'].includes(option)) {
                            card.classList.add('selected');
                        } else {
                            card.classList.remove('selected');
                        }
                    } else {
                        // フルスキャンではすべてのオプションを選択
                        card.classList.add('selected');
                    }
                    card.classList.add('disabled');
                    card.removeEventListener('click', toggleScanOption);
                });
            }
        });
    });
    
    // 初期状態でスキャンオプションの選択を有効化/無効化
    const initialScanType = document.querySelector('.scan-type-option.selected');
    if (initialScanType && initialScanType.getAttribute('data-type') !== 'custom') {
        const scanOptionCards = document.querySelectorAll('.scan-option-card');
        scanOptionCards.forEach(card => {
            if (initialScanType.getAttribute('data-type') === 'quick') {
                const option = card.getAttribute('data-option');
                if (['xss', 'sqli'].includes(option)) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            } else {
                card.classList.add('selected');
            }
            card.classList.add('disabled');
        });
    } else {
        // カスタムタイプが選択されている場合、オプションを有効化
        const scanOptionCards = document.querySelectorAll('.scan-option-card');
        scanOptionCards.forEach(card => {
            card.addEventListener('click', toggleScanOption);
        });
    }
}

// スキャンオプションの切り替え
function toggleScanOption() {
    this.classList.toggle('selected');
}

// 新規プロジェクト作成の処理
async function handleNewProjectSubmit(event) {
    event.preventDefault();
    
    // 入力検証
    const projectNameInput = document.getElementById('project-name');
    const targetUrlInput = document.getElementById('target-url');
    
    if (!projectNameInput.value || !targetUrlInput.value) {
        alert('プロジェクト名とターゲットURLを入力してください。');
        return;
    }
    
    // ユーザーセッション確認
    if (!currentUser) {
        console.error('現在のユーザー情報がありません');
        alert('セッションが無効です。再ログインしてください。');
        window.location.href = 'login.html';
        return;
    }
    
    // フォームデータの取得
    const projectName = projectNameInput.value;
    const targetUrl = targetUrlInput.value;
    const scanType = document.querySelector('.scan-type-option.selected').getAttribute('data-type');
    
    // スキャンオプションの取得
    const scanOptions = [];
    document.querySelectorAll('.scan-option-card.selected').forEach(option => {
        scanOptions.push(option.getAttribute('data-option'));
    });
    
    // プロジェクト作成ボタンを無効化
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = '作成中...';
    
    // 作成する新規プロジェクトデータ
    const newProject = {
        user_id: currentUser.id,
        name: projectName,
        target_url: targetUrl,
        scan_type: scanType,
        scan_options: scanOptions,
        status: 'pending',
        progress: 0,
        created_at: new Date().toISOString()
    };
    
    console.log('新規プロジェクト作成:', newProject);
    
    try {
        // データベースにプロジェクトを作成
        const { data, error } = await supabase
            .from('projects')
            .insert([newProject])
            .select();
        
        if (error) {
            console.error('プロジェクト作成エラー詳細:', error);
            throw new Error(`プロジェクト作成に失敗しました: ${error.message || '不明なエラー'}`);
        }
        
        console.log('プロジェクトが正常に作成されました:', data);
        
        // フォームをリセット
        event.target.reset();
        
        // プロジェクト一覧を更新
        await loadUserProjects();
        
        // ダッシュボードタブに切り替え
        document.querySelector('.sidebar-nav li a[href="#dashboard"]').click();
        
        alert('プロジェクトが正常に作成されました！');
    } catch (error) {
        console.error('プロジェクト作成エラー:', error);
        alert(error.message || 'プロジェクトの作成中にエラーが発生しました。もう一度お試しください。');
    } finally {
        // ボタンを再度有効化
        submitButton.disabled = false;
        submitButton.textContent = 'プロジェクト作成';
    }
}

// ユーザーのプロジェクト一覧を読み込む
async function loadUserProjects() {
    if (!currentUser) {
        console.warn('ユーザー情報がないためプロジェクト一覧を読み込めません');
        return;
    }
    
    const ongoingContainer = document.getElementById('ongoingProjectsContainer');
    if (!ongoingContainer) {
        console.warn('プロジェクト表示用コンテナが見つかりません');
        return;
    }
    
    try {
        console.log(`ユーザーID: ${currentUser.id} のプロジェクト一覧を取得中...`);
        
        // プロジェクト一覧を取得
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('プロジェクト一覧取得エラー:', error);
            throw error;
        }
        
        console.log(`${data ? data.length : 0}件のプロジェクトを取得しました:`, data);
        
        // コンテナを空にする
        ongoingContainer.innerHTML = '';
        
        if (!data || data.length === 0) {
            ongoingContainer.innerHTML = '<p class="no-projects">プロジェクトがありません。新規プロジェクトを作成してください。</p>';
            return;
        }
        
        // プロジェクトカードを作成
        data.forEach(project => {
            const projectCard = createProjectCard(project);
            ongoingContainer.appendChild(projectCard);
        });
    } catch (error) {
        console.error('プロジェクト読み込みエラー:', error);
        ongoingContainer.innerHTML = '<p class="error">プロジェクトの読み込み中にエラーが発生しました。</p>';
    }
}

// プロジェクトカードを作成
function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.setAttribute('data-project-id', project.id);
    
    // ステータスに応じたクラスを追加
    const statusClass = getStatusClass(project.status);
    
    // プログレスバーの表示
    const progressWidth = project.progress || 0;
    
    card.innerHTML = `
        <div class="project-header">
            <div class="project-title">${project.name}</div>
            <div class="project-status ${statusClass}">${getStatusText(project.status)}</div>
        </div>
        <div class="project-details">
            <div><i class="fas fa-globe"></i> ${project.target_url}</div>
            <div><i class="fas fa-clock"></i> 作成: ${new Date(project.created_at).toLocaleString()}</div>
        </div>
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressWidth}%;"></div>
            </div>
            <div class="progress-stats">
                <div>進捗: ${progressWidth}%</div>
                <div>${getEstimatedTimeRemaining(project)}</div>
            </div>
        </div>
        <div class="project-actions">
            <button class="btn btn-sm btn-view-details" data-project-id="${project.id}">詳細を表示</button>
            ${project.status === 'running' ? '<button class="btn btn-sm btn-cancel" data-project-id="' + project.id + '">中止</button>' : ''}
        </div>
    `;
    
    // イベントリスナーの追加
    const viewButton = card.querySelector('.btn-view-details');
    viewButton.addEventListener('click', () => {
        showProjectDetails(project.id);
    });
    
    const cancelButton = card.querySelector('.btn-cancel');
    if (cancelButton) {
        cancelButton.addEventListener('click', () => {
            cancelProject(project.id);
        });
    }
    
    return card;
}

// ステータスに応じたクラスを取得
function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'status-pending';
        case 'running': return 'status-running';
        case 'completed': return 'status-completed';
        case 'failed': return 'status-failed';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}

// ステータスに応じたテキストを取得
function getStatusText(status) {
    switch (status) {
        case 'pending': return '準備完了';
        case 'running': return '実行中';
        case 'completed': return '完了';
        case 'failed': return '失敗';
        case 'cancelled': return 'キャンセル';
        default: return status;
    }
}

// 予想残り時間を取得
function getEstimatedTimeRemaining(project) {
    if (project.status === 'completed') {
        return '完了';
    }
    
    if (project.status === 'failed' || project.status === 'cancelled') {
        return '-';
    }
    
    if (project.status === 'pending') {
        return '未開始';
    }
    
    // 簡易的な残り時間計算（実際には正確なアルゴリズムが必要）
    const progress = project.progress || 0;
    if (progress === 0) return '計算中...';
    
    const remaining = 100 - progress;
    if (remaining <= 10) return '残り僅か';
    if (remaining <= 30) return '残り数分';
    return '約15分';
}

// プロジェクト詳細を表示
function showProjectDetails(projectId) {
    console.log('プロジェクト詳細を表示:', projectId);
    // プロジェクト詳細表示の実装（今後追加）
    alert('プロジェクト詳細機能は開発中です（プロジェクトID: ' + projectId + '）');
}

// プロジェクトをキャンセル
async function cancelProject(projectId) {
    if (!confirm('本当にこのプロジェクトをキャンセルしますか？')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('projects')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', projectId);
        
        if (error) {
            console.error('プロジェクトキャンセルエラー:', error);
            throw error;
        }
        
        console.log('プロジェクトがキャンセルされました:', projectId);
        
        // プロジェクト一覧を更新
        await loadUserProjects();
    } catch (error) {
        console.error('プロジェクトキャンセルエラー:', error);
        alert('プロジェクトのキャンセル中にエラーが発生しました。');
    }
} 