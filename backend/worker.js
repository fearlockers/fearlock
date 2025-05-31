// Cloudflare Workersでの認証処理用コード
// @see https://developers.cloudflare.com/workers/

import { createClient } from '@supabase/supabase-js';

// 環境変数からSupabase接続情報を取得
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;

async function handleLogin(request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { email, password } = body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: 'ログイン成功', user: data.user }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

async function handleSignup(request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const { email, password } = body;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // ユーザー情報をデータベースに保存
    const user = data.user;
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ id: user.id, email }]);

    if (insertError) {
      return new Response(
        JSON.stringify({ error: '新規登録は成功しましたが、ユーザー情報の保存に失敗しました' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: '新規登録成功', user: data.user }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'サーバーエラーが発生しました' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// CORSプリフライトリクエストへの応答
function handleOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// リクエストハンドラー
export default {
  async fetch(request, env, ctx) {
    // 環境変数をグローバル変数に設定
    globalThis.SUPABASE_URL = env.SUPABASE_URL;
    globalThis.SUPABASE_KEY = env.SUPABASE_KEY;

    const url = new URL(request.url);
    const path = url.pathname;

    // CORSプリフライトリクエストの処理
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // APIエンドポイントの処理
    if (path === '/api/login' && request.method === 'POST') {
      return handleLogin(request);
    } else if (path === '/api/signup' && request.method === 'POST') {
      return handleSignup(request);
    }

    // 404 Not Found
    return new Response('Not Found', { status: 404 });
  },
}; 