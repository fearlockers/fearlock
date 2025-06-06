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

// デバイス情報の取得
function getDeviceInfo() {
    const device = {
        width: window.innerWidth,
        height: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
        isDesktop: window.innerWidth > 1024,
        userAgent: navigator.userAgent
    };
    
    return device;
}

// フォーマット関数
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// レポートの作成
function generateReportHTML(projectData) {
    if (!projectData) return '';
    
    const vulnerabilityCount = {
        high: 0,
        medium: 0,
        low: 0,
        info: 0
    };
    
    // 脆弱性の集計（実際のデータ構造に合わせて調整が必要）
    if (projectData.results && Array.isArray(projectData.results)) {
        projectData.results.forEach(vuln => {
            if (vuln.severity && vulnerabilityCount[vuln.severity.toLowerCase()] !== undefined) {
                vulnerabilityCount[vuln.severity.toLowerCase()]++;
            }
        });
    }

    return `
        <div class="report-header">
            <h3>${escapeHtml(projectData.name)} - スキャンレポート</h3>
            <p>対象URL: ${escapeHtml(projectData.target_url)}</p>
            <p>実行日時: ${formatDate(projectData.created_at)}</p>
        </div>
        <div class="report-summary">
            <div class="vuln-stat high">
                <span class="count">${vulnerabilityCount.high}</span>
                <span class="label">高リスク</span>
            </div>
            <div class="vuln-stat medium">
                <span class="count">${vulnerabilityCount.medium}</span>
                <span class="label">中リスク</span>
            </div>
            <div class="vuln-stat low">
                <span class="count">${vulnerabilityCount.low}</span>
                <span class="label">低リスク</span>
            </div>
            <div class="vuln-stat info">
                <span class="count">${vulnerabilityCount.info}</span>
                <span class="label">情報</span>
            </div>
        </div>
    `;
}

// HTMLエスケープ関数
function escapeHtml(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// UIユーティリティ
function showModal(title, content) {
    // モーダルがすでに存在する場合は削除
    const existingModal = document.querySelector('.modal-container');
    if (existingModal) {
        document.body.removeChild(existingModal);
    }
    
    // モーダル要素の作成
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container';
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'modal-close';
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    });
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    if (typeof content === 'string') {
        modalContent.innerHTML = content;
    } else {
        modalContent.appendChild(content);
    }
    
    // モーダル要素の構築
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    
    modal.appendChild(modalHeader);
    modal.appendChild(modalContent);
    
    modalContainer.appendChild(modal);
    
    // モーダル外クリックで閉じる
    modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
            document.body.removeChild(modalContainer);
        }
    });
    
    // モーダルを表示
    document.body.appendChild(modalContainer);
    
    return modalContainer;
}

// 通知表示
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // 通知コンテナの作成/取得
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // 通知を追加
    notificationContainer.appendChild(notification);
    
    // 一定時間後に通知を削除
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            
            // 通知がなくなったらコンテナも削除
            if (notificationContainer.children.length === 0) {
                document.body.removeChild(notificationContainer);
            }
        }, 300);
    }, duration);
    
    return notification;
}

// CSVエクスポート
function exportToCSV(data, filename = 'export.csv') {
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('エクスポートするデータがありません');
        return false;
    }
    
    // ヘッダー行の作成
    const headers = Object.keys(data[0]);
    
    // CSVデータの作成
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header] === null || row[header] === undefined ? '' : row[header];
            // 値に特殊文字が含まれている場合は引用符で囲む
            const escaped = String(value).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvContent += values.join(',') + '\n';
    });
    
    // CSVのダウンロード
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
}

