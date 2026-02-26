# Project Design Specification

This file is the single source of truth for this project. All code must conform to this specification.

## Constitution (Project Rules)
# Vora プロジェクト憲法 (Project Constitution)

> バージョン: 1.0.0 | 制定日: 2025年 | ステータス: 確定

---

## 第1章 ミッション・ビジョン・原則

### 1.1 ミッション
> **「思考を妨げる『入力・整理』という作業をこの世から消し去る」**

すべての技術的判断・機能追加・UI決定は、このミッションに照らして評価されなければならない。

### 1.2 ビジョン
2026年までに、日本語・英語圏を含む10言語市場において、「声で動くカンバン」のデファクトスタンダードになる。

### 1.3 コア設計原則（変更不可）

| 原則 | 定義 | 違反例（禁止） |
|------|------|--------------|
| **Zero Friction** | 入力から整理まで3ステップ以内 | 音声入力前にプロジェクト選択を強制する |
| **AI Confidence First** | AIが自信を持てる時のみ自動実行。不確かな時はユーザーへ確認 | 常に全自動で配置し確認しない |
| **Privacy by Design** | 音声データは処理後即時削除。永続保存は禁止 | 音声ファイルをサーバーに長期保存する |
| **Liquid Minimal** | UIはコンテンツを邪魔しない。アニメーションは意味を持つ | 無意味なデコレーション要素の追加 |
| **Local First Sync** | オフラインでも動作し、接続回復後に同期 | ネット断絶時に全機能停止 |

---

## 第2章 技術的制約（Non-Negotiable）

### 2.1 プラットフォーム仕様
```
フロントエンド : Next.js 15 (App Router) + React 19
スタイリング   : Tailwind CSS v4 + shadcn/ui
言語          : TypeScript 5.x（strict mode 必須）
デプロイ      : Vercel（Edge Runtime 優先）
状態管理      : Zustand + TanStack Query v5
DB            : PostgreSQL 16 (Supabase)
ORM           : Drizzle ORM
認証          : Supabase Auth (OAuth2 + Magic Link)
AI            : OpenAI GPT-4o + Whisper v3
Vector DB     : Pinecone
リアルタイム  : Supabase Realtime (WebSocket)
決済          : Stripe (Billing + Usage-based)
```

### 2.2 パフォーマンス要件（違反時はリリースブロック）

| 指標 | 閾値 | 計測ツール |
|------|------|-----------|
| LCP (Largest Contentful Paint) | ≤ 2.5秒 | Vercel Speed Insights |
| INP (Interaction to Next Paint) | ≤ 200ms | Core Web Vitals |
| 音声→カード生成レイテンシ | ≤ 3秒（P95） | Datadog APM |
| API P99レイテンシ | ≤ 500ms | Vercel Analytics |
| Lighthouse スコア | ≥ 90（全カテゴリ） | CI/CDパイプライン |

### 2.3 TypeScript厳格ルール
```typescript
// tsconfig.json - 必須設定（変更禁止）
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

---

## 第3章 セキュリティ憲法

### 3.1 必須セキュリティ要件

#### 音声データの取り扱い
```
原則: 音声ファイルはサーバーに一切保存しない
処理フロー: クライアント → Edge Function（Whisper API直接転送）→ テキスト返却 → 音声データ即時廃棄
例外: なし（Enterpriseプランでも同様）
```

#### 認証・認可
- すべてのAPIエンドポイントに認証ガード必須
- Row Level Security (RLS) を Supabase で全テーブルに適用
- JWTの有効期限: アクセストークン 1時間、リフレッシュトークン 30日
- MFA: Teamプラン以上で強制推奨、Enterpriseで強制

#### データ分離
```sql
-- 全テーブルに必須のRLSポリシー例
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_data" ON kanban_cards
  USING (auth.uid() = user_id);
