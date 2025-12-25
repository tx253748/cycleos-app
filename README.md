# CycleOS

週次サイクルで目標達成をサポートするAIコーチアプリ。

## 特徴

- 🤖 Claude AIによる週次分析・提案
- 📊 AIが自動でレポート生成
- 💬 相談モードで自然な会話
- 🎯 チャネル別KPI管理
- 📈 売上・資産トラッキング

## セットアップ

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して ANTHROPIC_API_KEY を設定

# 開発サーバー起動
npm run dev
```

## 環境変数

| 変数名 | 説明 | 取得先 |
|--------|------|--------|
| ANTHROPIC_API_KEY | Claude API Key | https://console.anthropic.com/ |

## Vercelへのデプロイ

1. GitHubにリポジトリを作成してプッシュ
2. [Vercel](https://vercel.com) でリポジトリをインポート
3. Environment Variables に `ANTHROPIC_API_KEY` を設定
4. Deploy

### Vercel CLIを使う場合

```bash
npm i -g vercel
vercel

# 環境変数を設定
vercel env add ANTHROPIC_API_KEY
```

## API構成

```
/api/analyze  - 週次データ分析（Claude API）
/api/propose  - 来週の提案生成（Claude API）
/api/chat     - 相談モードの会話（Claude API）
```

## 技術スタック

- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Lucide Icons
- Claude API (claude-sonnet-4-20250514)
- LocalStorage（データ永続化）

## コスト目安

Claude APIの利用コスト（目安）:
- 週次サイクル1回: 約5-10円
- 相談モード1往復: 約1-2円

## ライセンス

MIT
