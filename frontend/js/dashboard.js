// ダッシュボードが読み込まれたときの処理
document.addEventListener('DOMContentLoaded', async function() {
    // ユーザーが認証済みかチェック
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
        console.error('セッションの取得に失敗しました:', error);
        window.location.href = 'login.html';
        return;
    }
    
    if (!session) {
        // セッションがなければログインページへリダイレクト
        window.location.href = 'login.html';
        return;
    }
    
    // ユーザー情報を取得
    const user = session.user;
    
    // ユーザーのメールアドレスを表示（サイドバーと歓迎メッセージの両方）
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
            <p><strong>最終ログイン:</strong> ${new Date(user.last_sign_in_at || user.created_at).toLocaleString()}</p>
            <p><strong>アカウント作成日:</strong> ${new Date(user.created_at).toLocaleString()}</p>
        `;
    }
    
    // サンプルプロジェクトの操作機能を設定
    setupSampleProjectActions();
    
    // 進行中のプロジェクトを取得して表示
    loadUserProjects(user.id);
    
    // サイドバーのナビゲーションアイテムのクリックイベント
    const navItems = document.querySelectorAll('.sidebar-nav a');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // アクティブクラスを全て削除
            navItems.forEach(navItem => {
                navItem.parentElement.classList.remove('active');
            });
            
            // クリックされた項目にアクティブクラスを追加
            this.parentElement.classList.add('active');
            
            // セクションの表示を切り替える
            const targetSection = this.getAttribute('href').substring(1);
            showSection(targetSection);
        });
    });
    
    // ログアウトボタンのイベント
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function() {
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                window.location.href = 'login.html';
            } catch (error) {
                console.error('ログアウト中にエラーが発生しました:', error);
                alert('ログアウトに失敗しました: ' + error.message);
            }
        });
    }

    // スキャンタイプオプションの選択イベント
    setupScanTypeOptions();
    
    // スキャンオプションカードの選択イベント
    setupScanOptionCards();
    
    // 新規スキャンフォームの送信イベント
    const newScanForm = document.getElementById('new-scan-form');
    if (newScanForm) {
        newScanForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // フォームデータを取得
            const projectName = document.getElementById('project-name').value;
            const targetUrl = document.getElementById('target-url').value;
            const scanType = document.querySelector('input[name="scan-type"]:checked').value;
            
            // 選択されたオプションを配列で取得 (チェックボックスではなくカードの選択状態から)
            const selectedOptions = [];
            document.querySelectorAll('.scan-option-card.selected').forEach(card => {
                const option = card.dataset.option;
                selectedOptions.push(option);
                console.log('選択されたオプション:', option);
            });
            
            console.log('選択されたオプション一覧:', selectedOptions);
            
            // 新規プロジェクトの登録処理
            const projectData = {
                projectName,
                targetUrl,
                scanType,
                options: selectedOptions,
                userId: user.id,
                createdAt: new Date().toISOString(),
                status: 'created', // 状態を作成済みに変更
                progress: 0
            };
            
            console.log('新規プロジェクト登録:', projectData);
            
            // プロジェクトをSupabaseに保存
            saveProjectToDatabase(projectData)
                .then(savedProject => {
                    // プロジェクトを作成し、進行中プロジェクトに追加
                    addProjectToOngoingProjects(savedProject);
                    
                    alert(`プロジェクト「${projectName}」を作成しました。`);
                    
                    // フォームをリセット
                    newScanForm.reset();
                    
                    // ダッシュボード画面に戻る
                    showSection('dashboard');
                    
                    // サイドバーのナビゲーションも更新
                    navItems.forEach(navItem => {
                        navItem.parentElement.classList.remove('active');
                        if (navItem.getAttribute('href') === '#dashboard') {
                            navItem.parentElement.classList.add('active');
                        }
                    });
                })
                .catch(error => {
                    console.error('プロジェクト保存エラー:', error);
                    alert('プロジェクトの保存中にエラーが発生しました。');
                });
        });
    }
    
    // 設定フォームの送信イベント
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 設定の保存処理
            // ここでSupabaseに保存する処理を追加できます
            const emailNotification = document.getElementById('email-notification').checked;
            const browserNotification = document.getElementById('browser-notification').checked;
            
            console.log('設定を保存:', {
                emailNotification,
                browserNotification,
                userId: user.id
            });
            
            alert('設定を保存しました');
        });
    }

    // 戻るボタンのイベントリスナー追加
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            showSection('dashboard');
            
            // サイドバーのナビゲーションも更新
            const navItems = document.querySelectorAll('.sidebar-nav a');
            navItems.forEach(navItem => {
                navItem.parentElement.classList.remove('active');
                if (navItem.getAttribute('href') === '#dashboard') {
                    navItem.parentElement.classList.add('active');
                }
            });
        });
    }

    // ページ読み込み時に進行中のプロジェクトを表示
    displayOngoingProjects();
});

// スキャンタイプオプションのセットアップ
function setupScanTypeOptions() {
    const scanTypeOptions = document.querySelectorAll('.scan-type-option');
    if (scanTypeOptions.length === 0) return;
    
    scanTypeOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 他のオプションから選択状態を削除
            scanTypeOptions.forEach(opt => {
                opt.classList.remove('selected');
            });
            
            // クリックされたオプションを選択状態に
            this.classList.add('selected');
            
            // ラジオボタンを選択状態に
            const radio = this.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });
}

// スキャンオプションカードのセットアップ
function setupScanOptionCards() {
    const scanOptionCards = document.querySelectorAll('.scan-option-card');
    
    scanOptionCards.forEach(card => {
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
            console.log('オプションカードの切り替え:', card.dataset.option, '選択状態:', card.classList.contains('selected'));
        });
    });
}

// プロジェクトをデータベースに保存
async function saveProjectToDatabase(projectData) {
    try {
        // プロジェクトテーブルへの挿入
        const { data: project, error } = await supabase
            .from('projects')
            .insert([
                {
                    name: projectData.projectName,
                    target_url: projectData.targetUrl,
                    scan_type: projectData.scanType,
                    options: projectData.options,
                    user_id: projectData.userId,
                    status: projectData.status,
                    progress: projectData.progress,
                    created_at: projectData.createdAt
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // DBから返された値を元のプロジェクトデータ形式に変換
        return {
            id: project.id,
            projectName: project.name,
            targetUrl: project.target_url,
            scanType: project.scan_type,
            options: project.options,
            userId: project.user_id,
            status: project.status,
            progress: project.progress,
            createdAt: project.created_at
        };
    } catch (error) {
        console.error('Supabaseへの保存エラー:', error);
        // エラーが発生しても元のデータを返し、UI表示は継続できるようにする
        projectData.id = new Date().getTime(); // 一時的なID
        return projectData;
    }
}

// 進捗状況を定期的にデータベースに更新
function startProgressUpdates(projectData) {
    if (!projectData.id) return; // DBに保存されていない場合は更新しない
    
    let progress = 0;
    const updateInterval = setInterval(async () => {
        // スキャンタイプに応じて進捗速度を変える
        let increment = 1;
        if (projectData.scanType === 'quick') {
            increment = 5;
        } else if (projectData.scanType === 'full') {
            increment = 2;
        }
        
        progress += increment;
        if (progress > 100) {
            progress = 100;
            clearInterval(updateInterval);
            
            // ステータスを完了に更新
            await updateProjectStatus(projectData.id, 'completed', 100);
            return;
        }
        
        // 進捗をデータベースに更新
        await updateProjectProgress(projectData.id, progress);
    }, 3000);
}

// プロジェクトの進捗を更新
async function updateProjectProgress(projectId, progress) {
    try {
        const { error } = await supabase
            .from('projects')
            .update({ progress: progress })
            .eq('id', projectId);
        
        if (error) throw error;
    } catch (error) {
        console.error('進捗更新エラー:', error);
    }
}

// プロジェクトのステータスを更新
async function updateProjectStatus(projectId, status, progress = null) {
    try {
        const updates = { status: status };
        if (progress !== null) {
            updates.progress = progress;
        }
        
        const { error } = await supabase
            .from('projects')
            .update(updates)
            .eq('id', projectId);
        
        if (error) throw error;
    } catch (error) {
        console.error('ステータス更新エラー:', error);
    }
}

// 進行中プロジェクトリストにプロジェクトを追加
function addProjectToOngoingProjects(projectData) {
    const ongoingProjects = document.getElementById('ongoingProjectsContainer');
    if (!ongoingProjects) return;
    
    // 既存のプロジェクトカードがあり、かつidが一致するものがあれば更新
    const existingCard = projectData.id ? document.querySelector(`.project-card[data-project-id="${projectData.id}"]`) : null;
    if (existingCard) {
        // 進捗を更新
        const progressFill = existingCard.querySelector('.progress-fill');
        const progressText = existingCard.querySelector('.progress-stats div:first-child');
        if (progressFill && progressText) {
            progressFill.style.width = `${projectData.progress}%`;
            progressText.textContent = `進捗: ${projectData.progress}%`;
        }
        
        // ステータスに応じてボタン表示を更新
        updateProjectCardButtons(existingCard, projectData);
        
        return existingCard;
    }
    
    // サンプルプロジェクトを削除（最初の実行時のみ）
    if (ongoingProjects.querySelector('.project-card:not([data-project-id])')) {
        ongoingProjects.innerHTML = '';
    }
    
    // 作成日時
    const createdAt = new Date(projectData.createdAt);
    
    // 新しいプロジェクトカードを追加
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.dataset.projectId = projectData.id || new Date().getTime(); // DBのIDまたは一時的なID
    
    // ステータスに応じたクラスとテキスト
    let statusClass = 'status-running';
    let statusText = '実行中';
    
    if (projectData.status === 'created') {
        statusClass = 'status-created';
        statusText = '未実行';
    } else if (projectData.status === 'completed') {
        statusClass = 'status-completed';
        statusText = '完了';
    } else if (projectData.status === 'cancelled') {
        statusClass = 'status-cancelled';
        statusText = '中止';
    }
    
    // アクションボタンの作成
    let actionButtons = '';
    
    // ステータスに応じてボタンの表示を変更
    if (projectData.status === 'running') {
        actionButtons = `
            <button class="btn btn-sm btn-view-details">詳細を表示</button>
            <button class="btn btn-sm btn-cancel">中止</button>
        `;
    } else if (projectData.status === 'cancelled') {
        actionButtons = `
            <button class="btn btn-sm btn-view-details">詳細を表示</button>
            <button class="btn btn-sm btn-resume">再開</button>
        `;
    } else if (projectData.status === 'completed') {
        actionButtons = `
            <button class="btn btn-sm btn-view-details">詳細を表示</button>
            <button class="btn btn-sm btn-completed disabled">完了</button>
        `;
    }
    
    projectCard.innerHTML = `
        <div class="project-header">
            <div class="project-title">${projectData.projectName}</div>
            <div class="project-status ${statusClass}">${statusText}</div>
        </div>
        <div class="project-details">
            <div><i class="fas fa-globe"></i> ${projectData.targetUrl}</div>
            <div><i class="fas fa-clock"></i> 開始: ${createdAt.toLocaleString()}</div>
        </div>
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${projectData.progress}%;"></div>
            </div>
            <div class="progress-stats">
                <div>進捗: ${projectData.progress}%</div>
                <div>${projectData.status === 'completed' ? '完了' : '予想残り時間: 計算中...'}</div>
            </div>
        </div>
        <div class="project-actions">
            ${actionButtons}
        </div>
    `;
    
    ongoingProjects.appendChild(projectCard);
    
    // カード全体のクリックイベント（ボタンクリック以外）
    projectCard.addEventListener('click', function(e) {
        // ボタン要素のクリックを無視
        if (e.target.closest('.btn')) {
            return;
        }
        
        showSection('project');
        showProjectDetails(projectData);
    });
    
    // 詳細ボタンにイベントリスナーを追加
    const viewDetailsBtn = projectCard.querySelector('.btn-view-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function() {
            showSection('project');
            showProjectDetails(projectData);
        });
    }
    
    // 中止ボタンにイベントリスナーを追加
    const cancelBtn = projectCard.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm(`プロジェクト「${projectData.projectName}」のスキャンを中止しますか？`)) {
                projectCard.querySelector('.project-status').textContent = '中止';
                projectCard.querySelector('.project-status').className = 'project-status status-cancelled';
                // 進捗バーの色を変更
                projectCard.querySelector('.progress-fill').style.backgroundColor = '#888';
                
                // データベースのステータスも更新
                if (projectData.id) {
                    updateProjectStatus(projectData.id, 'cancelled');
                }
                
                // ボタンを再開ボタンに変更
                const actionsContainer = projectCard.querySelector('.project-actions');
                actionsContainer.innerHTML = `
                    <button class="btn btn-sm btn-view-details">詳細を表示</button>
                    <button class="btn btn-sm btn-resume">再開</button>
                `;
                
                // 詳細ボタンに再度イベントリスナーを追加
                actionsContainer.querySelector('.btn-view-details').addEventListener('click', function() {
                    showSection('project');
                    showProjectDetails({...projectData, status: 'cancelled'});
                });
                
                // 再開ボタンにイベントリスナーを追加
                actionsContainer.querySelector('.btn-resume').addEventListener('click', function() {
                    resumeProject(projectData, projectCard);
                });
            }
        });
    }
    
    // 再開ボタンにイベントリスナーを追加
    const resumeBtn = projectCard.querySelector('.btn-resume');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', function() {
            resumeProject(projectData, projectCard);
        });
    }
    
    // 進行中のプロジェクトの場合、進捗の自動更新を開始
    if (projectData.status === 'running' && projectData.progress < 100) {
        simulateProjectProgress(projectData);
    }
    
    return projectCard;
}

// プロジェクトカードのボタン表示を更新
function updateProjectCardButtons(card, projectData) {
    const actionsContainer = card.querySelector('.project-actions');
    if (!actionsContainer) return;
    
    let actionButtons = '';
    
    // ステータスに応じてボタンの表示を変更
    if (projectData.status === 'running') {
        actionButtons = `
            <button class="btn btn-sm btn-view-details">詳細を表示</button>
            <button class="btn btn-sm btn-cancel">中止</button>
        `;
    } else if (projectData.status === 'cancelled') {
        actionButtons = `
            <button class="btn btn-sm btn-view-details">詳細を表示</button>
            <button class="btn btn-sm btn-resume">再開</button>
        `;
    } else if (projectData.status === 'completed') {
        actionButtons = `
            <button class="btn btn-sm btn-view-details">詳細を表示</button>
            <button class="btn btn-sm btn-completed disabled">完了</button>
        `;
    }
    
    actionsContainer.innerHTML = actionButtons;
    
    // ステータス表示も更新
    const statusElement = card.querySelector('.project-status');
    if (statusElement) {
        let statusClass = 'status-running';
        let statusText = '実行中';
        
        if (projectData.status === 'completed') {
            statusClass = 'status-completed';
            statusText = '完了';
        } else if (projectData.status === 'cancelled') {
            statusClass = 'status-cancelled';
            statusText = '中止';
        }
        
        statusElement.className = `project-status ${statusClass}`;
        statusElement.textContent = statusText;
    }
    
    // 進捗バーの色も更新
    const progressFill = card.querySelector('.progress-fill');
    if (progressFill) {
        if (projectData.status === 'cancelled') {
            progressFill.style.backgroundColor = '#888';
        } else {
            progressFill.style.backgroundColor = '#3b82f6';
        }
    }
    
    // 残り時間表示も更新
    const remainingTime = card.querySelector('.progress-stats div:last-child');
    if (remainingTime && (projectData.status === 'completed' || projectData.status === 'cancelled')) {
        remainingTime.textContent = projectData.status === 'completed' ? '完了' : '中止';
    }
    
    // イベントリスナーを再設定
    
    // 詳細ボタン
    const viewDetailsBtn = actionsContainer.querySelector('.btn-view-details');
    if (viewDetailsBtn) {
        viewDetailsBtn.addEventListener('click', function() {
            showSection('project');
            showProjectDetails(projectData);
        });
    }
    
    // 中止ボタン
    const cancelBtn = actionsContainer.querySelector('.btn-cancel');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            if (confirm(`プロジェクト「${projectData.projectName}」のスキャンを中止しますか？`)) {
                // UIの状態を中止状態に更新
                projectData.status = 'cancelled';
                
                // データベースのステータスも更新
                if (projectData.id) {
                    updateProjectStatus(projectData.id, 'cancelled');
                }
                
                // UIを更新
                updateProjectCardButtons(card, projectData);
            }
        });
    }
    
    // 再開ボタン
    const resumeBtn = actionsContainer.querySelector('.btn-resume');
    if (resumeBtn) {
        resumeBtn.addEventListener('click', function() {
            resumeProject(projectData, card);
        });
    }
}

// プロジェクトを再開する
function resumeProject(projectData, projectCard) {
    if (confirm(`プロジェクト「${projectData.projectName}」のスキャンを再開しますか？`)) {
        // ステータスを実行中に戻す
        const updatedData = {...projectData, status: 'running'};
        
        // データベースのステータスも更新
        if (projectData.id) {
            updateProjectStatus(projectData.id, 'running');
        }
        
        // UIを更新
        updateProjectCardButtons(projectCard, updatedData);
        
        // 進捗バーの色を元に戻す
        const progressFill = projectCard.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.backgroundColor = '#3b82f6';
        }
        
        // 進捗の自動更新を再開
        simulateProjectProgress(updatedData);
    }
}

// プロジェクトの進捗をシミュレーション
function simulateProjectProgress(projectData) {
    // プロジェクトカードを検索
    const projectId = projectData.id || new Date().getTime();
    const projectCard = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
    if (!projectCard) return;
    
    let progress = projectData.progress || 0;
    const progressFill = projectCard.querySelector('.progress-fill');
    const progressText = projectCard.querySelector('.progress-stats div:first-child');
    const remainingTime = projectCard.querySelector('.progress-stats div:last-child');
    
    // プロジェクトが完了済みか中止済みの場合は更新しない
    if (projectData.status === 'completed' || projectData.status === 'cancelled') {
        // 表示だけ更新
        if (progressFill) progressFill.style.width = `${progress}%`;
        if (progressText) progressText.textContent = `進捗: ${progress}%`;
        if (remainingTime) remainingTime.textContent = projectData.status === 'completed' ? '完了' : '中止';
        return;
    }
    
    // 現在のステータスを監視する変数
    let currentStatus = projectData.status;
    
    // 進捗度を更新する関数
    const updateProgress = () => {
        // 現在のステータスをカードから取得（他の場所で変更された可能性があるため）
        const statusElement = projectCard.querySelector('.project-status');
        if (statusElement && statusElement.classList.contains('status-cancelled')) {
            currentStatus = 'cancelled';
        }
        
        // 中止された場合は更新を停止
        if (currentStatus === 'cancelled') {
            clearInterval(interval);
            return;
        }
        
        // スキャンタイプに応じて進捗速度を変える
        let increment = 1;
        if (projectData.scanType === 'quick') {
            increment = 5;
        } else if (projectData.scanType === 'full') {
            increment = 2;
        }
        
        progress += increment;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `進捗: ${progress}%`;
        
        // 残り時間の計算
        const estimatedSeconds = ((100 - progress) / increment) * 3; // 3秒ごとに更新と仮定
        const minutes = Math.floor(estimatedSeconds / 60);
        const seconds = Math.floor(estimatedSeconds % 60);
        
        if (progress < 100) {
            remainingTime.textContent = `予想残り時間: 約${minutes}分${seconds}秒`;
        } else {
            remainingTime.textContent = '完了';
            // 完了時の処理
            projectCard.querySelector('.project-status').textContent = '完了';
            projectCard.querySelector('.project-status').className = 'project-status status-completed';
            
            // データベースのステータスも更新
            if (projectData.id) {
                updateProjectStatus(projectData.id, 'completed', 100);
            }
            
            // ボタンを完了表示に変更
            projectData.status = 'completed';
            projectData.progress = 100;
            updateProjectCardButtons(projectCard, projectData);
            
            clearInterval(interval);
        }
    };
    
    // 3秒ごとに進捗を更新
    const interval = setInterval(updateProgress, 3000);
    
    // 最初の更新を即時実行
    updateProgress();
    
    // 中止された場合にも対応できるように、intervalを返す
    return interval;
}

// プロジェクト詳細表示
function showProjectDetails(projectData) {
    const projectDetailsContent = document.getElementById('project-details-content');
    if (!projectDetailsContent) return;
    
    // プロジェクトタイトルを設定
    const projectTitleElement = document.getElementById('project-title');
    if (projectTitleElement) {
        projectTitleElement.textContent = projectData.projectName;
    }
    
    // スキャンタイプの表示名
    const scanTypeNames = {
        'quick': 'クイックスキャン',
        'full': 'フルスキャン',
        'custom': 'カスタムスキャン'
    };
    
    // オプションの表示名
    const optionNames = {
        'xss': 'XSS脆弱性',
        'sqli': 'SQLインジェクション',
        'csrf': 'CSRF脆弱性',
        'openredirect': 'オープンリダイレクト'
    };
    
    // オプション一覧を作成
    const optionsList = projectData.options.map(opt => optionNames[opt] || opt).join('、');
    
    // 現在の時刻
    const now = new Date();
    
    // ステップフローバーの状態を更新
    updateStepFlow(projectData);
    
    // プロジェクトのステータスに応じてUIを調整
    const isRunning = projectData.status === 'running';
    const isCreated = projectData.status === 'created';
    const isCompleted = projectData.status === 'completed';
    const isCancelled = projectData.status === 'cancelled';
    
    let statusBannerHTML = '';
    let statusBannerClass = '';
    
    if (isRunning) {
        statusBannerHTML = '<i class="fas fa-spinner fa-spin"></i> スキャン実行中';
        statusBannerClass = 'status-running';
    } else if (isCreated) {
        statusBannerHTML = '<i class="fas fa-info-circle"></i> スキャン未実行';
        statusBannerClass = 'status-created';
    } else if (isCompleted) {
        statusBannerHTML = '<i class="fas fa-check-circle"></i> スキャン完了';
        statusBannerClass = 'status-completed';
    } else if (isCancelled) {
        statusBannerHTML = '<i class="fas fa-times-circle"></i> スキャン中止';
        statusBannerClass = 'status-cancelled';
    }
    
    // 詳細情報を表示
    projectDetailsContent.innerHTML = '';
    
    // 情報タブのコンテンツ
    const infoTab = document.createElement('div');
    infoTab.id = 'project-info-tab';
    infoTab.className = 'project-tab-content active';
    
    infoTab.innerHTML = `
        <div class="project-status-banner ${statusBannerClass}">
            ${statusBannerHTML}
        </div>
        
        <div class="project-details-info">
            <p><strong>対象URL:</strong> ${projectData.targetUrl}</p>
            <p><strong>スキャンタイプ:</strong> ${scanTypeNames[projectData.scanType] || projectData.scanType}</p>
            <p><strong>選択オプション:</strong> ${optionsList}</p>
            <p><strong>開始時間:</strong> ${new Date(projectData.createdAt || now).toLocaleString()}</p>
        </div>
        
        <div class="project-scan-actions">
            ${isCreated ? `<button id="start-scan-btn" class="btn btn-primary"><i class="fas fa-play"></i> スキャンを実行</button>` : ''}
            ${isRunning ? `<button id="cancel-scan-btn" class="btn btn-cancel"><i class="fas fa-stop"></i> スキャンを中止</button>` : ''}
            ${isCancelled ? `<button id="resume-scan-btn" class="btn btn-primary"><i class="fas fa-redo"></i> スキャンを再開</button>` : ''}
        </div>
    `;
    
    projectDetailsContent.appendChild(infoTab);
    
    // 進捗タブのコンテンツ
    const progressTab = document.createElement('div');
    progressTab.id = 'project-progress-tab';
    progressTab.className = 'project-tab-content';
    
    progressTab.innerHTML = `
        <h3>進捗状況</h3>
        <div class="progress-container detail-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${projectData.progress || 0}%;"></div>
            </div>
            <div class="progress-stats">
                <div>進捗: ${projectData.progress || 0}%</div>
                <div>${isCompleted ? '完了' : isCancelled ? '中止' : '予想残り時間: 計算中...'}</div>
            </div>
        </div>
    `;
    
    projectDetailsContent.appendChild(progressTab);
    
    // 結果タブのコンテンツ
    const resultsTab = document.createElement('div');
    resultsTab.id = 'project-results-tab';
    resultsTab.className = 'project-tab-content';
    
    if (isCompleted) {
        // 完了した場合は結果を表示
        showScanResults(resultsTab, projectData);
    } else {
        resultsTab.innerHTML = `
            <h3>スキャン結果</h3>
            <p class="pending-message">スキャンが完了すると、ここに結果が表示されます。</p>
        `;
    }
    
    projectDetailsContent.appendChild(resultsTab);
    
    // レポートタブのコンテンツ
    const reportTab = document.createElement('div');
    reportTab.id = 'project-report-tab';
    reportTab.className = 'project-tab-content';
    
    reportTab.innerHTML = `
        <h3>レポート作成</h3>
        <p class="pending-message">スキャン完了後に、このタブでレポートを作成・エクスポートできます。</p>
        <div class="report-actions" ${isCompleted ? '' : 'style="display: none;"'}>
            <button class="btn btn-primary"><i class="fas fa-file-export"></i> レポートをエクスポート</button>
        </div>
    `;
    
    projectDetailsContent.appendChild(reportTab);
    
    // スキャン実行ボタンのイベントリスナーを設定
    const startScanBtn = document.getElementById('start-scan-btn');
    if (startScanBtn) {
        startScanBtn.addEventListener('click', function() {
            if (confirm(`プロジェクト「${projectData.projectName}」のスキャンを開始しますか？`)) {
                // プロジェクトデータを更新
                projectData.status = 'running';
                
                // データベースのステータスも更新
                if (projectData.id) {
                    updateProjectStatus(projectData.id, 'running');
                }
                
                // UIを更新（実行中の表示に）
                showProjectDetails(projectData);
                
                // 進捗シミュレーションを開始
                simulateProjectProgress(projectData);
                
                // 進捗更新の定期的な処理を開始
                startProgressUpdates(projectData);
            }
        });
    }
    
    // キャンセルボタンのイベントリスナーを設定
    const cancelScanBtn = document.getElementById('cancel-scan-btn');
    if (cancelScanBtn) {
        cancelScanBtn.addEventListener('click', function() {
            if (confirm(`プロジェクト「${projectData.projectName}」のスキャンを中止しますか？`)) {
                // プロジェクトデータを更新
                projectData.status = 'cancelled';
                
                // データベースのステータスも更新
                if (projectData.id) {
                    updateProjectStatus(projectData.id, 'cancelled');
                }
                
                // UIを更新（中止の表示に）
                showProjectDetails(projectData);
            }
        });
    }
    
    // 再開ボタンのイベントリスナーを設定
    const resumeScanBtn = document.getElementById('resume-scan-btn');
    if (resumeScanBtn) {
        resumeScanBtn.addEventListener('click', function() {
            if (confirm(`プロジェクト「${projectData.projectName}」のスキャンを再開しますか？`)) {
                // プロジェクトデータを更新
                projectData.status = 'running';
                
                // データベースのステータスも更新
                if (projectData.id) {
                    updateProjectStatus(projectData.id, 'running');
                }
                
                // UIを更新（実行中の表示に）
                showProjectDetails(projectData);
                
                // 進捗シミュレーションを開始
                simulateProjectProgress(projectData);
            }
        });
    }
    
    // ステップフローバーのクリックイベントを設定
    setupStepFlowEvents();
}

// ステップフローバーの状態を更新する関数
function updateStepFlow(projectData) {
    const steps = document.querySelectorAll('.step-flow-bar .step');
    if (!steps.length) return;
    
    // すべてのステップをリセット
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
    });
    
    // プロジェクトの進捗に応じてステップを更新
    const progress = projectData.progress || 0;
    
    // ステップ1は常にアクティブか完了
    steps[0].classList.add(progress > 30 ? 'completed' : 'active');
    
    // 30%以上でステップ2をアクティブに
    if (progress >= 30) {
        steps[1].classList.add(progress > 60 ? 'completed' : 'active');
    }
    
    // 60%以上でステップ3をアクティブに
    if (progress >= 60) {
        steps[2].classList.add(progress >= 100 ? 'completed' : 'active');
    }
    
    // 100%でステップ4をアクティブに
    if (progress >= 100) {
        steps[3].classList.add('active');
    }
}

// ステップフローバーのクリックイベントを設定
function setupStepFlowEvents() {
    const steps = document.querySelectorAll('.step-flow-bar .step');
    const tabs = document.querySelectorAll('.project-tab-content');
    
    steps.forEach(step => {
        step.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-step');
            
            // 対応するタブだけを表示する
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });
            
            document.getElementById(`tab-${targetTab}`)?.classList.add('active');
            
            // クリックされたステップとそれ以前のステップをアクティブまたは完了に
            let foundCurrent = false;
            steps.forEach(s => {
                if (s === this) {
                    s.classList.add('active');
                    s.classList.remove('completed');
                    foundCurrent = true;
                } else if (!foundCurrent) {
                    s.classList.add('completed');
                    s.classList.remove('active');
                } else {
                    s.classList.remove('active', 'completed');
                }
            });
        });
    });
}

// スキャン結果を表示（サンプル）
function showScanResults(container, projectData) {
    // スキャンタイプとオプションに応じてサンプル結果を生成
    let vulnerabilities = [];
    
    if (projectData.options.includes('xss')) {
        vulnerabilities.push({
            type: 'XSS',
            severity: 'high',
            location: `${projectData.targetUrl}/search?q=<script>alert(1)</script>`,
            description: 'クロスサイトスクリプティング脆弱性がsearchパラメータで検出されました。'
        });
    }
    
    if (projectData.options.includes('sqli')) {
        vulnerabilities.push({
            type: 'SQLインジェクション',
            severity: 'critical',
            location: `${projectData.targetUrl}/product?id=1' OR '1'='1`,
            description: 'SQLインジェクション脆弱性がidパラメータで検出されました。'
        });
    }
    
    if (projectData.options.includes('csrf')) {
        vulnerabilities.push({
            type: 'CSRF',
            severity: 'medium',
            location: `${projectData.targetUrl}/profile/update`,
            description: 'CSRFトークンが実装されていないため、クロスサイトリクエストフォージェリ攻撃が可能です。'
        });
    }
    
    if (projectData.options.includes('openredirect')) {
        vulnerabilities.push({
            type: 'オープンリダイレクト',
            severity: 'low',
            location: `${projectData.targetUrl}/redirect?url=https://malicious-site.com`,
            description: 'オープンリダイレクト脆弱性がurlパラメータで検出されました。'
        });
    }
    
    // 結果がない場合
    if (vulnerabilities.length === 0) {
        container.innerHTML = `
            <h3>スキャン結果</h3>
            <div class="alert alert-success">
                <i class="fas fa-shield-alt"></i> 脆弱性は検出されませんでした。
            </div>
        `;
        return;
    }
    
    // 深刻度ごとにカウント
    const severityCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
    };
    
    vulnerabilities.forEach(vuln => {
        severityCounts[vuln.severity] = (severityCounts[vuln.severity] || 0) + 1;
    });
    
    // 結果表示HTML
    let resultsHTML = `
        <h3>スキャン結果</h3>
        <div class="vulnerability-summary">
            <div class="summary-item critical">${severityCounts.critical || 0} <span>致命的</span></div>
            <div class="summary-item high">${severityCounts.high || 0} <span>高</span></div>
            <div class="summary-item medium">${severityCounts.medium || 0} <span>中</span></div>
            <div class="summary-item low">${severityCounts.low || 0} <span>低</span></div>
        </div>
        <div class="vulnerability-list">
    `;
    
    // 脆弱性リストを追加
    vulnerabilities.forEach(vuln => {
        resultsHTML += `
            <div class="vulnerability-item severity-${vuln.severity}">
                <div class="vulnerability-header">
                    <div class="vulnerability-type">${vuln.type}</div>
                    <div class="vulnerability-severity">${getSeverityLabel(vuln.severity)}</div>
                </div>
                <div class="vulnerability-details">
                    <p><strong>場所:</strong> ${vuln.location}</p>
                    <p>${vuln.description}</p>
                </div>
            </div>
        `;
    });
    
    resultsHTML += `</div>`;
    
    container.innerHTML = resultsHTML;
}