// グローバルに公開する機能
window.dashboardUtils = {
    cookies: {
        set: setCookie,
        get: getCookie,
        remove: removeCookie
    },
    device: getDeviceInfo,
    format: {
        date: formatDate,
        bytes: formatBytes
    },
    ui: {
        showModal,
        showNotification
    },
    report: {
        generate: generateReportHTML
    },
    export: {
        csv: exportToCSV
    },
    escapeHtml
};

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
async function showProjectDetails(projectId) {
    console.log('プロジェクト詳細を表示:', projectId);
    
    try {
        // プロジェクトデータを取得
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (error) {
            console.error('プロジェクト取得エラー:', error);
            throw error;
        }
        
        if (!project) {
            throw new Error('プロジェクトが見つかりません');
        }
        
        console.log('取得したプロジェクト詳細:', project);
        
        // プロジェクト詳細画面に切り替え
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        const projectSection = document.getElementById('project-section');
        if (projectSection) {
            projectSection.classList.add('active');
        }
        
        // プロジェクトタイトルを設定
        const projectTitle = document.getElementById('project-title');
        if (projectTitle) {
            projectTitle.textContent = project.name;
        }
        
        // ダッシュボードヘッダーのタイトルを更新
        const headerTitle = document.querySelector('.dashboard-header h1');
        if (headerTitle) {
            headerTitle.textContent = 'プロジェクト詳細';
        }
        
        // ステップバーの初期状態を設定
        setupStepFlow(project);
        
        // プロジェクト情報を表示
        displayProjectInfo(project);
        
        // ダッシュボードに戻るボタンのイベントリスナーを設定
        const backButton = document.getElementById('back-to-dashboard');
        if (backButton) {
            // 既存のイベントリスナーを削除
            const newBackButton = backButton.cloneNode(true);
            backButton.parentNode.replaceChild(newBackButton, backButton);
            
            // 新しいイベントリスナーを追加
            newBackButton.addEventListener('click', function() {
                // ダッシュボードに戻る
                document.querySelector('.sidebar-nav li a[href="#dashboard"]').click();
            });
        }
        
    } catch (error) {
        console.error('プロジェクト詳細表示エラー:', error);
        alert('プロジェクト詳細の表示中にエラーが発生しました: ' + error.message);
        // エラー時はダッシュボードに戻る
        document.querySelector('.sidebar-nav li a[href="#dashboard"]').click();
    }
}

// ステップフローバーの設定
function setupStepFlow(project) {
    const steps = document.querySelectorAll('.step-flow-bar .step');
    
    // 全てのステップをリセット
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // プロジェクトの状態に応じてステップを設定
    const infoStep = document.querySelector('.step[data-step="info"]');
    const progressStep = document.querySelector('.step[data-step="progress"]');
    const resultsStep = document.querySelector('.step[data-step="results"]');
    const reportStep = document.querySelector('.step[data-step="report"]');
    
    if (infoStep) infoStep.classList.add('active');
    
    if (project.status === 'completed') {
        // 完了済みの場合は全てのステップが完了
        if (infoStep) infoStep.classList.add('completed');
        if (progressStep) progressStep.classList.add('completed');
        if (resultsStep) {
            resultsStep.classList.add('completed');
            resultsStep.classList.add('active');
        }
    } else if (project.status === 'running') {
        // 実行中の場合は進捗ステップがアクティブ
        if (infoStep) infoStep.classList.add('completed');
        if (progressStep) {
            progressStep.classList.add('active');
        }
    }
    
    // ステップクリックのイベントリスナーを設定
    steps.forEach(step => {
        // 既存のイベントリスナーを削除するためにクローン
        const newStep = step.cloneNode(true);
        step.parentNode.replaceChild(newStep, step);
        
        // 新しいイベントリスナーを追加
        newStep.addEventListener('click', function() {
            const targetStep = this.getAttribute('data-step');
            showProjectTab(targetStep, project);
        });
    });
}