```

### 3.2 GDPR・個人情報保護法対応

| 要件 | 実装 |
|------|------|
| データ削除要求 | アカウント削除API（30日以内に完全削除） |
| データポータビリティ | JSON/CSV一括エクスポートAPI |
| 同意管理 | Cookie Consent（OneTrust連携） |
| データ所在地 | 日本ユーザー: ap-northeast-1, EU: eu-west-1 |
| 処理記録 | 全AI処理にaudit_logテーブル記録 |

### 3.3 APIセキュリティ
- Rate Limiting: 全エンドポイントに実装（Upstash Redis）
- Input Validation: Zod v3でサーバーサイドバリデーション必須
- CORS: 許可オリジンを環境変数で厳格管理
- CSP Header: 全ページに適用
- SQL Injection: Drizzle ORMのプリペアドステートメントのみ使用

---

## 第4章 品質憲法

### 4.1 テストカバレッジ要件

| レイヤー | ツール | 最低カバレッジ |
|---------|--------|--------------|
| ユニットテスト | Vitest | 80% |
| コンポーネントテスト | Testing Library | 70% |
| E2Eテスト | Playwright | クリティカルパス100% |
| AI統合テスト | MSW (モック) | 主要シナリオ100% |

### 4.2 コードレビュー規則
- PRサイズ上限: 400行（超過時は分割必須）
- レビュアー: 最低1名の承認必須
- AI生成コード: 必ず人間がレビュー・テスト追加
- 型アサーション(`as`): 使用禁止（`unknown`経由のみ許可）

### 4.3 コミット・ブランチ規則
```
ブランチ命名: feature/VOR-{issue番号}-{説明}
コミット形式: Conventional Commits (feat/fix/chore/docs/test)
例: feat(voice): add noise cancellation preprocessing
```

---

## 第5章 i18n憲法

### 5.1 対応言語（変更禁止）
```
ja  - 日本語（ベース言語）
en  - 英語
zh  - 中国語（簡体字）
ko  - 韓国語
es  - スペイン語
fr  - フランス語
de  - ドイツ語
pt  - ポルトガル語（ブラジル）
ar  - アラビア語（RTLサポート必須）
hi  - ヒンディー語
```

### 5.2 i18nルール
- ハードコードされた文字列: **絶対禁止**（`// i18n-ignore` コメントがある場合のみ例外）
- 翻訳キー命名: `{namespace}.{component}.{key}` 形式
- RTL対応: アラビア語選択時、`dir="rtl"` をHTML要素に自動適用
- 通貨表示: `Intl.NumberFormat`を使用し、ロケールに応じた表示
- 日付形式: `Intl.DateTimeFormat`を使用

### 5.3 翻訳ワークフロー
- ソース言語: 日本語（`ja`）
- 翻訳管理: Localizeもしくは手動JSON管理（`/messages/`ディレクトリ）
- 未翻訳キー: 開発時は`[MISSING: key]`を表示、本番では日本語フォールバック

---

## 第6章 収益化憲法

### 6.1 アップセル倫理規則
- アップセルポップアップは**制限到達時のみ**表示（ランダム表示禁止）
- 無料プランの機能を意図的に劣化させることは禁止
- ダークパターン（解約困難化等）は絶対禁止
- キャンセルは2クリック以内で完了できること

### 6.2 AIクレジット計算規則
```
音声入力1回    = 1クレジット
自動分類1回    = 1クレジット  
振り返り報告   = 5クレジット
Enterpriseカスタムモデル = カスタム
```

---

## 第7章 アクセシビリティ憲法

- WCAG 2.1 AA 準拠必須
- キーボードナビゲーション: 全機能でサポート
- スクリーンリーダー: NVDA/VoiceOver対応
- 音声入力代替: 全音声機能にテキスト入力代替を提供
- カラーコントラスト比: 4.5:1以上

---

## Design Specification
# Vora 設計仕様書 (Design Specification)

> バージョン: 1.0.0 | 対応プラットフォーム: Web (Next.js 15)

---

## 第1章 システムアーキテクチャ概要

### 1.1 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                              │
│  (Web/Mobile Apps)                                          │
│  Next.js 15 (App Router), React 19, Expo (Mobile)           │
│  Tailwind CSS v4, shadcn/ui (Web), React Native (Mobile)    │
└─────────────────────────────────────────────────────────────┘
       │ ▲                                 ▲
       │ │ (GraphQL/REST API Calls)        │ (Realtime Subscriptions)
       ▼ ▽                                 │
