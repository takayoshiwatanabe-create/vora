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
│  Mobile (Expo) <────> Web (Next.js) <────> Desktop (Tauri)  │
└─────────────────────────────────────────────────────────────┘
       │                                       ▲
       │ REST/GraphQL                          │ Realtime (WebSocket)
       ▼                                       │
┌─────────────────────────────────────────────────────────────┐
│                        API GATEWAY (Next.js API Routes / Edge Functions) │
│  (Authentication, Rate Limiting, Input Validation, Caching) │
└─────────────────────────────────────────────────────────────┘
       │                                       ▲
       │                                       │
       ▼                                       │
┌─────────────────────────────────────────────────────────────┐
│                        SUPABASE                              │
│  (Auth, PostgreSQL, Realtime, Storage, Edge Functions)      │
└─────────────────────────────────────────────────────────────┘
       │                                       ▲
       │                                       │
       ▼                                       │
┌─────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                     │
│  (OpenAI, Pinecone, Stripe, Vercel, Datadog)                │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 技術スタック (再掲)
- **フロントエンド**: Next.js 15 (App Router) + React 19 (Web), Expo (Mobile)
- **スタイリング**: Tailwind CSS v4 + shadcn/ui (Web), React Native StyleSheet (Mobile)
- **言語**: TypeScript 5.x (strict mode 必須)
- **デプロイ**: Vercel (Edge Runtime 優先)
- **状態管理**: Zustand + TanStack Query v5
- **DB**: PostgreSQL 16 (Supabase)
- **ORM**: Drizzle ORM
- **認証**: Supabase Auth (OAuth2 + Magic Link)
- **AI**: OpenAI GPT-4o + Whisper v3
- **Vector DB**: Pinecone
- **リアルタイム**: Supabase Realtime (WebSocket)
- **決済**: Stripe (Billing + Usage-based)

### 1.3 開発環境
- Node.js v20.x
- pnpm v8.x
- Docker Desktop (ローカルDB, Supabase Studio)

---

## 第2章 フロントエンド (Web/Mobile)

### 2.1 プロジェクト構造
```
/
├── app/                  # Next.js App Router (Web) / Expo Router (Mobile)
│   ├── (auth)/           # Authentication routes (sign-in, sign-up, etc.)
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (main)/           # Main application routes (dashboard, kanban, settings)
│   │   ├── _layout.tsx
│   │   ├── index.tsx     # Dashboard / Home screen
│   │   ├── kanban/
│   │   │   ├── [boardId].tsx
│   │   │   └── index.tsx # Kanban board list
│   │   └── settings/
│   │       └── index.tsx
│   └── _layout.tsx       # Root layout
├── src/
│   ├── api/              # API client functions (e.g., Supabase interactions)
│   ├── assets/           # Static assets (images, fonts)
│   ├── components/       # Reusable UI components
│   │   ├── ui/           # Shadcn/ui components (Web) / Basic UI (Mobile)
│   │   ├── auth-form.tsx # (Example: shared auth form elements)
│   │   └── ...
│   ├── hooks/            # Custom React hooks (e.g., useAuth, useKanban)
│   ├── lib/              # Utility functions, Supabase client, Drizzle schema
│   │   ├── supabase.ts
│   │   └── ...
│   ├── stores/           # Zustand stores
│   │   └── authStore.ts
│   ├── styles/           # Global styles, Tailwind config (Web)
│   └── i18n/             # Internationalization files
│       ├── index.ts
│       └── translations.ts
├── public/               # Static assets for Next.js (Web)
├── locales/              # JSON translation files for Expo (Mobile)
├── types/                # Global TypeScript types
├── .env.local            # Environment variables (Web)
├── app.json              # Expo configuration (Mobile)
├── package.json
├── tsconfig.json
└── tailwind.config.ts    # Tailwind CSS configuration (Web)
```

### 2.2 認証フロー
1. **初期ロード**: `app/_layout.tsx` でSupabaseセッションをチェック。
2. **未認証**: `/(auth)/sign-in` にリダイレクト。
3. **認証済み**: `/` (ダッシュボード) にリダイレクト。
4. **サインイン/サインアップ**: `supabase.auth` を使用。成功後、Zustandストアを更新し、`/` にリダイレクト。
5. **サインアウト**: `supabase.auth.signOut()` を呼び出し、Zustandストアをクリアし、`/(auth)/sign-in` にリダイレクト。
6. **Magic Link**: メールで認証。リダイレクトURLは `vora://auth/callback` (Expo) または `[YOUR_APP_URL]/auth/callback` (Web)。