// 深刻度のラベルを取得
function getSeverityLabel(severity) {
    switch (severity) {
        case 'critical':
            return '致命的';
        case 'high':
            return '高';
        case 'medium':
            return '中';
        case 'low':
            return '低';
        default:
            return '不明';
    }
}

// セクションの表示を切り替える関数
function showSection(sectionId) {
    console.log(`セクション表示: ${sectionId}`);
    
    // 全てのセクションを非表示
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // 指定されたセクションを表示
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // ヘッダータイトルを更新
        const headerTitle = document.querySelector('.dashboard-header h1');
        if (headerTitle) {
            if (sectionId === 'project') {
                // プロジェクト詳細の場合はヘッダータイトルを非表示に
                headerTitle.style.display = 'none';
                
                // section-headerのh2要素をデフォルトに戻す（プロジェクト詳細）
                const sectionTitle = document.querySelector('#project-section .section-header h2');
                if (sectionTitle && !sectionTitle.dataset.original) {
                    sectionTitle.dataset.original = sectionTitle.textContent;
                }
            } else {
                // 他のセクションではヘッダータイトルを表示
                headerTitle.style.display = 'block';
                
                // プロジェクト詳細のタイトルをデフォルトに戻す
                const projectSectionTitle = document.querySelector('#project-section .section-header h2');
                if (projectSectionTitle && projectSectionTitle.dataset.original) {
                    projectSectionTitle.textContent = projectSectionTitle.dataset.original;
                }
                
                switch(sectionId) {
                    case 'dashboard':
                        headerTitle.textContent = 'ダッシュボード';
                        break;
                    case 'scan':
                        headerTitle.textContent = '新規プロジェクト';
                        break;
                    case 'history':
                        headerTitle.textContent = 'スキャン履歴';
                        break;
                    case 'reports':
                        headerTitle.textContent = 'レポート';
                        break;
                    case 'vulnerabilities':
                        headerTitle.textContent = '脆弱性データベース';
                        break;
                    case 'settings':
                        headerTitle.textContent = '設定';
                        break;
                    default:
                        headerTitle.textContent = 'ダッシュボード';
                }
            }
        }
    }
}

