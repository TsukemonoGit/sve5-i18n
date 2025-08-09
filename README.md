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

import { initI18n, registerLocale } from "@konemono/svelte5-i18n";

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

## 4. 翻訳データのロード待機

翻訳データが非同期で読み込まれる場合、`waitLocale` 関数を使用して翻訳の準備完了を待つことができます：

```typescript
import { waitLocale } from "@konemono/svelte5-i18n";

// 翻訳データの読み込み完了を待つ
try {
  await waitLocale();
  console.log("翻訳データが利用可能です");
} catch (error) {
  console.error("翻訳データの読み込みに失敗しました:", error);
}
```

これは特に以下の場面で有用です：

- アプリケーション起動時に翻訳データの準備完了を確認したい場合
- 動的に言語を切り替えた後、翻訳データの読み込み完了を確認したい場合
- サーバーサイドレンダリング後のハイドレーション処理で翻訳を使用したい場合

---

## 5. 言語の切り替え

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

## 6. ページタイトルの翻訳

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

- **registerLocale(locale: string, translationsOrLoader?: TranslationRecord | () => Promise<{ default: TranslationRecord }>): void**  
  新しい言語を登録します。

  - 直接翻訳データを渡すか、遅延ロード用の関数を渡せます。
  - 何も渡さない場合は `loadPath` から自動取得するローダーを登録します。

  ```typescript
  export function registerLocale(
    locale: string,
    translationsOrLoader?:
      | TranslationRecord
      | (() => Promise<{ default: TranslationRecord }>)
  ): void;
  ```

  - 例:

    ```typescript
    // 直接データを登録
    registerLocale("fr", { hello: "Bonjour" });

    // 遅延ロード関数を登録
    registerLocale("de", () => import("./locales/de.json"));

    // loadPathから自動取得
    registerLocale("es");
    ```

- **setLocale(newLocale: string): Promise<void>**  
  ロケール（言語）を手動で切り替えます。必要に応じて翻訳データも自動ロードします。

  ```typescript
  export async function setLocale(newLocale: string): Promise<void>;
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

### 翻訳取得・待機

- **t**  
  現在のロケール・翻訳データに基づき、翻訳関数を返す Svelte の derived ストアです。

  ```typescript
  export const t: Readable<
    (key: string, params?: Record<string, string | number>) => string
  >;
  ```

  - 使い方例: `{$t("greeting.hello", { name: "ユーザー" })}`
  - フォールバックやパラメータ置換、デバッグ出力にも対応。

- **waitLocale(): Promise<void>**  
  現在のロケールの翻訳データが読み込まれるまで待機します。
  ```typescript
  export function waitLocale(): Promise<void>;
  ```
  - 翻訳データが既に読み込み済みの場合は即座に解決されます。
  - 翻訳データがない場合は自動的に読み込みを試行します。
  - 10 秒でタイムアウトし、読み込みに失敗した場合はエラーを throw します。
  - 使用例:
    ```typescript
    try {
      await waitLocale();
      // 翻訳データが利用可能
    } catch (error) {
      // 読み込み失敗またはタイムアウト
    }
    ```

---

### Svelte アクション

- **translate**  
  HTML 要素に翻訳を自動適用する Svelte アクションです。
  ```typescript
  export function translate(
    node: HTMLElement,
    options: { key: string; params?: Record<string, string | number> }
  ): {
    update(newOptions: {
      key: string;
      params?: Record<string, string | number>;
    }): void;
    destroy(): void;
  };
  ```
  - `node.textContent` に翻訳結果を自動でセットします。
  - `locale` や `translations` が変わるたびに自動で再翻訳されます。
  - `update` で翻訳キーやパラメータを動的に変更できます。
  - `destroy` で購読解除します。
  - 例:
    ```svelte
    <h1 use:translate={{ key: "greeting.hello", params: { name } }} />
    ```

---

### その他

- **setTitle(key: string, params?: Record<string, string | number>): void**  
  ドキュメントタイトルを翻訳して自動更新します（クライアントのみ）。

  ```typescript
  export const setTitle: (
    key: string,
    params?: Record<string, string | number>
  ) => void;
  ```

  - 言語切り替え時も自動でタイトルが更新されます。

- **getCurrentTranslations(): TranslationRecord | undefined**  
  現在のロケールの翻訳データを取得します。
  ```typescript
  export function getCurrentTranslations(): TranslationRecord | undefined;
  ```

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
- **非同期ロード待機**：翻訳データの読み込み完了を待機する機能を提供します

---

# @konemono/svelte5-i18n の VSCode 設定

## VSCode i18n-ally 拡張機能の設定

VSCode で[i18n-ally 拡張機能](https://marketplace.visualstudio.com/items?itemName=lokalise.i18n-ally)を使用すると、翻訳キーの自動補完や翻訳の管理が便利になります。

### 1. 拡張機能のインストール

VSCode で「i18n Ally」を検索してインストールしてください。

### 2. VSCode 設定ファイル（.vscode/settings.json）

プロジェクトルートに`.vscode/settings.json`を作成し、以下の設定を追加：

```json
{
  "i18n-ally.localesPaths": ["src/lib/i18n/locales"],
  "i18n-ally.keystyle": "nested",
  "i18n-ally.enabledFrameworks": ["svelte"],
  "i18n-ally.namespace": false,
  "i18n-ally.usage.scanningIgnore": [
    "node_modules/**",
    "dist/**",
    ".svelte-kit/**"
  ],
  "i18n-ally.regex.usageMatchAppend": [
    "\\$t\\s*\\(['\"`]({key})['\"`].*?\\)",
    "(?:\\s|^)t\\s*\\(['\"`]({key})['\"`].*?\\)"
  ]
}
```

### 3. 設定の説明

- **localesPaths**: 翻訳ファイルの場所を指定
- **keystyle**: ネストしたキー形式（`common.hello`など）に対応
- **enabledFrameworks**: Svelte プロジェクトであることを認識
- **namespace**: 名前空間機能を無効化
- **scanningIgnore**: スキャン対象外のディレクトリを指定
- **usageMatchAppend**: `$t()`と`t()`の両方のパターンを認識

### 4. 使用例

設定後、以下のような機能が使えるようになります：

```svelte
<script>
  import { t } from '@konemono/svelte5-i18n';
</script>

<!-- キーの自動補完 -->
<h1>{$t('common.hello')}</h1>
<p>{$t('messages.welcome')}</p>

<!-- ホバーで翻訳内容を確認 -->
<button>{$t('actions.submit')}</button>
```

### 5. 便利な機能

- **自動補完**: 翻訳キーの入力時に候補が表示
- **ホバー表示**: キーにマウスを置くと翻訳内容が表示
- **未使用キー検出**: 使われていない翻訳キーをハイライト
- **不足翻訳検出**: 特定の言語で不足している翻訳をマーク
- **インライン編集**: エディタ上で直接翻訳を編集可能

これらの設定により、@konemono/svelte5-i18n での開発がより効率的になります。
