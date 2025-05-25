# Install
```
npm i @konemono/svelte5-i18n
```

# 使い方の説明

## svelte5 の i18n

## 1. 初期設定

アプリケーションの起動時に `initI18n` 関数を呼び出して初期化します：

```typescript
// src/lib/i18n/index.ts

import { initI18n, setTranslations } from "@konemono/svelte5-i18n";

const defaultLocale = "en";

// 動的インポート方式で言語ファイルを登録
registerLocale("ja", () => import("./locales/ja.json"));
registerLocale("en", () => import("./locales/en.json"));

initI18n({
  defaultLocale: defaultLocale,
  supportedLocales: ["ja", "en"],
});
```

```svelte
<!-- +layout.svelte または他の初期化ファイル内 -->
<script lang="ts">
  import "$lib/i18n/index.ts";
</script>
```

---

## 2. 翻訳ファイルの構造

翻訳ファイルは以下のような JSON 形式で作成します：

```json
// src/lib/i18n/locales/ja.json
{
  "common": {
    "title": "アプリケーションタイトル",
    "welcome": "ようこそ、{name}さん！",
    "language": "言語"
  },
  "menu": {
    "home": "ホーム",
    "about": "紹介",
    "contact": "お問い合わせ",
    "add": "追加"
  }
}
```

```json
// src/lib/i18n/locales/en.json
{
  "common": {
    "title": "Application Title",
    "welcome": "Welcome, {name}!",
    "language": "Language"
  },
  "menu": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "add": "Add"
  }
}
```

## 3. 翻訳の使用方法

### 方法 1: `t` 関数を使用

```svelte
<script>
import { t } from "@konemono/svelte5-i18n";
</script>
<!-- 単純な翻訳 -->
{$t("menu.add")} <!-- => "追加" または "Add" -->

<!-- パラメータ付き翻訳 -->
{$t("common.welcome", { name: "ジョン" })} <!-- => "ようこそ、ジョンさん！" または "Welcome, John!" -->
```

---

### 方法 2: `Trans` コンポーネントを使用

まず、`Trans.svelte` コンポーネントを作成します：

```svelte
<!-- src/lib/i18n/Trans.svelte -->
<script lang="ts">
  import { t } from "@konemono/svelte5-i18n";

  interface Props {
    key: string;
    params?: Record<string, string>;
  }
  let { key = "", params = {} }: Props = $props();
</script>

{$t(key, params)}

```

そして、以下のように使用します：

```svelte
<script>
  import Trans from '$lib/i18n/Trans.svelte';
</script>

<Trans key="menu.add" />
<Trans key="common.welcome" params={{ name: 'ジョン' }} />
```

---

### 方法 3: `translate` ディレクティブを使用

```svelte
<script>
  import { translate } from "@konemono/svelte5-i18n";
</script>

<h1 use:translate={{ key: 'common.title' }}>タイトル</h1>
<p use:translate={{ key: 'common.welcome', params: { name: 'ジョン' } }}>ようこそ</p>
```

---

## 3. 言語の切り替え

```ts
import { setLocale } from "@konemono/svelte5-i18n";

// 言語を英語に切り替える
setLocale("en");
```

また、言語切り替え用のコンポーネントを作成することもできます：

```svelte
<!-- src/lib/i18n/LocaleSwitcher.svelte -->
<script lang="ts">
  import { getLocale, setLocale } from "$lib/i18n";

  export let locales: string[] = ["ja", "en"];
  export let labels: Record<string, string> = { ja: "日本語", en: "English" };

  let currentLocale = getLocale();

  function handleChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    setLocale(target.value);
    currentLocale = target.value;
  }
</script>

<select value={currentLocale} on:change={handleChange}>
  {#each locales as locale}
    <option value={locale}>{labels[locale]}</option>
  {/each}
</select>
```

---

## 4. ページタイトルの翻訳

```ts
import { setTitle } from "$lib/i18n/directives";

// ページタイトルを設定
setTitle("common.title");
```

## API リファレンス

### ストア

