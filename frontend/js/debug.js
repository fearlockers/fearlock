// デバッグ用のスクリプト - プロジェクト作成のデバッグを支援します

// デバッグモードのグローバル設定
let isDebugMode = false;

// デバッグログコンテナ
let debugLogContainer = null;

// デバッグログを初期化する関数
function initDebugger() {
    // クエリパラメータでデバッグモードを有効化
    const urlParams = new URLSearchParams(window.location.search);
    isDebugMode = urlParams.has('debug');
    
    if (isDebugMode) {
        console.log('🔍 デバッグモードが有効です');
        createDebugUI();
    }
    
    // オリジナルのconsole.logメソッドを拡張
    const originalConsoleLog = console.log;
    console.log = function() {
        // オリジナルのconsole.logを呼び出し
        originalConsoleLog.apply(console, arguments);
        
        // デバッグモードが有効な場合、UIにもログを表示
        if (isDebugMode && debugLogContainer) {
            const log = Array.from(arguments).map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                } else {
                    return String(arg);
                }
            }).join(' ');
            
            const logEntry = document.createElement('div');
            logEntry.className = 'debug-log-entry';
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${log}`;
            debugLogContainer.appendChild(logEntry);
            
            // 自動スクロール
            debugLogContainer.scrollTop = debugLogContainer.scrollHeight;
        }
    };
    
    // エラーログも同様に拡張
    const originalConsoleError = console.error;
    console.error = function() {
        // オリジナルのconsole.errorを呼び出し
        originalConsoleError.apply(console, arguments);
        
        // デバッグモードが有効な場合、UIにもログを表示（エラースタイル）
        if (isDebugMode && debugLogContainer) {
            const log = Array.from(arguments).map(arg => {
                if (typeof arg === 'object') {
                    return JSON.stringify(arg, null, 2);
                } else {
                    return String(arg);
                }
            }).join(' ');
            
            const logEntry = document.createElement('div');
            logEntry.className = 'debug-log-entry error';
            logEntry.textContent = `[${new Date().toLocaleTimeString()}] 🔴 ERROR: ${log}`;
            debugLogContainer.appendChild(logEntry);
            
            // 自動スクロール
            debugLogContainer.scrollTop = debugLogContainer.scrollHeight;
        }
    };
}

// デバッグUIの作成
function createDebugUI() {
    const debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.className = 'debug-container';
    
    // デバッグパネルのスタイル
    debugContainer.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        height: 300px;
        background-color: rgba(0, 0, 0, 0.85);
        color: #0f0;
        font-family: monospace;
        font-size: 12px;
        padding: 10px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        border-top-left-radius: 5px;
    `;
    
    // ヘッダー
    const header = document.createElement('div');
    header.className = 'debug-header';
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        padding-bottom: 5px;
        border-bottom: 1px solid #333;
    `;
    
    const title = document.createElement('div');
    title.textContent = '🔍 デバッグコンソール - プロジェクト作成';
    
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'X';
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #f55;
        cursor: pointer;
    `;
    closeBtn.onclick = () => {
        document.body.removeChild(debugContainer);
        isDebugMode = false;
    };
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    debugContainer.appendChild(header);
    
    // ログコンテナ
    debugLogContainer = document.createElement('div');
    debugLogContainer.className = 'debug-log';
    debugLogContainer.style.cssText = `
        flex: 1;
        overflow-y: auto;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 5px;
        border-radius: 3px;
    `;
    debugContainer.appendChild(debugLogContainer);
    
    // コントロールパネル
    const controls = document.createElement('div');
    controls.className = 'debug-controls';
    controls.style.cssText = `
        margin-top: 8px;
        display: flex;
        gap: 5px;
    `;
    
    // クリアボタン
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'ログをクリア';
    clearBtn.style.cssText = `
        background-color: #333;
        color: white;
        border: none;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
    `;
    clearBtn.onclick = () => {
        debugLogContainer.innerHTML = '';
    };
    
    // テストボタン
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Supabase接続をテスト';
    testBtn.style.cssText = `
        background-color: #007bff;
        color: white;
        border: none;
        padding: 3px 8px;
        border-radius: 3px;
        cursor: pointer;
    `;
    testBtn.onclick = async () => {
        console.log('Supabase接続テストを実行中...');
        
        try {
            // セッションの確認
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) {
                throw new Error('セッション取得エラー: ' + sessionError.message);
            }
            
            console.log('現在のセッション:', sessionData);
            
            if (!sessionData.session) {
                throw new Error('有効なセッションがありません。ログインが必要です。');
            }
            
            // プロジェクトテーブルの確認
            console.log('プロジェクトテーブルを確認中...');
            const { data: projectsData, error: projectsError } = await supabase
                .from('projects')
                .select('id, name')
                .limit(1);
                
            if (projectsError) {
                throw new Error('プロジェクトテーブル確認エラー: ' + projectsError.message);
            }
            
            console.log('プロジェクトテーブル確認成功:', projectsData);
            console.log('Supabase接続テスト完了: 正常に接続できています ✅');
        } catch (err) {
            console.error('Supabase接続テスト失敗:', err);
        }
    };
    
    controls.appendChild(clearBtn);
    controls.appendChild(testBtn);
    debugContainer.appendChild(controls);
    
    // デバッグUIを追加
    document.body.appendChild(debugContainer);
    
    // 初期ログ
    console.log('デバッグコンソールが初期化されました');
    console.log('URL: ' + window.location.href);
    console.log('デバッグモード: 有効');
    console.log('---------------------------');
}

// デバッグ情報をログに出力
function logDebugInfo(message, data = null) {
    if (!isDebugMode) return;
    
    if (data) {
        console.log(`📝 ${message}:`, data);
    } else {
        console.log(`📝 ${message}`);
    }
}

// オブジェクトをデータベース形式でログに出力
function logDbOperation(operationType, tableName, data) {
    if (!isDebugMode) return;
    
    const operationSymbol = {
        'select': '🔍 SELECT',
        'insert': '➕ INSERT',
        'update': '🔄 UPDATE',
        'delete': '❌ DELETE'
    }[operationType.toLowerCase()] || operationType;
    
    console.log(`${operationSymbol} on ${tableName}:`, data);
}

// ページ読み込み時にデバッガーを初期化
document.addEventListener('DOMContentLoaded', initDebugger);

// グローバルに公開する関数
window.debugTools = {
    isDebugMode: () => isDebugMode,
    log: logDebugInfo,
    logDb: logDbOperation,
    clear: () => {
        if (debugLogContainer) {
            debugLogContainer.innerHTML = '';
        }
    },
    testSupabase: async () => {
        if (typeof testBtn !== 'undefined' && testBtn) {
            testBtn.click();
        }
    }
}; 