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
│                        CLIENTS
│ (Web/Mobile)                                                │
│                                                             │
│ ┌───────────────────┐     ┌───────────────────────────┐     │
│ │  Next.js/Expo     │     │  Supabase Client SDK      │     │
│ │  (React 19)       │     │  (Auth, Realtime, Storage)│     │
│ └─────────┬─────────┘     └───────────┬───────────────┘     │
│           │                             │                     │
│           │ HTTP/WS                     │                     │
│           ▼                             ▼                     │
│ ┌─────────────────────────────────────────────────────────────┐
│ │                     Vercel Edge Network                     │
│ └───────────────────┬───────────┬───────────┬────────────────┘
│                     │           │           │
│                     │ API Routes│ Edge Fns  │
│                     ▼           ▼           ▼
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ │  Next.js API      │ │  Supabase Edge    │ │  OpenAI API       │
│ │  (Auth, Proxy)    │ │  Functions        │ │  (GPT-4o, Whisper)│
│ └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
│           │                     │                     │
│           │                     │                     │
│           ▼                     ▼                     ▼
│ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│ │  Supabase         │ │  Supabase         │ │  Pinecone         │
│ │  (Auth, DB, RLS)  │ │  (Realtime, Storage)│ │  (Vector DB)      │
│ └───────────────────┘ └───────────────────┘ └───────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 データフロー (音声入力からカード生成まで)

1.  **ユーザー音声入力**:
    *   クライアント (Next.js/Expo) のマイクから音声を録音。
    *   `expo-av` を使用し、`.webm` 形式で一時ファイルとして保存。
    *   録音データはクライアント側でBase64エンコードされる。

2.  **Edge Functionへの送信**:
    *   エンコードされた音声データは、認証情報 (Supabase JWT) と共にSupabase Edge Function (`/functions/v1/process-audio`) へ `multipart/form-data` で送信。
    *   **Privacy by Design**: 音声データはサーバーに永続保存されない。Edge Functionで処理後、即時破棄。

3.  **Whisper APIによる文字起こし**:
    *   Edge Functionは受信した音声データを直接OpenAI Whisper API (v3) へストリーミング転送。
    *   Whisper APIは音声をテキストに変換し、Edge Functionへ返却。

4.  **GPT-4oによるカード情報抽出・分類**:
    *   Edge FunctionはWhisperから得られたテキストをOpenAI GPT-4o APIへ送信。
    *   GPT-4oはテキストから以下の情報を抽出し、JSON形式で構造化:
        *   `cardText`: カンバンカードのタイトル/主要テキスト
        *   `project`: 関連するプロジェクト名 (任意)
        *   `priority`: 優先度 (high, medium, low) (任意)
        *   `dueDate`: 期限 (任意、ISO 8601形式)
    *   **AI Confidence First**: GPT-4oは抽出した情報の「自信度」も返却。自信度が低い場合、`suggestion`は`null`または`confidence`が低い値となる。

5.  **クライアントへの返却**:
    *   Edge FunctionはGPT-4oからの構造化データ (`KanbanCardSuggestion`) と自信度をクライアントへ返却。

6.  **クライアントでの確認・作成**:
    *   クライアントは受信した `KanbanCardSuggestion` を `AiSuggestionModal` でユーザーに表示。
    *   ユーザーは提案された内容を確認・編集。
    *   ユーザーが「確定」した場合、`createKanbanCard` API (Supabase) を呼び出し、カードをDBに保存。
    *   **Zero Friction**: AIの自信度が高い場合は、自動的にカードが作成され、ユーザー確認ステップをスキップすることも可能 (今後の実装)。

### 1.3 リアルタイム同期とオフライン対応 (Local First Sync)