// ユーザーのプロジェクトを取得して表示
async function loadUserProjects(userId) {
    try {
        // 進行中のプロジェクトを取得
        const { data: runningProjects, error: runningError } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'running')
            .order('created_at', { ascending: false });
        
        if (runningError) throw runningError;
        
        // 統計情報を更新
        updateStatsFromProjects(userId);
        
        // プロジェクトがあればサンプルプロジェクトを削除して実際のプロジェクトを表示
        const ongoingProjects = document.getElementById('ongoingProjectsContainer');
        if (!ongoingProjects) return;
        
        // 進行中プロジェクトがあれば表示
        if (runningProjects && runningProjects.length > 0) {
            // サンプルプロジェクトを削除
            ongoingProjects.innerHTML = '';
            
            // プロジェクトを表示
            runningProjects.forEach(project => {
                // プロジェクトデータをフロントエンド形式に変換
                const projectData = {
                    id: project.id,
                    projectName: project.name,
                    targetUrl: project.target_url,
                    scanType: project.scan_type,
                    options: project.options,
                    userId: project.user_id,
                    status: project.status,
                    progress: project.progress,
                    createdAt: project.created_at
                };
                
                // プロジェクトカードを追加
                addProjectToOngoingProjects(projectData);
            });
        }
    } catch (error) {
        console.error('プロジェクト取得エラー:', error);
    }
}