// プロジェクトタブを表示
function showProjectTab(tabName, project) {
    // すべてのタブコンテンツを非表示
    const tabContents = document.querySelectorAll('.project-tab-content');
    tabContents.forEach(tab => {
        tab.classList.remove('active');
    });
    
    // すべてのステップから active クラスを削除
    const steps = document.querySelectorAll('.step-flow-bar .step');
    steps.forEach(step => {
        step.classList.remove('active');
    });
    
    // 選択されたステップに active クラスを追加
    const selectedStep = document.querySelector(`.step[data-step="${tabName}"]`);
    if (selectedStep) {
        selectedStep.classList.add('active');
    }
    
    // 選択されたタブを表示
    const selectedTab = document.getElementById(`project-${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // タブ内容を更新
    switch (tabName) {
        case 'info':
            displayProjectInfo(project);
            break;
        case 'progress':
            displayProjectProgress(project);
            break;
        case 'results':
            displayProjectResults(project);
            break;
        case 'report':
            displayProjectReport(project);
            break;
    }
}

// プロジェクト情報タブの表示
function displayProjectInfo(project) {
    const infoContainer = document.querySelector('#project-info-tab .project-details-info');
    if (!infoContainer) return;
    
    // スキャンオプションの整形
    let scanOptions = '';
    if (project.scan_options && Array.isArray(project.scan_options)) {
        scanOptions = project.scan_options.join(', ');
    }
    
    infoContainer.innerHTML = `
        <div class="scan-status-banner ${project.status === 'completed' ? 'success' : ''}">
            <i class="fas ${project.status === 'completed' ? 'fa-check-circle' : 'fa-spinner fa-spin'}"></i>
            <span>${project.status === 'completed' ? 'スキャン完了' : getStatusText(project.status)}</span>
        </div>
        
        <p><strong>対象URL:</strong> ${escapeHtml(project.target_url)}</p>
        <p><strong>スキャンタイプ:</strong> ${getDisplayScanType(project.scan_type)}</p>
        <p><strong>選択オプション:</strong> ${scanOptions || 'なし'}</p>
        <p><strong>開始時間:</strong> ${new Date(project.created_at).toLocaleString()}</p>
    `;
    
    // スキャン実行ボタンの状態を更新
    const startScanBtn = document.getElementById('start-scan-btn');
    if (startScanBtn) {
        if (project.status === 'pending') {
            startScanBtn.disabled = false;
            startScanBtn.innerHTML = '<i class="fas fa-play"></i> スキャンを実行';
            
            // イベントリスナーを再設定
            const newStartScanBtn = startScanBtn.cloneNode(true);
            startScanBtn.parentNode.replaceChild(newStartScanBtn, startScanBtn);
            
            newStartScanBtn.addEventListener('click', function() {
                startProjectScan(project.id);
            });
            } else {
            startScanBtn.disabled = true;
            if (project.status === 'completed') {
                startScanBtn.innerHTML = '<i class="fas fa-check-circle"></i> スキャン完了';
                startScanBtn.classList.add('btn-completed');
            } else if (project.status === 'running') {
                startScanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> スキャン実行中...';
            } else if (project.status === 'failed') {
                startScanBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> スキャン失敗';
                startScanBtn.classList.add('btn-failed');
            } else if (project.status === 'cancelled') {
                startScanBtn.innerHTML = '<i class="fas fa-ban"></i> キャンセル済み';
                startScanBtn.classList.add('btn-cancelled');
            }
        }
    }
}

// スキャンタイプの表示名を取得
function getDisplayScanType(type) {
    switch (type) {
        case 'quick': return 'クイックスキャン';
        case 'full': return 'フルスキャン';
        case 'custom': return 'カスタムスキャン';
        default: return type;
    }
}

// プロジェクトスキャンの開始
async function startProjectScan(projectId) {
    try {
        // スキャン開始のUI更新
        const startScanBtn = document.getElementById('start-scan-btn');
        if (startScanBtn) {
            startScanBtn.disabled = true;
            startScanBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> スキャン開始中...';
        }
        
        // プロジェクトのステータスを更新
        const { error } = await supabase
            .from('projects')
            .update({ 
                status: 'running', 
                progress: 0,
                started_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', projectId);
        
        if (error) throw error;
        
        console.log('プロジェクトスキャンを開始しました:', projectId);
        
        // プロジェクト情報を再取得して表示を更新
        const { data: updatedProject } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        
        if (updatedProject) {
            // 進捗タブに自動的に移動
            showProjectTab('progress', updatedProject);
        }
        
        // 模擬的なスキャン進捗の更新（実際の実装では、バックエンドからの更新を受け取る）
        simulateProgress(projectId);
        
    } catch (error) {
        console.error('スキャン開始エラー:', error);
        alert('スキャンの開始中にエラーが発生しました: ' + error.message);
        
        // エラー状態を表示
        const startScanBtn = document.getElementById('start-scan-btn');
        if (startScanBtn) {
            startScanBtn.disabled = false;
            startScanBtn.innerHTML = '<i class="fas fa-exclamation-circle"></i> スキャンに失敗しました。再試行';
        }
    }
}

// 模擬的な進捗更新（デモ用）
function simulateProgress(projectId) {
    let progress = 0;
    const interval = setInterval(async () => {
        progress += Math.floor(Math.random() * 5) + 1; // 1-5%ずつ増加
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // 完了状態に更新
            try {
                await supabase
            .from('projects')
                    .update({ 
                        status: 'completed', 
                        progress: 100,
                        completed_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', projectId);
                
                console.log('プロジェクトスキャンが完了しました:', projectId);
                
                // プロジェクト情報を再取得して表示を更新
                const { data: completedProject } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();
                
                if (completedProject) {
                    // 結果タブに自動的に移動
                    showProjectTab('results', completedProject);
                }
                
            } catch (error) {
                console.error('スキャン完了の更新エラー:', error);
            }
        } else {
            // 進捗状態を更新
            try {
                await supabase
                    .from('projects')
                    .update({ 
                        progress: progress,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', projectId);
                
                // 進捗表示を更新
                updateProgressDisplay(projectId, progress);
                
    } catch (error) {
                console.error('進捗更新エラー:', error);
            }
        }
    }, 1000); // 1秒ごとに更新
}

// 進捗表示の更新
async function updateProgressDisplay(projectId, progress) {
    // 現在のプロジェクト情報を再取得
    const { data: project } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
    
    if (project) {
        // 進捗タブが表示されている場合のみ更新
        const progressTab = document.getElementById('project-progress-tab');
        if (progressTab && progressTab.classList.contains('active')) {
            displayProjectProgress(project);
        }
    }
}

// 進捗状況タブの表示
function displayProjectProgress(project) {
    const progressTab = document.getElementById('project-progress-tab');
    if (!progressTab) return;
    
    // 進捗状況の表示を更新
    const progressValue = project.progress || 0;
    
    progressTab.innerHTML = `
        <div class="progress-status">
            <h3>スキャン進捗状況</h3>
            <div class="detail-progress">
                <div class="progress-bar-large">
                    <div class="progress-fill" style="width: ${progressValue}%;"></div>
                </div>
                <div class="progress-percentage">${progressValue}%</div>
            </div>
            
            <div class="status-info">
                <p><strong>ステータス:</strong> ${getStatusText(project.status)}</p>
                <p><strong>開始時間:</strong> ${new Date(project.started_at || project.created_at).toLocaleString()}</p>
                <p><strong>予想残り時間:</strong> ${getEstimatedTimeRemaining(project)}</p>
            </div>
            
            <div class="scan-log">
                <h4>スキャンログ</h4>
                <div class="log-container">
                    <div class="log-entry">スキャン初期化中...</div>
                    ${progressValue > 10 ? '<div class="log-entry">ターゲットURL解析中...</div>' : ''}
                    ${progressValue > 20 ? '<div class="log-entry">エンドポイント検出中...</div>' : ''}
                    ${progressValue > 30 ? '<div class="log-entry">XSS脆弱性スキャン実行中...</div>' : ''}
                    ${progressValue > 50 ? '<div class="log-entry">SQLインジェクション脆弱性スキャン実行中...</div>' : ''}
                    ${progressValue > 70 ? '<div class="log-entry">CSRF脆弱性スキャン実行中...</div>' : ''}
                    ${progressValue > 90 ? '<div class="log-entry">結果の集計・分析中...</div>' : ''}
                    ${progressValue === 100 ? '<div class="log-entry success">スキャン完了！</div>' : ''}
                </div>
            </div>
        </div>
        
        ${project.status === 'running' ? `
        <div class="scan-actions">
            <button class="btn btn-cancel" data-project-id="${project.id}">スキャンを中止</button>
        </div>
        ` : ''}
    `;
    
    // 中止ボタンのイベントリスナーを設定
    const cancelButton = progressTab.querySelector('.btn-cancel');
    if (cancelButton) {
        cancelButton.addEventListener('click', function() {
            cancelProject(this.getAttribute('data-project-id'));
        });
    }
}

// スキャン結果タブの表示
function displayProjectResults(project) {
    const resultsTab = document.getElementById('project-results-tab');
    if (!resultsTab) return;
    
    // 結果がない場合の表示
    if (!project.results || project.status !== 'completed') {
        resultsTab.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>${project.status === 'running' ? 'スキャンが実行中です。完了までお待ちください。' : 'スキャン結果がありません。スキャンを実行してください。'}</p>
            </div>
        `;
            return;
        }
        
    // 結果の集計
    const results = typeof project.results === 'string' ? JSON.parse(project.results) : project.results;
    
    let highCount = 0;
    let mediumCount = 0;
    let lowCount = 0;
    let infoCount = 0;
    
    if (Array.isArray(results)) {
        results.forEach(result => {
            if (result.severity === 'high') highCount++;
            else if (result.severity === 'medium') mediumCount++;
            else if (result.severity === 'low') lowCount++;
            else if (result.severity === 'info') infoCount++;
        });
    }
    
    // 結果の表示
    resultsTab.innerHTML = `
        <div class="results-summary">
            <h3>脆弱性の検出結果</h3>
            
            <div class="vulnerability-summary">
                <div class="summary-item critical">
                    <div class="count">${highCount}</div>
                    <span>高リスク</span>
                </div>
                <div class="summary-item high">
                    <div class="count">${mediumCount}</div>
                    <span>中リスク</span>
                </div>
                <div class="summary-item medium">
                    <div class="count">${lowCount}</div>
                    <span>低リスク</span>
                </div>
                <div class="summary-item low">
                    <div class="count">${infoCount}</div>
                    <span>情報</span>
                </div>
            </div>
        </div>
        
        <div class="vulnerability-list">
            <h4>検出された脆弱性の詳細</h4>
            ${Array.isArray(results) && results.length > 0 ? results.map(result => `
                <div class="vulnerability-item severity-${result.severity}">
                    <div class="vulnerability-header">
                        <div class="vulnerability-title">${escapeHtml(result.type)} - ${escapeHtml(result.path || '')}</div>
                        <div class="vulnerability-severity">${getSeverityText(result.severity)}</div>
                    </div>
                    <div class="vulnerability-details">
                        <p>${escapeHtml(result.description)}</p>
                        ${result.fixed ? '<p class="fixed-status"><i class="fas fa-check-circle"></i> 修正済み</p>' : ''}
                    </div>
                </div>
            `).join('') : '<p class="no-vulnerabilities">脆弱性は検出されませんでした。</p>'}
        </div>
        
        <div class="scan-actions">
            <button class="btn btn-primary" onclick="showProjectTab('report', ${JSON.stringify(project)})">レポートを生成</button>
        </div>
    `;
}

