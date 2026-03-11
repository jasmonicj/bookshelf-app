# bookshelf-app アーキテクチャドキュメント

作成日: 2026-03-11

---

## 1. システム概要

bookshelf-app は、個人の蔵書を管理するWebアプリケーションである。ユーザーは本の読書ステータス・評価・保管場所を記録し、研究プロジェクトと本を紐付けてリファレンスノートを管理できる。

### システム構成図

```
+---------------------------+
|        ブラウザ            |
|  (Next.js Client Components)|
+---------------------------+
            |
            | HTTPS
            v
+---------------------------+
|        Vercel             |
|  Next.js App Router       |
|  (Server Components /     |
|   Route Handlers /        |
|   Middleware)             |
+---------------------------+
       |            |
       |            | HTTPS (REST / Auth)
       |            v
       |   +------------------+
       |   |    Supabase      |
       |   |  - Auth          |
       |   |  - PostgreSQL DB |
       |   |  - RLS Policies  |
       |   +------------------+
       |
       | HTTPS (公開API)
       v
+---------------------------+
|   Google Books API        |
|  (APIキー不要・公開エンドポイント)|
+---------------------------+
```

---

## 2. 技術スタック

| カテゴリ | 技術 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.1.6 |
| UIライブラリ | React | 19.2.3 |
| 言語 | TypeScript | ^5 |
| スタイリング | Tailwind CSS | ^4 |
| バックエンド / DB | Supabase (PostgreSQL) | @supabase/supabase-js ^2.99.1 |
| 認証 | Supabase Auth | @supabase/ssr ^0.9.0 |
| 外部API | Google Books API | 公開エンドポイント (APIキー不要) |
| ホスティング | Vercel | - |

---

## 3. ディレクトリ構成

```
bookshelf-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # ルートレイアウト
│   │   ├── (app)/                      # 認証必須ルートグループ
│   │   │   ├── layout.tsx              # force-dynamic 設定
│   │   │   ├── page.tsx                # 蔵書一覧ページ (メイン)
│   │   │   ├── locations/
│   │   │   │   └── page.tsx            # 保管場所管理ページ
│   │   │   └── projects/
│   │   │       ├── page.tsx            # プロジェクト一覧ページ
│   │   │       └── [id]/
│   │   │           └── page.tsx        # プロジェクト詳細・リファレンスノートページ
│   │   ├── login/
│   │   │   └── page.tsx                # ログインページ
│   │   ├── signup/
│   │   │   └── page.tsx                # サインアップページ
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts            # OAuth認証コールバック (Route Handler)
│   ├── components/
│   │   ├── BookCard.tsx                # 本カードコンポーネント
│   │   ├── BookModal.tsx               # 本の追加・編集モーダル
│   │   ├── BookSearch.tsx              # Google Books API 検索コンポーネント
│   │   └── Header.tsx                 # ナビゲーションヘッダー
│   ├── lib/
│   │   ├── types.ts                    # TypeScript 型定義
│   │   └── supabase/
│   │       ├── client.ts               # ブラウザ用 Supabase クライアント
│   │       ├── server.ts               # サーバー用 Supabase クライアント
│   │       └── middleware.ts           # セッション更新ロジック
│   └── middleware.ts                   # ルート保護 Middleware
├── supabase/
│   └── schema.sql                      # DBスキーマ定義
└── docs/
    └── architecture.md                 # 本ドキュメント
```

---

## 4. データベース設計

### テーブル一覧と関係

```
auth.users (Supabase管理)
    |
    +--< locations (保管場所)
    |       id          uuid PK
    |       user_id     uuid FK -> auth.users
    |       name        text NOT NULL
    |       description text
    |       created_at  timestamptz
    |
    +--< books (蔵書)
    |       id          uuid PK
    |       user_id     uuid FK -> auth.users
    |       title       text NOT NULL
    |       author      text NOT NULL
    |       isbn        text
    |       cover_url   text
    |       status      text ('want' | 'reading' | 'read')
    |       rating      integer (1〜5)
    |       review      text
    |       location_id uuid FK -> locations (SET NULL on delete)
    |       created_at  timestamptz
    |       updated_at  timestamptz
    |
    +--< projects (プロジェクト)
    |       id          uuid PK
    |       user_id     uuid FK -> auth.users
    |       name        text NOT NULL
    |       description text
    |       created_at  timestamptz
    |
    +--< reference_notes (リファレンスノート)
            id          uuid PK
            user_id     uuid FK -> auth.users
            book_id     uuid FK -> books (CASCADE on delete)
            project_id  uuid FK -> projects (CASCADE on delete)
            content     text NOT NULL
            page_ref    text
            created_at  timestamptz
            updated_at  timestamptz
```

### テーブル詳細

#### books

蔵書の中心テーブル。読書ステータスは `status` カラムで管理し、`'want'`（読みたい）・`'reading'`（読書中）・`'read'`（読了）の3値に制約されている。`rating` は1〜5の整数制約付き。`location_id` は保管場所への外部キーで、保管場所が削除された場合は `NULL` に設定される。

#### reference_notes

本（`book_id`）とプロジェクト（`project_id`）を結びつける中間テーブル。単なる多対多の紐付けに留まらず、`content`（メモ内容）と `page_ref`（参照ページ）を持ち、研究・読書メモとして機能する。

#### トリガー

`books` および `reference_notes` テーブルには `updated_at` を自動更新するトリガー（`handle_updated_at`）が設定されている。

---

## 5. 認証フロー

### メールアドレス + パスワード認証

