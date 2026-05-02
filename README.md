# 外壁塗装 概算見積もりツール

GitHub Pages フロント + Vercel API バックエンド構成。顧客がフォーム入力 → LINE Login → 公式LINEに見積もり配信。

## 構成

- `public/` - GitHub Pages 配信 (静的フォーム画面)
- `api/` - Vercel Serverless Functions (LINE Login callback + push)
- `lib/` - サーバー共通ロジック (計算/LINE API)

## セットアップ

### 1. LINE Developers

同一プロバイダーに2チャネル作成:

**A. Messaging API チャネル** (公式LINEアカウント本体)
- チャネルアクセストークン (long-lived) 発行
- → `MESSAGING_CHANNEL_ACCESS_TOKEN`

**B. LINE Login チャネル** (OAuth)
- Callback URL: `https://<vercel-deploy-url>/api/callback`
- Bot link 機能ON → リンク先: 上記Aの公式アカウント
- → `LINE_LOGIN_CHANNEL_ID` / `LINE_LOGIN_CHANNEL_SECRET`

### 2. GitHub Pages デプロイ

1. GitHubリポジトリ作成 → push
2. Settings → Pages → Source: GitHub Actions
3. 初回push後 Actions タブでデプロイ完了確認
4. Pages URL確認 (例: `https://username.github.io/exterior-painting`)

### 3. Vercel デプロイ

1. [vercel.com](https://vercel.com) → New Project → 同GitHubリポジトリ連携
2. Root Directory: そのまま (リポジトリルート)
3. Framework Preset: Other
4. 環境変数設定:
   - `LINE_LOGIN_CHANNEL_ID`
   - `LINE_LOGIN_CHANNEL_SECRET`
   - `MESSAGING_CHANNEL_ACCESS_TOKEN`
   - `FRONTEND_URL` (GitHub Pages URL)
5. Deploy → URL確認 (例: `https://xxx.vercel.app`)

### 4. フロント設定反映

`public/config.js` 編集:
```js
window.APP_CONFIG = {
  LINE_LOGIN_CHANNEL_ID: '<LINE Login Channel ID>',
  API_BASE_URL: 'https://xxx.vercel.app',
};
```

→ commit + push → GitHub Pages 再デプロイ

### 5. LINE Developers 最終設定

- LINE Login チャネル Callback URL: `https://xxx.vercel.app/api/callback`

## ローカル開発

```bash
npm install
vercel link
vercel env pull .env.local
vercel dev
```

ブラウザで `http://localhost:3000/api/callback` 動作確認。
フロント単体確認: `cd public && python -m http.server 8000`

## 検証

1. GitHub Pages URL アクセス → フォーム表示
2. 延床面積選択 + 氏名入力 → 「LINEで見積もり受け取る」
3. LINE Login画面 → 友達追加同意
4. done.html `?status=ok` 表示
5. LINE トークに見積もりメッセージ受信確認

## 価格テーブル変更

`lib/pricing.json` 編集 → push → Vercel自動デプロイ。