### 2.3 国際化 (i18n)
- **対応言語**: ja, en, zh, ko, es, fr, de, pt, ar, hi (憲法第5章参照)
- **実装**: `src/i18n/` ディレクトリに集約。
  - `index.ts`: 言語検出、RTL判定、`t()` 関数を提供。
  - `translations.ts`: 各言語の翻訳キーと文字列を定義。
- **使用方法**: すべてのUI文字列は `t("translation.key")` を通して翻訳される。
- **RTLサポート**: `isRTL` フラグに基づき、`I18nManager.forceRTL(true)` を適用し、UI要素の `textAlign` や `flexDirection` を調整。

### 2.4 スタイリング
- **Web**: Tailwind CSS v4 + shadcn/ui
- **Mobile**: React Native StyleSheet (Tailwind CSS for React Native (NativeWind) は将来的に検討)
- **原則**: Liquid Minimal (憲法第1.3項) に従い、シンプルでコンテンツを邪魔しないUIを志向。

### 2.5 状態管理
- **グローバル状態**: Zustand (例: 認証セッション `authStore.ts`)
- **サーバー状態**: TanStack Query v5 (データフェッチ、キャッシュ、同期)

---

## 第3章 バックエンド (Supabase / Edge Functions)

### 3.1 Supabaseスキーマ設計 (例)
```sql
-- profiles テーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- kanban_boards テーブル
CREATE TABLE kanban_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE kanban_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own boards." ON kanban_boards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create boards." ON kanban_boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own boards." ON kanban_boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own boards." ON kanban_boards FOR DELETE USING (auth.uid() = user_id);

-- kanban_columns テーブル
CREATE TABLE kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES kanban_boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- RLS用
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own columns." ON kanban_columns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create columns." ON kanban_columns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own columns." ON kanban_columns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own columns." ON kanban_columns FOR DELETE USING (auth.uid() = user_id);

-- kanban_cards テーブル
CREATE TABLE kanban_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID REFERENCES kanban_columns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- RLS用
  title TEXT NOT NULL,
  description TEXT,
  order_index INT NOT NULL,
  ai_confidence_score REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date DATE,
  tags TEXT[]
);
ALTER TABLE kanban_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own cards." ON kanban_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create cards." ON kanban_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own cards." ON kanban_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own cards." ON kanban_cards FOR DELETE USING (auth.uid() = user_id);
```

### 3.2 Edge Functions (例: 音声処理)
- **目的**: Whisper APIへの音声データ転送とテキスト変換。
- **制約**: 音声データは永続保存せず、処理後即時破棄 (憲法第3.1項)。
- **技術**: Deno Runtime (Supabase Edge Functions)。

---

## 第4章 AI統合

### 4.1 音声認識 (Whisper)
- **フロー**: クライアント (音声録音) → Edge Function (Whisper API) → テキスト返却。
- **目的**: 音声コマンド、カード内容のテキスト化。

### 4.2 自然言語処理 (GPT-4o)
- **目的**:
  - テキストからカンバンカードのタイトル、説明、期限、タグを抽出。
  - カードの自動分類 (どのボード、どのカラムに配置するか)。
  - 振り返りレポート生成。
- **AI Confidence First**: 不確かな場合はユーザーに確認を促すUIを実装。

---

## 第5章 決済 (Stripe)

### 5.1 モデル
- **Free**: 基本機能、限定クレジット。
- **Pro**: 全機能、月間クレジット。
- **Team**: Pro + チーム管理、共有ボード。
- **Enterprise**: カスタムモデル、SLA、専用サポート。

### 5.2 課金ロジック
- **Usage-based**: AIクレジット消費量に応じた課金 (憲法第6.2項)。
- **Stripe Billing**: サブスクリプション管理。

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

---

## Kanban Board UI and Data Display (1)

### 1. Overview
This section details the initial implementation of the Kanban board UI for mobile (Expo). It focuses on displaying a list of Kanban boards and their basic properties.

### 2. Components & Files
- `app/(main)/kanban/index.tsx`: Displays a list of Kanban boards.
- `src/components/kanban-board-list-item.tsx`: Reusable component for displaying a single Kanban board in the list.
- `src/hooks/useKanbanBoards.ts`: Custom hook for fetching Kanban board data.
- `src/api/kanban.ts`: Supabase client functions for Kanban board operations.
- `src/types/kanban.ts`: TypeScript types for Kanban boards, columns, and cards.