// 統計情報を更新
async function updateStatsFromProjects(userId) {
    try {
        // すべてのプロジェクトを取得
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId);
        
        if (error) throw error;
        
        if (!projects || projects.length === 0) return;
        
        // 統計情報の要素
        const scanCountElement = document.querySelector('.stats-container .stat-card:nth-child(1) .stat-info h3');
        const highRiskElement = document.querySelector('.stats-container .stat-card:nth-child(2) .stat-info h3');
        const mediumRiskElement = document.querySelector('.stats-container .stat-card:nth-child(3) .stat-info h3');
        const fixedElement = document.querySelector('.stats-container .stat-card:nth-child(4) .stat-info h3');
        
        if (scanCountElement) {
            scanCountElement.textContent = projects.length;
        }
        
        // この部分は実際にはバックエンドから脆弱性データを取得する必要がありますが、
        // 現在はプロジェクト数に基づいて簡易的に表示します
        if (highRiskElement) {
            const highRiskCount = projects.filter(p => p.options && p.options.includes('sqli')).length;
            highRiskElement.textContent = highRiskCount;
        }
        
        if (mediumRiskElement) {
            const mediumRiskCount = projects.filter(p => 
                p.options && (p.options.includes('xss') || p.options.includes('csrf'))
            ).length;
            mediumRiskElement.textContent = mediumRiskCount;
        }
        
        if (fixedElement) {
            const fixedCount = projects.filter(p => p.status === 'completed').length;
            fixedElement.textContent = fixedCount;
        }
    } catch (error) {
        console.error('統計情報更新エラー:', error);
    }
}

