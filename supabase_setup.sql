-- usersテーブルを作成
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ユーザーが自分のデータのみ参照できるポリシー
CREATE POLICY "ユーザーは自分のデータのみ参照可能" ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- 認証されたユーザーが自分のデータを追加できるポリシー
CREATE POLICY "認証されたユーザーは自分のデータを追加可能" ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 認証されたユーザーが自分のデータを更新できるポリシー
CREATE POLICY "認証されたユーザーは自分のデータを更新可能" ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

-- 認証されたユーザーのデータ参照用関数
CREATE OR REPLACE FUNCTION public.get_authenticated_user()
RETURNS SETOF public.users
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.users WHERE id = auth.uid();
$$; 