### 3. `src/types/kanban.ts`
```typescript
// src/types/kanban.ts
export interface KanbanBoard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  user_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

export interface KanbanCard {
  id: string;
  column_id: string;
  user_id: string;
  title: string;
  description: string | null;
  order_index: number;
  ai_confidence_score: number | null;
  created_at: string;
  due_date: string | null; // ISO 8601 date string
  tags: string[] | null;
}
```

### 4. `src/api/kanban.ts`
```typescript
// src/api/kanban.ts
import { supabase } from "@/lib/supabase";
import { KanbanBoard } from "@/types/kanban";

/**
 * Fetches all Kanban boards for the currently authenticated user.
 * @returns A promise that resolves to an array of KanbanBoard objects or an error.
 */
export async function fetchKanbanBoards(): Promise<{ data: KanbanBoard[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select("id, user_id, title, description, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching Kanban boards:", error.message);
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

// Other CRUD operations for boards, columns, cards will be added here later.
```

### 5. `src/hooks/useKanbanBoards.ts`
```typescript
// src/hooks/useKanbanBoards.ts
import { useState, useEffect } from "react";
import { fetchKanbanBoards } from "@/api/kanban";
import { KanbanBoard } from "@/types/kanban";
import { useAuthStore } from "@/stores/authStore"; // To react to auth changes

/**
 * Custom hook to fetch and manage Kanban boards for the authenticated user.
 * @returns {{ boards: KanbanBoard[] | null, loading: boolean, error: Error | null, refetch: () => void }}
 */
export function useKanbanBoards() {
  const [boards, setBoards] = useState<KanbanBoard[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const session = useAuthStore((state) => state.session); // Get session from Zustand

  const getBoards = async () => {
    if (!session) {
      setBoards(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchKanbanBoards();

    if (fetchError) {
      setError(fetchError);
      setBoards(null);
    } else {
      setBoards(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    getBoards();
  }, [session]); // Re-fetch when session changes (e.g., user signs in/out)

  return { boards, loading, error, refetch: getBoards };
}
```

### 6. `src/components/kanban-board-list-item.tsx`
```typescript
// src/components/kanban-board-list-item.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { KanbanBoard } from "@/types/kanban";
import { t, isRTL } from "@/i18n";
import { Link } from "expo-router";

interface KanbanBoardListItemProps {
  board: KanbanBoard;
}

export function KanbanBoardListItem({ board }: KanbanBoardListItemProps) {
  const createdAt = new Date(board.created_at).toLocaleDateString(t("locale"), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/(main)/kanban/${board.id}`} asChild>
      <TouchableOpacity style={[styles.container, isRTL && styles.rtlContainer]}>
        <View style={styles.content}>
          <Text style={[styles.title, isRTL && styles.rtlText]}>{board.title}</Text>
          {board.description && (
            <Text style={[styles.description, isRTL && styles.rtlText]}>
              {board.description}
            </Text>
          )}
          <Text style={[styles.date, isRTL && styles.rtlText]}>
            {t("kanban.boardCreated", { date: createdAt })}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
    flexDirection: "row", // For potential icon or additional elements
    alignItems: "center",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: "#999",
    marginTop: 8,
  },
  rtlText: {
    textAlign: "right",
  },
});
```

### 7. `app/(main)/kanban/index.tsx`
```typescript
// app/(main)/kanban/index.tsx
import React from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Button } from "react-native";
import { useKanbanBoards } from "@/hooks/useKanbanBoards";
import { KanbanBoardListItem } from "@/components/kanban-board-list-item";
import { t, isRTL } from "@/i18n";
import { Stack } from "expo-router";

export default function KanbanBoardListScreen() {
  const { boards, loading, error, refetch } = useKanbanBoards();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{t("common.errorOccurred")}</Text>
        <Text style={styles.errorText}>{error.message}</Text>
        <Button title={t("common.tryAgain")} onPress={refetch} />
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Stack.Screen options={{ title: t("kanban.boardListTitle") }} />
      {boards && boards.length > 0 ? (
        <FlatList
          data={boards}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <KanbanBoardListItem board={item} />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.centered}>
          <Text style={[styles.noBoardsText, isRTL && styles.rtlText]}>
            {t("kanban.noBoardsFound")}
          </Text>
          {/* Add a button to create a new board later */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    textAlign: "center",
    marginBottom: 10,
  },
  listContent: {
    paddingVertical: 8,
  },
  noBoardsText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
});
```

### 8. `app/(main)/_layout.tsx`
```typescript
// app/(main)/_layout.tsx
import { Stack } from "expo-router";
import { t } from "@/i18n";