// サンプルプロジェクトの操作機能を設定する
function setupSampleProjectActions() {
    // サンプルプロジェクトの詳細表示ボタン
    const sampleViewBtn = document.querySelector('#ongoingProjectsContainer .project-card:not([data-project-id]) .btn-view-details');
    if (sampleViewBtn) {
        sampleViewBtn.addEventListener('click', function() {
            showSection('project');
            // サンプルプロジェクト用のデータ
            const sampleData = {
                projectName: 'サンプルプロジェクト',
                targetUrl: 'https://example.com',
                scanType: 'full',
                options: ['xss', 'sqli', 'csrf'],
                status: 'running',
                progress: 45,
                createdAt: '2023-10-25T14:30:00'
            };
            showProjectDetails(sampleData);
        });
    }
    
    // サンプルプロジェクトの中止ボタン
    const sampleCancelBtn = document.querySelector('#ongoingProjectsContainer .project-card:not([data-project-id]) .btn-cancel');
    if (sampleCancelBtn) {
        sampleCancelBtn.addEventListener('click', function() {
            if (confirm('サンプルプロジェクトのスキャンを中止しますか？')) {
                const projectCard = this.closest('.project-card');
                
                // ステータスを中止に変更
                const statusElement = projectCard.querySelector('.project-status');
                statusElement.textContent = '中止';
                statusElement.className = 'project-status status-cancelled';
                
                // 進捗バーの色を変更
                const progressFill = projectCard.querySelector('.progress-fill');
                progressFill.style.backgroundColor = '#888';
                
                // 残り時間表示を更新
                const remainingTime = projectCard.querySelector('.progress-stats div:last-child');
                remainingTime.textContent = '中止';
                
                // ボタンを再開ボタンに変更
                const actionsContainer = projectCard.querySelector('.project-actions');
                actionsContainer.innerHTML = `
                    <button class="btn btn-sm btn-view-details">詳細を表示</button>
                    <button class="btn btn-sm btn-resume">再開</button>
                `;
                
                // 詳細ボタンに再度イベントリスナーを追加
                const newViewBtn = actionsContainer.querySelector('.btn-view-details');
                newViewBtn.addEventListener('click', function() {
                    showSection('project');
                    // サンプルプロジェクト用のデータ
                    const sampleData = {
                        projectName: 'サンプルプロジェクト',
                        targetUrl: 'https://example.com',
                        scanType: 'full',
                        options: ['xss', 'sqli', 'csrf'],
                        status: 'cancelled',
                        progress: 45,
                        createdAt: '2023-10-25T14:30:00'
                    };
                    showProjectDetails(sampleData);
                });
                
                // 再開ボタンにイベントリスナーを追加
                const resumeBtn = actionsContainer.querySelector('.btn-resume');
                resumeBtn.addEventListener('click', function() {
                    if (confirm('サンプルプロジェクトのスキャンを再開しますか？')) {
                        // 再開ロジック（サンプル用）
                        statusElement.textContent = '実行中';
                        statusElement.className = 'project-status status-running';
                        progressFill.style.backgroundColor = '#3b82f6';
                        remainingTime.textContent = '予想残り時間: 約15分';
                        
                        // ボタンを中止ボタンに戻す
                        actionsContainer.innerHTML = `
                            <button class="btn btn-sm btn-view-details">詳細を表示</button>
                            <button class="btn btn-sm btn-cancel">中止</button>
                        `;
                        
                        // イベントリスナーを再設定
                        setupSampleProjectActions();
                    }
                });
            }
        });
    }
}

