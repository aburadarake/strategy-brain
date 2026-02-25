# Strategy Brain - 次世代戦略プランニング・ツール

ブリーフを入力するだけで、WHO/WHAT/BIG IDEA/コピーライティングまで一気通貫で出力する戦略プランニングツール。

## 概要

Strategy Brainは、マーケティング戦略立案を自動化するAIツールです。以下の分析を一気通貫で実行します：

1. **障壁分析 (STEP 1-4)**
   - 使わない理由の抽出（30項目）
   - 因果関係の整理（50項目）
   - ABC分類
   - Mermaid図解生成

2. **WHO分析**
   - コアターゲット解剖
   - ターゲットセグメンテーション
   - 消費者インサイト抽出

3. **WHAT分析**
   - 市場環境分析
   - ブランド診断
   - 提供価値の再定義

4. **BIG IDEA生成**
   - 5つの評価基準での評価
   - 代替案の提案

5. **コピーライティング**
   - 10本のコピー案生成
   - 推奨案の提示

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Backend | FastAPI (Python 3.11+) |
| AI | OpenAI GPT-4 / Anthropic Claude |
| Frontend | Next.js 14 (App Router) |
| スタイル | Tailwind CSS |
| アニメーション | Framer Motion |
| 図解 | Mermaid.js |
| 状態管理 | Zustand |

## セットアップ

### 前提条件

- Python 3.11+
- Node.js 18+
- OpenAI API キー または Anthropic API キー

### バックエンド

```bash
cd strategy-brain/backend

# 仮想環境の作成
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 依存関係のインストール
pip install -r requirements.txt

# 環境変数の設定
cp .env.example .env
# .env を編集してAPIキーを設定

# サーバー起動
uvicorn app.main:app --reload
```

### フロントエンド

```bash
cd strategy-brain/frontend

# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev
```

## 環境変数

### バックエンド (.env)

```env
# LLM API Keys
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# LLM Provider Selection: "openai" or "anthropic"
LLM_PROVIDER=openai

# Model Settings
OPENAI_MODEL=gpt-4-turbo-preview
ANTHROPIC_MODEL=claude-3-opus-20240229
```

### フロントエンド

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## API エンドポイント

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| `/api/analyze` | POST | 一気通貫分析 |
| `/api/analyze/stream` | POST | ストリーミング分析 (SSE) |
| `/api/barriers` | POST | 障壁分析のみ |
| `/api/who` | POST | WHO分析のみ |
| `/api/what` | POST | WHAT分析のみ |
| `/api/bigidea` | POST | BIG IDEA生成のみ |
| `/api/copy` | POST | コピー生成のみ |
| `/api/providers` | GET | LLMプロバイダー情報 |

## リクエスト例

```json
{
  "product_name": "Apple Watch",
  "product_description": "健康管理とフィットネストラッキングを中心としたスマートウォッチ",
  "target_market": "20-40代の健康志向なビジネスパーソン",
  "current_situation": "スマートウォッチ市場での高価格帯ポジション",
  "objectives": "新規ユーザー獲得と健康管理機能の認知向上",
  "competitors": "Samsung Galaxy Watch, Fitbit, Garmin"
}
```

## 一気通貫フロー

```
ブリーフ入力
    │
    ▼
┌─────────────────┐
│ STEP 1-4        │ 使わない理由 → 因果関係 → ABC分類 → 図解
│ (障壁分析)      │
└────────┬────────┘
         │
    ▼────┴────▼
┌─────────┐  ┌─────────┐
│   WHO   │  │  WHAT   │  並列処理
│ 分析    │  │  分析   │
└────┬────┘  └────┬────┘
     │            │
     └─────┬──────┘
           ▼
    ┌─────────────┐
    │  BIG IDEA   │ インサイト統合
    └──────┬──────┘
           ▼
    ┌─────────────┐
    │ コピー      │ 10案生成
    │ ライティング│
    └─────────────┘
```

## ディレクトリ構造

```
strategy-brain/
├── backend/
│   ├── app/
│   │   ├── api/routes.py
│   │   ├── brain/
│   │   │   ├── orchestrator.py
│   │   │   ├── step1_barriers.py
│   │   │   ├── step2_causality.py
│   │   │   ├── step3_classify.py
│   │   │   ├── step4_visualize.py
│   │   │   ├── who_analysis.py
│   │   │   ├── what_analysis.py
│   │   │   ├── big_idea.py
│   │   │   ├── copywriting.py
│   │   │   └── prompts/
│   │   ├── models/schemas.py
│   │   ├── services/llm.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

## ライセンス

MIT License
