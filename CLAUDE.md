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
│ (Web: Next.js 15, Mobile: Expo/React Native)
│
│ ┌───────────────────┐   ┌───────────────────┐
│ │  Web Frontend     │   │  Mobile App       │
│ │ (Next.js/React)   │   │ (Expo/RN)         │
│ └───────────────────┘   └───────────────────┘
│          │                      │
│          └───────────┬──────────┘
│                      │ HTTPS / WebSocket
│                      ▼
│ ┌─────────────────────────────────────────────────────────────┐
│ │                     Vercel Edge Network                     │
│ └─────────────────────────────────────────────────────────────┘
│                      │ API Gateway (Next.js API Routes / Edge Functions)
│                      ▼
│ ┌─────────────────────────────────────────────────────────────┐
│ │                     Backend Services                        │
│ ├─────────────────────────────────────────────────────────────┤
│ │ ┌───────────────┐   ┌───────────────┐   ┌───────────────┐ │
│ │ │  Auth Service   │   │  Core API     │   │  AI Service   │ │
│ │ │ (Supabase Auth) │   │ (Next.js API) │   │ (Edge Function) │ │
│ │ └───────────────┘   └───────────────┘   └───────────────┘ │
│ │        │                    │                    │          │
│ │        ▼                    ▼                    ▼          │
│ │ ┌─────────────────────────────────────────────────────────┐ │
│ │ │                       Data Layer                        │ │
│ │ ├─────────────────────────────────────────────────────────┤ │
│ │ │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ │ │
│ │ │ │  PostgreSQL   │ │  Vector DB    │ │  Redis (Cache)│ │ │
│ │ │ │ (Supabase DB) │ │  (Pinecone)   │ │  (Upstash)    │ │ │
│ │ │ └───────────────┘ └───────────────┘ └───────────────┘ │ │
│ │ └─────────────────────────────────────────────────────────┘ │
│ └─────────────────────────────────────────────────────────────┘
│
│ ┌─────────────────────────────────────────────────────────────┐
│ │                     External Integrations                   │
│ ├─────────────────────────────────────────────────────────────┤
│ │ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐     │
│ │ │  OpenAI API   │ │  Stripe       │ │  Localize     │     │
│ │ │ (GPT-4o/Whisper)│ │ (Payments)    │ │ (i18n)        │     │
│ │ └───────────────┘ └───────────────┘ └───────────────┘     │
│ └─────────────────────────────────────────────────────────────┘
```

### 1.2 技術スタック詳細

#### フロントエンド (Web)
- **フレームワーク**: Next.js 15 (App Router)
- **UIライブラリ**: React 19
- **スタイリング**: Tailwind CSS v4, shadcn/ui
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query v5
- **国際化**: next-i18n (Localize連携)
- **デプロイ**: Vercel

#### フロントエンド (Mobile)
- **フレームワーク**: Expo (React Native)
- **UIライブラリ**: React Native
- **スタイリング**: StyleSheet (Tailwind CSS for React Native via NativeWind is an option for future, but start with StyleSheet)
- **状態管理**: Zustand
- **データフェッチ**: TanStack Query v5
- **国際化**: `expo-localization` + カスタムi18nモジュール
- **デプロイ**: Expo EAS

#### バックエンド
- **プラットフォーム**: Next.js API Routes / Edge Functions (Vercel)
- **認証**: Supabase Auth (OAuth2, Magic Link, Email/Password)
- **データベース**: PostgreSQL 16 (Supabase)
- **ORM**: Drizzle ORM
- **リアルタイム**: Supabase Realtime
- **AI**: OpenAI API (GPT-4o for processing, Whisper v3 for speech-to-text)
- **Vector DB**: Pinecone
- **キャッシュ/レート制限**: Upstash Redis
- **決済**: Stripe (Billing, Usage-based metering)

---

## 第2章 主要機能設計

### 2.1 認証フロー (Supabase Auth)

#### 2.1.1 認証方式
- **必須**: メールアドレス/パスワード認証
- **必須**: マジックリンク認証
- **必須**: OAuth2 (Google, Apple)

#### 2.1.2 フロー詳細
1. **サインアップ**:
    - ユーザーはメールアドレスとパスワードを入力。
    - Supabase Authでユーザーを作成。
    - 成功後、メール確認リンクを送信（設定による）。
    - ユーザーはサインインページへリダイレクト。
2. **サインイン (メール/パスワード)**:
    - ユーザーはメールアドレスとパスワードを入力。
    - Supabase Authで認証。
    - 成功後、ホームダッシュボードへリダイレクト。
3. **サインイン (マジックリンク)**:
    - ユーザーはメールアドレスを入力。
    - Supabase Authがマジックリンクをメールで送信。
    - ユーザーはメール内のリンクをクリックし、アプリへリダイレクトされ認証完了。
4. **サインイン (OAuth2)**:
    - ユーザーはGoogleまたはAppleボタンをクリック。
    - Supabase AuthがOAuthプロバイダーへリダイレクト。
    - 認証成功後、アプリへリダイレクトされ認証完了。

#### 2.1.3 セキュリティ
- すべての認証エンドポイントはHTTPS経由。
- JWTトークンはSupabaseによって管理され、セキュアな方法でクライアントに保存。
- RLS (Row Level Security) をSupabaseで設定し、ユーザーデータへのアクセスを制限。

### 2.2 音声入力とカード生成

#### 2.2.1 フロー概要
1. **音声録音**:
    - ユーザーはアプリ内でマイクボタンをタップし、音声を録音。
    - 録音はリアルタイムでクライアント側で処理されるか、短いチャンクに分割される。
2. **音声→テキスト変換 (Whisper)**:
    - 録音された音声データは、クライアントから直接Vercel Edge Functionへ送信。
    - Edge Functionは、OpenAI Whisper APIを呼び出し、音声をテキストに変換。
    - **重要**: 音声データはEdge Functionで処理後、即座に破棄され、永続的に保存されない（Privacy by Design）。
3. **テキスト→カード生成 (GPT-4o)**:
    - Whisperから返されたテキストは、別のEdge FunctionまたはCore APIへ送信。
    - このAPIはOpenAI GPT-4oを呼び出し、テキストからカンバンカードのタイトル、説明、カテゴリ、優先度などを抽出・生成。
    - AIが自信を持てない場合（例: 複数の解釈が可能）、ユーザーに確認を促すUIを表示。
4. **カード保存**:
    - 生成されたカードデータは、Drizzle ORMを介してSupabase PostgreSQLデータベースに保存。
    - リアルタイムでUIに反映されるよう、Supabase Realtimeを使用。

#### 2.2.2 エラーハンドリング
- 音声認識失敗時: ユーザーに再試行を促すメッセージを表示。
- カード生成失敗時: エラーメッセージを表示し、手動入力オプションを提供。

### 2.3 カンバンボード表示

#### 2.3.1 UI要素
- **ボード**: 複数のリスト（例: ToDo, Doing, Done）を含む。
- **リスト**: 関連するカードのグループ。ドラッグ＆ドロップで並べ替え可能。
- **カード**: タスクを表す最小単位。タイトル、説明、担当者、期限、タグなどを含む。
- **フィルター/ソート**: 担当者、期限、タグ、優先度などでカードをフィルタリング・ソート。

#### 2.3.2 リアルタイム同期
- Supabase Realtime (WebSocket) を使用し、複数のデバイスやユーザー間でのボードの変更をリアルタイムで同期。
- オフライン時はIndexedDBなどに一時保存し、オンライン復帰後に同期（Local First Sync）。

### 2.4 振り返り機能 (AI生成)

#### 2.4.1 フロー概要
1. **期間選択**:
    - ユーザーは振り返りの対象期間（例: 過去1週間、今月）を選択。
2. **AI分析**:
    - 選択された期間のカードデータがCore APIに送信される。
    - Core APIはGPT-4oを呼び出し、以下の分析を行う:
        - 完了したタスクの要約と成果
        - 未完了タスクの傾向と課題
        - 優先度付けの評価
        - 次のアクション提案
3. **レポート表示**:
    - AIが生成した振り返りレポートをユーザーに表示。
    - レポートは編集可能で、ユーザーはコメントを追加できる。
4. **クレジット消費**:
    - 振り返りレポート生成ごとにAIクレジットを消費。

---

## 第3章 データモデル (Drizzle ORM)

### 3.1 `users` テーブル (Supabase Auth連携)
- `id` (UUID, PK, auth.uid()から自動挿入)
- `email` (TEXT, UNIQUE)
- `display_name` (TEXT, NULLABLE)
- `avatar_url` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPZ, DEFAULT NOW())

### 3.2 `workspaces` テーブル
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `name` (TEXT, NOT NULL)
- `owner_id` (UUID, FK to `users.id`, NOT NULL)
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPZ, DEFAULT NOW())
- RLS: `auth.uid() = owner_id` または `id` が `user_workspace` に存在

### 3.3 `user_workspaces` テーブル (多対多結合)
- `user_id` (UUID, FK to `users.id`, PK)
- `workspace_id` (UUID, FK to `workspaces.id`, PK)
- `role` (TEXT, ENUM: 'owner', 'admin', 'member', DEFAULT 'member')
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- RLS: `auth.uid() = user_id`

### 3.4 `boards` テーブル
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `workspace_id` (UUID, FK to `workspaces.id`, NOT NULL)
- `name` (TEXT, NOT NULL)
- `description` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPZ, DEFAULT NOW())
- RLS: `workspace_id` が `user_workspaces` に存在

### 3.5 `lists` テーブル (カンバンリスト)
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `board_id` (UUID, FK to `boards.id`, NOT NULL)
- `name` (TEXT, NOT NULL)
- `order` (INT, NOT NULL) -- リストの表示順
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPZ, DEFAULT NOW())
- RLS: `board_id` が `boards` に存在

### 3.6 `kanban_cards` テーブル
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `list_id` (UUID, FK to `lists.id`, NOT NULL)
- `title` (TEXT, NOT NULL)
- `description` (TEXT, NULLABLE)
- `priority` (TEXT, ENUM: 'low', 'medium', 'high', NULLABLE)
- `due_date` (DATE, NULLABLE)
- `assigned_to` (UUID, FK to `users.id`, NULLABLE)
- `tags` (TEXT[], NULLABLE)
- `order` (INT, NOT NULL) -- カードの表示順
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- `updated_at` (TIMESTAMPZ, DEFAULT NOW())
- RLS: `list_id` が `lists` に存在

### 3.7 `audit_logs` テーブル (AI処理記録)
- `id` (UUID, PK, DEFAULT gen_random_uuid())
- `user_id` (UUID, FK to `users.id`, NOT NULL)
- `event_type` (TEXT, ENUM: 'speech_to_text', 'card_generation', 'retrospection_report')
- `input_data` (JSONB, NULLABLE) -- 処理されたテキストなど（機密情報を含まない）
- `output_data` (JSONB, NULLABLE) -- AIの出力結果の要約（機密情報を含まない）
- `cost_credits` (INT, NOT NULL, DEFAULT 0)
- `created_at` (TIMESTAMPZ, DEFAULT NOW())
- RLS: `auth.uid() = user_id`

---

## 第4章 国際化 (i18n)

### 4.1 対応言語
- `ja` (日本語 - ベース言語)
- `en` (英語)
- `zh` (中国語 - 簡体字)
- `ko` (韓国語)
- `es` (スペイン語)
- `fr` (フランス語)
- `de` (ドイツ語)
- `pt` (ポルトガル語 - ブラジル)
- `ar` (アラビア語 - RTLサポート必須)
- `hi` (ヒンディー語)

### 4.2 実装詳細
- **Web**: `next-i18n` と Localize 連携。
- **Mobile**: `expo-localization` を使用してデバイスの言語を検出し、カスタムi18nモジュール (`@/i18n`) で翻訳を管理。
- すべてのユーザー向け文字列は翻訳キーを使用し、ハードコードは禁止。
- RTL (Right-to-Left) 言語 (アラビア語 `ar`) の場合、UIの方向を自動的に調整。

---

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