┌─────────────────────────────────────────────────────────────┐
│                        API GATEWAY                          │
│  (Next.js API Routes / Edge Functions)                      │
│  Rate Limiting (Upstash Redis)                              │
└─────────────────────────────────────────────────────────────┘
       │ ▲                                 ▲
       │ │ (Auth, Data Access)             │ (Realtime Events)
       ▼ ▽                                 │
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                             │
│  PostgreSQL 16 (DB), Supabase Auth (JWT, OAuth, Magic Link) │
│  Supabase Realtime (WebSockets), Storage (for temporary files) │
│  Row Level Security (RLS)                                   │
└─────────────────────────────────────────────────────────────┘
       │ ▲                                 ▲
       │ │ (AI Processing Request)         │ (AI Results)
       ▼ ▽                                 │
┌─────────────────────────────────────────────────────────────┐
│                        AI SERVICES                          │
│  OpenAI GPT-4o (Text Generation, Classification)            │
│  OpenAI Whisper v3 (Speech-to-Text)                         │
│  Pinecone (Vector DB for context/embeddings)                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 データモデル (Drizzle ORM Schema)

#### 1.2.1 `users` テーブル
- `id`: UUID (PK, Supabase Auth `auth.users.id` と同期)
- `email`: TEXT (Unique, Supabase Auth `email` と同期)
- `full_name`: TEXT (Optional)
- `avatar_url`: TEXT (Optional)
- `created_at`: TIMESTAMP (Default: `now()`)

#### 1.2.2 `kanban_boards` テーブル
- `id`: UUID (PK, Default: `gen_random_uuid()`)
- `user_id`: UUID (FK to `users.id`, RLS適用)
- `name`: TEXT (Not Null)
- `description`: TEXT (Optional)
- `created_at`: TIMESTAMP (Default: `now()`)
- `card_count`: INTEGER (Default: 0, Realtimeで更新)

#### 1.2.3 `kanban_cards` テーブル
- `id`: UUID (PK, Default: `gen_random_uuid()`)
- `board_id`: UUID (FK to `kanban_boards.id`, Not Null, RLS適用)
- `title`: TEXT (Not Null)
- `description`: TEXT (Optional)
- `status`: ENUM ('todo', 'in-progress', 'done') (Default: 'todo')
- `priority`: ENUM ('low', 'medium', 'high') (Optional)
- `due_date`: DATE (Optional)
- `created_at`: TIMESTAMP (Default: `now()`)

#### 1.2.4 `audit_logs` テーブル (AI処理記録用)
- `id`: UUID (PK, Default: `gen_random_uuid()`)
- `user_id`: UUID (FK to `users.id`, Not Null)
- `event_type`: TEXT ('audio_processed', 'card_classified', 'summary_generated')
- `payload`: JSONB (AI入力・出力の匿名化されたデータ)
- `timestamp`: TIMESTAMP (Default: `now()`)

### 1.3 Edge Functions (Vercel/Supabase)

#### 1.3.1 `process-audio` (音声処理)
- **エンドポイント**: `/functions/v1/process-audio`
- **メソッド**: `POST`
- **入力**: `audio` (Blob/File), `boardId` (Optional, for context)
- **処理**:
    1. 認証 (JWT検証)
    2. `audio` を OpenAI Whisper API に転送 (ストリーミング)
    3. Whisper からテキストを取得
    4. テキストと `boardId` を OpenAI GPT-4o に転送 (カード分類、要約)
    5. GPT-4o から `KanbanCardSuggestion` を取得 (タイトル、説明、プロジェクト、優先度、期日)
    6. `audit_logs` に処理を記録 (匿名化されたデータ)
    7. `KanbanCardSuggestion` と AIの自信度 (`confidence`) をクライアントに返却
- **セキュリティ**: 音声データはサーバーに保存せず、処理後即時廃棄。