- **locale**  
  現在のロケール（言語コード）を保持する Svelte の derived ストア（`Readable<string>`）。

  ```typescript
  export const locale: Readable<string>;
  ```

  - 現在選択されている言語コード（例: `"ja"` や `"en"`）を購読できます。

- **translations**  
  全ロケール分の翻訳データを保持する Svelte の writable ストア。
  ```typescript
  export const translations: Writable<Translations>;
  ```
  - 各言語の翻訳 JSON を格納します。

---

### 初期化・設定

- **initI18n(options?: I18nOptions): Promise<void>**  
  i18n システムを初期化します。  
  オプションでデフォルト言語や対応言語、翻訳ファイルのパスなどを指定できます。

  ```typescript
  export async function initI18n(options?: I18nOptions): Promise<void>;
  ```

  - ブラウザの言語や localStorage から初期ロケールを決定します。

- **setLocale(newLocale: string): void**  
  ロケール（言語）を手動で切り替えます。

  ```typescript
  export function setLocale(newLocale: string): void;
  ```

- **setTranslations(newTranslations: Translations): void**  
  翻訳データを直接セットします（テストや動的変更用）。

  ```typescript
  export function setTranslations(newTranslations: Translations): void;
  ```

- **getI18nOptions(): I18nOptions**  
  現在の i18n オプションを取得します。
  ```typescript
  export function getI18nOptions(): I18nOptions;
  ```

---

### 翻訳取得

- **t**  
  現在のロケール・翻訳データに基づき、翻訳関数を返す Svelte の derived ストアです。
  ```typescript
  export const t: Readable<
    (key: string, params?: Record<string, string>) => string
  >;
  ```
  - 使い方例: `{$t("greeting.hello", { name: "ユーザー" })}`
  - フォールバックやパラメータ置換、デバッグ出力にも対応。

---

### Svelte アクション

- **translate**  
  HTML 要素に翻訳を自動適用する Svelte アクションです。
  ```typescript
  export function translate(
    node: HTMLElement,
    options: { key: string; params?: Record<string, string> }
  ): {
    update(newOptions: { key: string; params?: Record<string, string> }): void;
    destroy(): void;
  };
  ```
  - `node.textContent` に翻訳結果を自動でセットします。
  - `locale` が変わるたびに自動で再翻訳されます。
  - `update` で翻訳キーやパラメータを動的に変更できます。
  - `destroy` で購読解除します。
  - 例:
    ```svelte
    <h1 use:translate={{ key: "greeting.hello", params: { name } }} />
    ```

---

### その他

- **setTitle(key: string, params?: Record<string, string>): void**  
  ドキュメントタイトルを翻訳して自動更新します（クライアントのみ）。
  ```typescript
  export const setTitle: (key: string, params?: Record<string, string>) => void;
  ```
  - 言語切り替え時も自動でタイトルが更新されます。

---

### 型定義

- **I18nOptions**  
  初期化や設定に使うオプション型。

  ```typescript
  interface I18nOptions {
    defaultLocale?: string;
    supportedLocales?: string[];
    loadPath?: string;
    fallbackLocale?: string;
    debug?: boolean;
    missingTranslationWarnings?: boolean;
  }
  ```

- **Translations**  
  翻訳データの型。
  ```typescript
  type Translations = Record<string, TranslationRecord>;
  type TranslationRecord = { [key: string]: string | TranslationRecord };
  ```

---

## ライブラリの特徴

- **Svelte 5 の新機能を活用**：シグナル、エフェクト、派生値を使用して最適化されています
- **URL が変わらないタイプ**：言語切り替えで URL が変更されません
- **軽量で柔軟**：必要な機能に集中し、不要な依存関係がありません
- **ローカルストレージ対応**：ユーザーの言語設定を保存します
- **ブラウザのデフォルト言語検出**：初回訪問時にブラウザの言語設定を検出します
- **階層的な翻訳キー**：`menu.add` のような階層構造をサポートします
- **パラメータ置換**：`{name}` のようなプレースホルダーをサポートします
- **フォールバック言語**：翻訳が見つからない場合のフォールバックが設定可能です
- **SSR サポート**：サーバーサイドレンダリングに対応しています

---