// 進行中のプロジェクトを表示する関数
async function displayOngoingProjects() {
    try {
        console.log('進行中のプロジェクトを取得中...');
        
        // セッションからユーザー情報を取得
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('セッション取得エラー:', sessionError);
            return;
        }
        
        if (!session || !session.user) {
            console.error('ユーザーセッションが見つかりません');
            return;
        }
        
        const userId = session.user.id;
        
        // Supabaseからプロジェクトデータを取得
        const { data: projects, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        console.log('取得したプロジェクト:', projects);
        
        const projectsContainer = document.getElementById('ongoingProjectsContainer');
        if (!projectsContainer) {
            console.error('プロジェクトコンテナが見つかりません');
            return;
        }
        
        // コンテナをクリア
        projectsContainer.innerHTML = '';
        
        if (!projects || projects.length === 0) {
            projectsContainer.innerHTML = '<p class="text-center py-4">現在進行中のプロジェクトはありません。</p>';
            return;
        }
        
        // プロジェクトごとにカードを生成
        projects.forEach(project => {
            const progress = project.progress || 0;
            const statusClass = getStatusClass(project.status);
            
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            projectCard.dataset.projectId = project.id;
            
            let statusText = '実行中';
            let statusClassName = 'status-running';
            
            if (project.status === 'completed') {
                statusText = '完了';
                statusClassName = 'status-completed';
            } else if (project.status === 'cancelled') {
                statusText = '中止';
                statusClassName = 'status-cancelled';
            }
            
            projectCard.innerHTML = `
                <div class="project-header">
                    <div class="project-title">${project.name}</div>
                    <div class="project-status ${statusClassName}">${statusText}</div>
                </div>
                <div class="project-details">
                    <div><i class="fas fa-globe"></i> ${project.target_url}</div>
                    <div><i class="fas fa-clock"></i> 開始: ${new Date(project.created_at).toLocaleString()}</div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                    <div class="progress-stats">
                        <div>進捗: ${progress}%</div>
                        <div>${project.status === 'completed' ? '完了' : '予想残り時間: 計算中...'}</div>
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-sm btn-view-details">詳細を表示</button>
                    ${project.status === 'running' ? '<button class="btn btn-sm btn-cancel">中止</button>' : 
                     project.status === 'cancelled' ? '<button class="btn btn-sm btn-resume">再開</button>' : 
                     '<button class="btn btn-sm btn-completed disabled">完了</button>'}
                </div>
            `;
            
            projectsContainer.appendChild(projectCard);
            
            // ボタンにイベントリスナーを追加
            const viewDetailsBtn = projectCard.querySelector('.btn-view-details');
            if (viewDetailsBtn) {
                viewDetailsBtn.addEventListener('click', function() {
                    showSection('project');
                    const projectData = {
                        id: project.id,
                        projectName: project.name,
                        targetUrl: project.target_url,
                        scanType: project.scan_type,
                        options: project.options,
                        userId: project.user_id,
                        status: project.status,
                        progress: project.progress,
                        createdAt: project.created_at
                    };
                    showProjectDetails(projectData);
                });
            }
            
            // 中止ボタンのイベントリスナー
            const cancelBtn = projectCard.querySelector('.btn-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    if (confirm(`プロジェクト「${project.name}」のスキャンを中止しますか？`)) {
                        // プロジェクトデータを作成
                        const projectData = {
                            id: project.id,
                            projectName: project.name,
                            targetUrl: project.target_url,
                            scanType: project.scan_type,
                            options: project.options,
                            userId: project.user_id,
                            status: 'cancelled',
                            progress: project.progress,
                            createdAt: project.created_at
                        };
                        
                        // データベースのステータスを更新
                        updateProjectStatus(project.id, 'cancelled');
                        
                        // UIを更新
                        updateProjectCardButtons(projectCard, projectData);
                    }
                });
            }
            
            // 再開ボタンのイベントリスナー
            const resumeBtn = projectCard.querySelector('.btn-resume');
            if (resumeBtn) {
                resumeBtn.addEventListener('click', function() {
                    resumeProject({
                        id: project.id,
                        projectName: project.name,
                        targetUrl: project.target_url,
                        scanType: project.scan_type,
                        options: project.options,
                        userId: project.user_id,
                        status: project.status,
                        progress: project.progress,
                        createdAt: project.created_at
                    }, projectCard);
                });
            }
        });
    } catch (error) {
        console.error('プロジェクト取得エラー:', error);
    }
}

// ステータスに応じたクラスを返す関数
function getStatusClass(status) {
    switch(status) {
        case '完了':
            return 'bg-green-100 text-green-800';
        case '進行中':
            return 'bg-blue-100 text-blue-800';
        case 'エラー':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
} 