#### 1.3.2 `create-kanban-card` (AI提案に基づくカード作成)
- **エンドポイント**: `/functions/v1/create-kanban-card`
- **メソッド**: `POST`
- **入力**: `suggestion` (KanbanCardSuggestion), `boardId`
- **処理**:
    1. 認証 (JWT検証)
    2. `suggestion` を元に `kanban_cards` テーブルに新規レコード挿入
    3. `kanban_boards` の `card_count` をインクリメント
    4. 成功したカードデータを返却

### 1.4 クライアントサイド状態管理 (Zustand)

#### 1.4.1 `authStore`
- `session`: `Session | null` (Supabase Authセッション)
- `setSession`: `(session: Session | null) => void`

#### 1.4.2 `kanbanStore`
- `boards`: `KanbanBoard[]` (ユーザーの全カンバンボード)
- `cards`: `Record<string, KanbanCard[]>` (ボードIDごとのカードリスト)
- `addBoard`: `(board: KanbanBoard) => void`
- `updateBoard`: `(board: KanbanBoard) => void`
- `deleteBoard`: `(boardId: string) => void`
- `addCard`: `(boardId: string, card: KanbanCard) => void`
- `updateCard`: `(boardId: string, card: KanbanCard) => void`
- `deleteCard`: `(boardId: string, cardId: string) => void`

### 1.5 クライアントサイドデータフェッチ (TanStack Query)

- `useQuery(['kanbanBoards', userId], fetchKanbanBoards)`
- `useQuery(['kanbanCards', boardId], () => fetchKanbanCards(boardId))`
- `useMutation(createKanbanCard)`
- `useMutation(updateKanbanCard)`
- `useMutation(deleteKanbanCard)`

---

## 第2章 UI/UXデザイン

### 2.1 全体デザインシステム

- **テーマ**: Minimalist, Productivity-focused
- **カラーパレット**:
    - Primary: #007bff (Blue)
    - Accent: #28a745 (Green)
    - Warning: #ffc107 (Yellow)
    - Danger: #dc3545 (Red)
    - Text: #333, #666, #999
    - Background: #f8f8f8, #fff
- **タイポグラフィ**: Sans-serif (システムフォント優先, 例: SF Pro, Roboto)
- **コンポーネントライブラリ**: shadcn/ui (Web), カスタムReact Nativeコンポーネント (Mobile)

### 2.2 主要画面フロー

#### 2.2.1 認証フロー
- **サインアップ**: メールアドレス、パスワード → 確認メール → ログイン
- **サインイン**: メールアドレス、パスワード → ログイン
- **パスワードリセット**: メールアドレス → リセットメール

#### 2.2.2 ホーム画面 (`/`)
- ユーザーのカンバンボード一覧を表示
- 各ボードはカード形式で表示 (`KanbanBoardListItem`)
- ボード作成ボタン
- 設定/プロフィールへのナビゲーション

#### 2.2.3 カンバンボード詳細画面 (`/kanban/[boardId]`)
- 選択されたボードのカード一覧を「Todo」「In Progress」「Done」の列で表示
- カードはドラッグ＆ドロップで移動可能 (将来的に実装)
- 音声入力ボタン (`VoiceInputButton`)
- テキスト入力代替 (`TextInputAlternative`)
- AI提案モーダル (`AiSuggestionModal`)

#### 2.2.4 設定画面 (`/settings`)
- ユーザープロフィール表示 (`UserProfile`)
- 言語切り替え (`LanguageSwitcher`)
- アカウント管理 (パスワード変更、ログアウト、アカウント削除)
- 課金情報 (Stripe連携)

### 2.3 コンポーネント仕様

#### 2.3.1 `VoiceInputButton`
- **機能**: 音声録音の開始/停止、録音中の視覚的フィードバック、AI処理のトリガー
- **状態**: `idle`, `recording`, `processing`
- **UI**:
    - 大きな円形ボタン
    - `idle`: 青色、マイクアイコン、"録音開始" テキスト
    - `recording`: 赤色、停止アイコン、"録音停止" テキスト、録音時間表示
    - `processing`: 青色、ローディングスピナー、"AI処理中..." テキスト
