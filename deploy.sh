#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND="$REPO_ROOT/backend"
FRONTEND="$REPO_ROOT/frontend"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  strategy-brain デプロイスクリプト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── STEP 1: Railway バックエンド ─────────────────────────────
echo "【STEP 1/2】バックエンドを Railway にデプロイします..."
echo ""
echo "ブラウザが開くので「Authorize Railway」を押してください。"
echo ""

cd "$BACKEND"
railway login

echo ""
echo "Railway プロジェクトを作成中..."
railway init --name strategy-brain-api

echo ""
echo "環境変数を設定中..."
OPENAI_KEY=$(grep ^OPENAI_API_KEY "$BACKEND/.env" | cut -d= -f2-)
railway variables set \
  OPENAI_API_KEY="$OPENAI_KEY" \
  LLM_PROVIDER=openai \
  OPENAI_MODEL=gpt-4o \
  DEBUG=false

echo ""
echo "バックエンドをデプロイ中（2〜3分かかります）..."
railway up --detach

echo ""
echo "Railway の URL を取得中..."
sleep 15
BACKEND_URL=$(railway status 2>/dev/null | grep -oE 'https://[^ ]+railway\.app' | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
  BACKEND_URL=$(railway domain 2>/dev/null | grep -oE 'https://[^ ]+' | head -1 || echo "")
fi

if [ -z "$BACKEND_URL" ]; then
  echo ""
  echo "⚠️  Railway の URL を自動取得できませんでした。"
  echo "   railway.app のダッシュボードで URL を確認して貼り付けてください："
  read -p "   Backend URL (https://xxx.railway.app): " BACKEND_URL
fi

echo ""
echo "✅ バックエンド URL: $BACKEND_URL"

# ── STEP 2: Vercel フロントエンド ────────────────────────────
echo ""
echo "【STEP 2/2】フロントエンドを Vercel にデプロイします..."
echo ""
echo "ブラウザが開くので Vercel にログインしてください。"
echo ""

cd "$FRONTEND"

# NEXT_PUBLIC_API_URL を本番 URL に更新
echo "NEXT_PUBLIC_API_URL=${BACKEND_URL}/api" > .env.production.local

npx vercel --prod \
  --yes \
  --env NEXT_PUBLIC_API_URL="${BACKEND_URL}/api" \
  2>&1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ デプロイ完了！"
echo ""
echo "  バックエンド: ${BACKEND_URL}"
echo "  フロントエンド: Vercel のダッシュボードで確認"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