#### リアルタイム同期 (Supabase Realtime)
- **目的**: 複数のデバイス間、またはチームメンバー間でのカンバンボード/カードのリアルタイム同期。
- **実装**:
    - `src/hooks/useRealtimeKanban.ts` フックを作成。
    - `supabase.channel().on('postgres_changes', ...).subscribe()` を使用し、`kanban_boards` および `kanban_cards` テーブルの変更をリッスン。
    - 認証されたユーザーの `user_id` に基づいて `kanban_boards` をフィルタリング。
    - `boardId` が提供された場合、そのボードの `kanban_cards` を `board_id` に基づいてフィルタリング。
    - 変更イベント (INSERT, UPDATE, DELETE) に応じて、Zustandストア (`useKanbanStore`) を更新。
    - TanStack Query の `queryClient.invalidateQueries` を使用し、関連するクエリキャッシュを無効化し、最新データをフェッチさせる。

#### オフライン対応 (Local First Sync)
- **目的**: ネットワーク接続がない状態でもユーザーがカードの作成・編集・削除を行えるようにし、接続回復後に自動的に同期。
- **実装**:
    - `src/stores/kanbanStore.ts` にオフライン変更を保存する `offlineChanges` ステートを追加。
        - `offlineChanges`: `{ [boardId: string]: { type: 'insert' | 'update' | 'delete', data: KanbanCard }[] }`
    - `src/lib/offlineManager.ts` ファイルを作成。
        - `addOfflineKanbanChange(boardId, type, data)`: ローカルで変更が発生した際に `offlineChanges` に追加する関数。
        - `syncOfflineChanges()`: ネットワーク接続が回復した際に `offlineChanges` を読み込み、Supabaseに書き込む関数。
            - 各変更タイプ (insert, update, delete) に応じて適切なSupabase操作を実行。
            - 成功した変更は `offlineChanges` から削除。
            - 失敗した変更は残し、次回の同期で再試行。
            - 同期後、TanStack Query の `queryClient.invalidateQueries` を使用し、関連するクエリキャッシュを無効化。
    - `useKanbanStore` は `zustand/middleware` の `persist` を使用し、`offlineChanges` を `AsyncStorage` に永続化。
    - アプリ起動時やネットワーク状態の変化時に `syncOfflineChanges` を呼び出すロジックを `_layout.tsx` またはメインコンポーネントに実装。

### 1.4 認証フロー

1.  **初期ロード**:
    *   `src/hooks/useAuth.ts` が `supabase.auth.getSession()` を呼び出し、既存のセッションを確認。
    *   セッションがあれば `useAuthStore` に保存し、ユーザーをメイン画面へリダイレクト。
    *   セッションがなければサインイン/サインアップ画面へ。

2.  **サインイン/サインアップ**:
    *   `supabase.auth.signInWithPassword()` または `signUp()` を使用。
    *   OAuth (Google, Apple) も `supabase.auth.signInWithOAuth()` でサポート。
    *   マジックリンクも `supabase.auth.signInWithOtp()` でサポート。

3.  **セッション管理**:
    *   `supabase.auth.onAuthStateChange` を `useAuth.ts` で購読し、認証状態の変化をリアルタイムで `useAuthStore` に反映。
    *   `AsyncStorage` を使用してセッションを永続化 (`src/lib/supabase.ts` で設定)。

### 1.5 UI/UX (Liquid Minimal)

-   **全体**: コンテンツが主役。余計な装飾やアニメーションは最小限に。
-   **音声入力ボタン**:
    *   常に画面下部中央に配置。
    *   録音中は色が変わる (例: 青 -> 赤)。
    *   処理中はローディングインジケーターを表示。
-   **AI提案モーダル (`AiSuggestionModal`)**:
    *   音声入力後、AIがカード情報を抽出した際に表示。
    *   抽出された `cardText`, `project`, `priority`, `dueDate` を編集可能なフォームで表示。
    *   ユーザーは内容を確認・修正し、「確定」または「キャンセル」を選択。
    *   AIの自信度が低い場合や `suggestion` が `null` の場合は、エラーメッセージを表示し、ユーザーに再試行を促す。
-   **カンバンボード一覧**:
    *   各ボードはカード形式で表示。
    *   ボード名、説明、作成日、カード数を表示。
    *   タップでボード詳細画面へ遷移。

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

---

## 変更履歴
- 2024-07-29: リアルタイム同期とオフライン対応の設計を追加。AI提案モーダルの詳細を追加。
- 2024-07-28: 初版作成。基本アーキテクチャ、データフロー、認証フロー、UI/UX原則を定義。