```
ユーザー          Next.js (Vercel)         Supabase Auth
   |                    |                       |
   |-- POST /signup --> |                       |
   |                    |-- signUp() ---------->|
   |                    |<-- セッション発行 ------|
   |<-- / へリダイレクト|                       |
   |                    |                       |
   |-- POST /login ---> |                       |
   |                    |-- signInWithPassword()->|
   |                    |<-- JWT セッション ------|
   |<-- / へリダイレクト|                       |
```

### OAuth / メールリンク認証コールバック

```
ユーザー          Next.js (Vercel)         Supabase Auth
   |                    |                       |
   |-- GET /auth/callback?code=xxx -->          |
   |                    |-- exchangeCodeForSession(code) ->|
   |                    |<-- セッション確立 ------|
   |<-- origin/ へリダイレクト                   |
```

`src/app/auth/callback/route.ts` の Route Handler が認証コードを受け取り、`supabase.auth.exchangeCodeForSession(code)` でセッションに変換する。

### セッション管理

- セッション情報はCookieで管理される。
- `src/lib/supabase/middleware.ts` の `updateSession()` が全リクエストに対して実行され、Cookieからセッションを読み取り・更新する。
- セッションCookieはリクエスト・レスポンス両方に同期して書き込まれる。

---

## 6. ルート保護とMiddleware

`src/middleware.ts` はNext.jsのMiddlewareとして機能し、静的ファイル・画像・faviconを除く全リクエストを対象に `updateSession()` を呼び出す。

```
matcher: /((?!_next/static|_next/image|favicon.ico|.*\.(svg|png|jpg|jpeg|gif|webp)$).*)
```

`updateSession()` 内で未認証ユーザー（`user` が `null`）が `/login`・`/signup`・`/auth` 以外のパスにアクセスした場合、`/login` へリダイレクトする。

```
未認証 + 保護されたパス  --->  /login へリダイレクト
認証済み               --->  そのままリクエストを通過
```

---

## 7. セキュリティ (Row Level Security)

全テーブルに対してPostgreSQLのRow Level Security (RLS) が有効化されている。各テーブルには以下の統一ポリシーが適用されており、`auth.uid()` と各行の `user_id` が一致する場合のみ全操作（SELECT / INSERT / UPDATE / DELETE）が許可される。

| テーブル | ポリシー名 | 条件 |
|---|---|---|
| locations | Users can manage own locations | `auth.uid() = user_id` |
| books | Users can manage own books | `auth.uid() = user_id` |
| projects | Users can manage own projects | `auth.uid() = user_id` |
| reference_notes | Users can manage own reference_notes | `auth.uid() = user_id` |

RLSによりデータベースレベルで他ユーザーのデータへのアクセスが完全に遮断されるため、アプリケーション層のバグによる情報漏洩リスクが大幅に低減される。

---

## 8. Supabaseクライアントの使い分け

Next.js App Router では実行環境に応じて2種類のSupabaseクライアントを使い分ける。

| ファイル | 用途 | 使用箇所 |
|---|---|---|
| `src/lib/supabase/client.ts` | ブラウザ用クライアント (`createBrowserClient`) | Client Components (`"use client"`) |
| `src/lib/supabase/server.ts` | サーバー用クライアント (`createServerClient`) | Server Components / Route Handlers / Middleware |

ブラウザ用クライアントは `useMemo` でメモ化する `useSupabase()` フックも提供しており、不要な再生成を防いでいる。

サーバー用クライアントはNext.jsの `cookies()` を介してCookieを読み書きし、Server Componentからはセットのみ試行（失敗しても無視）する設計になっている。

---

## 9. Google Books API 連携

`src/components/BookSearch.tsx` (Client Component) がブラウザから直接 Google Books API を呼び出す。

- エンドポイント: `https://www.googleapis.com/books/v1/volumes`
- パラメータ: `q`（検索クエリ）, `maxResults=8`
- APIキー不要（公開エンドポイント）
- 取得データ: タイトル・著者・表紙画像URL・ISBN (ISBN-13 優先、なければ ISBN-10)

---

## 10. デプロイアーキテクチャ

```
開発環境 (ローカル)
    |
    | git push
    v
GitHub リポジトリ
    |
    | 自動デプロイ (Vercel GitHub連携)
    v
+---------------------------+
|        Vercel             |
|  - Next.js ビルド・実行   |
|  - Edge Middleware        |
|  - 環境変数管理           |
|    NEXT_PUBLIC_SUPABASE_URL|
|    NEXT_PUBLIC_SUPABASE_ANON_KEY|
+---------------------------+
            |
            | HTTPS
            v
+---------------------------+
|        Supabase           |
|  (マネージドサービス)      |
|  - PostgreSQL             |
|  - Auth サーバー          |
|  - RLS                    |
+---------------------------+
```

### 環境変数

| 変数名 | 説明 | 公開範囲 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | クライアント・サーバー両方 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名キー | クライアント・サーバー両方 |

`NEXT_PUBLIC_` プレフィックスによりブラウザにも公開されるが、実際のデータアクセス制御はRLSによってデータベース側で行われるため、匿名キーが露出しても他ユーザーのデータは保護される。

---

## 11. TypeScript 型定義

`src/lib/types.ts` でアプリ全体の型を一元管理している。

| 型名 | 対応テーブル / 用途 |
|---|---|
| `BookStatus` | `'want' \| 'reading' \| 'read'` のユニオン型 |
| `Book` | `books` テーブル |
| `Location` | `locations` テーブル |
| `Project` | `projects` テーブル |
| `ReferenceNote` | `reference_notes` テーブル (book・projectのリレーションも含む) |
| `GoogleBookResult` | Google Books API レスポンスの型 |