// 重要度のテキストを取得
function getSeverityText(severity) {
    switch (severity) {
        case 'high': return '高';
        case 'medium': return '中';
        case 'low': return '低';
        case 'info': return '情報';
        default: return severity;
    }
}

// レポートタブの表示
function displayProjectReport(project) {
    const reportTab = document.getElementById('project-report-tab');
    if (!reportTab) return;
    
    // 結果がない場合の表示
    if (!project.results || project.status !== 'completed') {
        reportTab.innerHTML = `
            <div class="no-results">
                <i class="fas fa-exclamation-circle"></i>
                <p>スキャン結果がありません。スキャンを完了させてから再度お試しください。</p>
            </div>
        `;
            return;
        }
        
    // レポートの表示
    reportTab.innerHTML = `
        <div class="report-container">
            <h3>セキュリティスキャンレポート</h3>
            
            <div class="report-actions">
                <button class="btn btn-secondary" onclick="exportPDF('${project.id}')"><i class="fas fa-file-pdf"></i> PDFエクスポート</button>
                <button class="btn btn-secondary" onclick="exportCSV('${project.id}')"><i class="fas fa-file-csv"></i> CSVエクスポート</button>
            </div>
            
            <div class="report-preview">
                ${generateReportHTML(project)}
                </div>
                </div>
            `;
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

// 統計情報を更新する関数
async function updateStatistics(userId) {
    try {
        // プロジェクト数の取得
        const { data: projectsData, error: projectsError } = await supabase
            .from('projects')
            .select('id, status, results')
            .eq('user_id', userId);
        
        if (projectsError) throw projectsError;
        
        // 統計情報の計算
        const totalProjects = projectsData ? projectsData.length : 0;
        let highRiskCount = 0;
        let mediumRiskCount = 0;
        let fixedCount = 0;
        
        // 脆弱性カウントの計算
        if (projectsData && projectsData.length > 0) {
            projectsData.forEach(project => {
                if (project.results) {
                    try {
                        // JSONBデータを解析
                        const results = typeof project.results === 'string' 
                            ? JSON.parse(project.results) 
                            : project.results;
                            
                        if (Array.isArray(results)) {
                            results.forEach(result => {
                                if (result.severity === 'high') highRiskCount++;
                                if (result.severity === 'medium') mediumRiskCount++;
                                if (result.fixed) fixedCount++;
                            });
                        }
                    } catch (e) {
                        console.error('結果データの解析エラー:', e);
                    }
                }
            });
        }
        
        // 統計情報の表示を更新
        document.getElementById('total-projects-count').textContent = totalProjects;
        document.getElementById('high-risk-count').textContent = highRiskCount;
        document.getElementById('medium-risk-count').textContent = mediumRiskCount;
        document.getElementById('fixed-count').textContent = fixedCount;
        
        console.log('統計情報を更新しました:', {
            totalProjects,
            highRiskCount,
            mediumRiskCount,
            fixedCount
        });
    } catch (error) {
        console.error('統計情報の更新中にエラーが発生しました:', error);
    }
} 