export default function MainLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: t("home.title") }}
      />
      <Stack.Screen
        name="kanban/index"
        options={{ title: t("kanban.boardListTitle") }}
      />
      <Stack.Screen
        name="kanban/[boardId]"
        options={{ title: t("kanban.boardDetailTitle"), headerBackTitle: t("common.back") }}
      />
      {/* Add other main screens here */}
    </Stack>
  );
}
```

### 9. `app/(main)/kanban/[boardId].tsx`
```typescript
// app/(main)/kanban/[boardId].tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { t, isRTL } from "@/i18n";

export default function KanbanBoardDetailScreen() {
  const { boardId } = useLocalSearchParams();

  return (
    <View style={[styles.container, isRTL && styles.rtlContainer]}>
      <Stack.Screen options={{ title: t("kanban.boardDetailTitle") }} />
      <Text style={[styles.title, isRTL && styles.rtlText]}>
        {t("kanban.boardIdDisplay", { id: boardId as string })}
      </Text>
      <Text style={[styles.subtitle, isRTL && styles.rtlText]}>
        {t("kanban.boardDetailPlaceholder")}
      </Text>
      {/* Kanban board details and columns/cards will be rendered here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#f0f2f5",
  },
  rtlContainer: {
    // Specific RTL layout adjustments if needed
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  rtlText: {
    textAlign: "right",
  },
});
```

### 10. `i18n/translations.ts` (Additions)
```typescript
// i18n/translations.ts (additions)
// ... existing translations ...
  ja: {
    // ... existing ...
    "kanban.boardListTitle": "カンバンボード",
    "kanban.boardDetailTitle": "ボード詳細",
    "kanban.boardCreated": "{{date}}に作成",
    "kanban.noBoardsFound": "カンバンボードが見つかりません。",
    "kanban.boardIdDisplay": "ボードID: {{id}}",
    "kanban.boardDetailPlaceholder": "ここにボードの詳細とカードが表示されます。",
    "common.loading": "読み込み中...",
    "common.errorOccurred": "エラーが発生しました。",
    "common.tryAgain": "再試行",
    "common.back": "戻る",
    "locale": "ja-JP", // For Intl.DateTimeFormat
  },
  en: {
    // ... existing ...
    "kanban.boardListTitle": "Kanban Boards",
    "kanban.boardDetailTitle": "Board Details",
    "kanban.boardCreated": "Created on {{date}}",
    "kanban.noBoardsFound": "No Kanban boards found.",
    "kanban.boardIdDisplay": "Board ID: {{id}}",
    "kanban.boardDetailPlaceholder": "Board details and cards will be displayed here.",
    "common.loading": "Loading...",
    "common.errorOccurred": "An error occurred.",
    "common.tryAgain": "Try Again",
    "common.back": "Back",
    "locale": "en-US", // For Intl.DateTimeFormat
  },
  // ... other languages with similar additions ...
  zh: {
    // ... existing ...
    "kanban.boardListTitle": "看板",
    "kanban.boardDetailTitle": "看板详情",
    "kanban.boardCreated": "创建于 {{date}}",
    "kanban.noBoardsFound": "未找到看板。",
    "kanban.boardIdDisplay": "看板ID: {{id}}",
    "kanban.boardDetailPlaceholder": "看板详情和卡片将在此处显示。",
    "common.loading": "加载中...",
    "common.errorOccurred": "发生错误。",
    "common.tryAgain": "重试",
    "common.back": "返回",
    "locale": "zh-CN",
  },
  ko: {
    // ... existing ...
    "kanban.boardListTitle": "칸반 보드",
    "kanban.boardDetailTitle": "보드 상세",
    "kanban.boardCreated": "{{date}}에 생성됨",
    "kanban.noBoardsFound": "칸반 보드를 찾을 수 없습니다.",
    "kanban.boardIdDisplay": "보드 ID: {{id}}",
    "kanban.boardDetailPlaceholder": "보드 상세 정보와 카드가 여기에 표시됩니다.",
    "common.loading": "로딩 중...",
    "common.errorOccurred": "오류가 발생했습니다.",
    "common.tryAgain": "다시 시도",
    "common.back": "뒤로",
    "locale": "ko-KR",
  },
  es: {
    // ... existing ...
    "kanban.boardListTitle": "Tableros Kanban",
    "kanban.boardDetailTitle": "Detalles del Tablero",
    "kanban.boardCreated": "Creado el {{date}}",
    "kanban.noBoardsFound": "No se encontraron tableros Kanban.",
    "kanban.boardIdDisplay": "ID del Tablero: {{id}}",
    "kanban.boardDetailPlaceholder": "Los detalles del tablero y las tarjetas se mostrarán aquí.",
    "common.loading": "Cargando...",
    "common.errorOccurred": "Ha ocurrido un error.",
    "common.tryAgain": "Intentar de Nuevo",
    "common.back": "Atrás",
    "locale": "es-ES",
  },
  fr: {
    // ... existing ...
    "kanban.boardListTitle": "Tableaux Kanban",
    "kanban.boardDetailTitle": "Détails du Tableau",
    "kanban.boardCreated": "Créé le {{date}}",
    "kanban.noBoardsFound": "Aucun tableau Kanban trouvé.",
    "kanban.boardIdDisplay": "ID du Tableau : {{id}}",
    "kanban.boardDetailPlaceholder": "Les détails du tableau et les cartes seront affichés ici.",
    "common.loading": "Chargement...",
    "common.errorOccurred": "Une erreur est survenue.",
    "common.tryAgain": "Réessayer",
    "common.back": "Retour",
    "locale": "fr-FR",
  },
  de: {
    // ... existing ...
    "kanban.boardListTitle": "Kanban-Boards",
    "kanban.boardDetailTitle": "Board-Details",
    "kanban.boardCreated": "Erstellt am {{date}}",
    "kanban.noBoardsFound": "Keine Kanban-Boards gefunden.",
    "kanban.boardIdDisplay": "Board-ID: {{id}}",
    "kanban.boardDetailPlaceholder": "Board-Details und Karten werden hier angezeigt.",
    "common.loading": "Wird geladen...",
    "common.errorOccurred": "Ein Fehler ist aufgetreten.",
    "common.tryAgain": "Erneut versuchen",
    "common.back": "Zurück",
    "locale": "de-DE",
  },
  pt: {
    // ... existing ...
    "kanban.boardListTitle": "Quadros Kanban",
    "kanban.boardDetailTitle": "Detalhes do Quadro",
    "kanban.boardCreated": "Criado em {{date}}",
    "kanban.noBoardsFound": "Nenhum quadro Kanban encontrado.",
    "kanban.boardIdDisplay": "ID do Quadro: {{id}}",
    "kanban.boardDetailPlaceholder": "Os detalhes do quadro e os cartões serão exibidos aqui.",
    "common.loading": "Carregando...",
    "common.errorOccurred": "Ocorreu um erro.",
    "common.tryAgain": "Tentar Novamente",
    "common.back": "Voltar",
    "locale": "pt-BR",
  },
  ar: {
    // ... existing ...
    "kanban.boardListTitle": "لوحات كانبان",
    "kanban.boardDetailTitle": "تفاصيل اللوحة",
    "kanban.boardCreated": "تم الإنشاء في {{date}}",
    "kanban.noBoardsFound": "لم يتم العثور على لوحات كانبان.",
    "kanban.boardIdDisplay": "معرف اللوحة: {{id}}",
    "kanban.boardDetailPlaceholder": "سيتم عرض تفاصيل اللوحة والبطاقات هنا.",
    "common.loading": "جار التحميل...",
    "common.errorOccurred": "حدث خطأ.",
    "common.tryAgain": "حاول مرة أخرى",
    "common.back": "رجوع",
    "locale": "ar-SA",
  },
  hi: {
    // ... existing ...
    "kanban.boardListTitle": "कनबन बोर्ड",
    "kanban.boardDetailTitle": "बोर्ड विवरण",
    "kanban.boardCreated": "{{date}} को बनाया गया",
    "kanban.noBoardsFound": "कोई कनबन बोर्ड नहीं मिला।",
    "kanban.boardIdDisplay": "बोर्ड आईडी: {{id}}",
    "kanban.boardDetailPlaceholder": "बोर्ड विवरण और कार्ड यहां प्रदर्शित किए जाएंगे।",
    "common.loading": "लोड हो रहा है...",
    "common.errorOccurred": "एक त्रुटि हुई।",
    "common.tryAgain": "पुनः प्रयास करें",
    "common.back": "वापस",
    "locale": "hi-IN",
  },
};
```

---
```
```