- **アクセシビリティ**:
    - `accessibilityLabel` と `accessibilityHint` を設定
    - 録音状態に応じてボタンのテキストと役割を更新

#### 2.3.2 `AiSuggestionModal`
- **機能**: AIが生成したカードの提案を表示、ユーザーが内容を編集・確認・キャンセル
- **UI**:
    - モーダル形式で表示
    - 提案されたカードのタイトル、説明、プロジェクト、優先度、期日を編集可能なテキスト入力フィールドで表示
    - 「確認」ボタンと「キャンセル」ボタン
    - AIの自信度が低い場合は警告メッセージを表示
- **アクセシビリティ**:
    - モーダルが開いた際にフォーカスを適切に管理
    - 各入力フィールドにラベルとアクセシビリティ情報を付与

#### 2.3.3 `TextInputAlternative`
- **機能**: 音声入力が困難な場合や、テキストで直接入力したい場合の代替手段
- **UI**:
    - マルチライン対応のテキスト入力フィールド
    - 「カードを作成」ボタン
- **アクセシビリティ**:
    - `accessibilityLabel` と `accessibilityHint` を設定
    - キーボードナビゲーションをサポート

#### 2.3.4 `KanbanBoardListItem`
- **機能**: ホーム画面で各カンバンボードの概要を表示し、詳細画面へのナビゲーションを提供
- **UI**:
    - カード形式の表示
    - ボード名、説明、作成日、カード数を表示
- **アクセシビリティ**:
    - `Link` コンポーネントを使用し、ナビゲーション可能であることを明示

#### 2.3.5 `UserProfile`
- **機能**: ユーザーのプロフィール情報（アバター、名前、メールアドレス、ユーザーID）を表示
- **UI**:
    - アバター画像（またはプレースホルダー）
    - 表示名、メールアドレス、ユーザーID
- **アクセシビリティ**:
    - 画像に `alt` テキスト相当の `accessibilityLabel` を設定

#### 2.3.6 `LanguageSwitcher`
- **機能**: アプリケーションの表示言語を切り替える
- **UI**:
    - 対応言語のリストをボタン形式で表示
    - 現在選択されている言語をハイライト
- **アクセシビリティ**:
    - 各言語ボタンに `accessibilityLabel` を設定
    - 言語変更時のフィードバックを提供

#### 2.3.7 `Button` (UIコンポーネント)
- **機能**: 再利用可能なボタンコンポーネント
- **UI**:
    - `primary`, `secondary`, `destructive`, `ghost` のバリアント
    - `default`, `sm`, `lg`, `icon` のサイズ
    - ローディング状態表示
- **アクセシビリティ**:
    - `accessibilityRole="button"` を設定
    - `accessibilityLabel`, `accessibilityHint` をサポート
    - `disabled` 状態を適切に反映

#### 2.3.8 `Input` (UIコンポーネント)
- **機能**: 再利用可能なテキスト入力フィールド
- **UI**:
    - `label`, `error` メッセージ表示
    - プレースホルダー
- **アクセシビリティ**:
    - `accessibilityLabel` をサポート
    - `error` 状態を視覚的に表示し、スクリーンリーダーにも通知

## Development Instructions
N/A

## Technical Stack
- Next.js 15 + React 19 + TypeScript (strict mode)
- TailwindCSS 4
- Vitest for unit tests
- Playwright for E2E tests

## Code Standards
- TypeScript strict mode, no `any`
- Minimal comments — code should be self-documenting
- Use path alias `@/` for imports from `src/`
- All components use functional style with proper typing

## Internationalization (i18n)
- Supported languages: ja (日本語), en (English), zh (中文), ko (한국어), es (Español), fr (Français), de (Deutsch), pt (Português), ar (العربية), hi (हिन्दी)
- Use the i18n module at `@/i18n` for all user-facing strings
- Use `t("key")` function for translations — never hardcode UI strings
- Auto-detect device language via expo-localization
- Default language: ja (Japanese)
- RTL support required for Arabic (ar)
- Use isRTL flag from i18n module for layout adjustments

