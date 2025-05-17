// src/lib/i18n.ts
import { onMount } from "svelte";
import { derived, get, writable } from "svelte/store";

// タイプ定義
type TranslationRecord = {
  [key: string]: string | TranslationRecord;
};
type Translations = Record<string, TranslationRecord>;
type LocaleCode = string;

// シグナルの初期化
// 内部で使うwritableストア
const _locale = writable("en");

// 外部に公開するderivedストア（読み取り専用）
export const locale = derived(_locale, ($locale) => $locale);
export const translations = writable<Translations>({});

// 初期設定用のオプション
interface I18nOptions {
  defaultLocale?: LocaleCode;
  supportedLocales?: LocaleCode[];
  loadPath?: string;
  fallbackLocale?: LocaleCode;
  debug?: boolean;
  missingTranslationWarnings?: boolean;
}

// デフォルトオプション
const defaultOptions: I18nOptions = {
  defaultLocale: "ja",
  supportedLocales: ["ja", "en"],
  loadPath: "/i18n/locales/{locale}.json",
  fallbackLocale: undefined, // 明示的に undefined に設定
  debug: false,
  missingTranslationWarnings: false,
};

// グローバルオプション保存用変数
let globalI18nOptions: I18nOptions = defaultOptions;

// オプションをグローバルに保存
function setI18nOptions(options: I18nOptions): void {
  globalI18nOptions = { ...globalI18nOptions, ...options };
}

// グローバルオプションを取得
export function getI18nOptions(): I18nOptions {
  return globalI18nOptions;
}

// 初期化関数
export async function initI18n(options: I18nOptions = {}): Promise<void> {
  // デフォルトオプションとマージ
  const opts = { ...defaultOptions, ...options };

  // フォールバック言語が明示的に指定されていない場合、デフォルト言語を使用
  if (!opts.fallbackLocale && opts.defaultLocale) {
    opts.fallbackLocale = opts.defaultLocale;
  }

  // ブラウザ環境でのみ実行
  if (typeof window !== "undefined") {
    // ブラウザの設定から言語を取得
    const browserLocale = navigator.language.split("-")[0];
    const storedLocale = localStorage?.getItem("preferred-locale");

    // 初期言語の設定
    const initialLocale =
      storedLocale ||
      (opts.supportedLocales?.includes(browserLocale)
        ? browserLocale
        : opts.defaultLocale);

    if (opts.debug) {
      console.log(
        `初期言語: ${initialLocale}, フォールバック言語: ${opts.fallbackLocale}`
      );
    }

    _locale.set(initialLocale as string);
  } else {
    // サーバーサイドの場合はデフォルト言語を使用
    _locale.set(opts.defaultLocale as string);
  }

  // グローバルオプションを保存
  setI18nOptions(opts);
}

// 翻訳を取得する基本関数
function getTranslate(
  locale: string,
  translations: Translations,
  key: string,
  params?: Record<string, string>
): string {
  const localeTranslations = translations[locale] || {};

  // キーを分解して階層的に取得
  const keys = key.split(".");
  let result: any = localeTranslations;

  for (const k of keys) {
    if (result && typeof result === "object" && k in result) {
      result = result[k];
    } else {
      // キーが見つからない場合はキーをそのまま返す
      return key;
    }
  }

  // 文字列でない場合はキーをそのまま返す
  if (typeof result !== "string") {
    return key;
  }

  // パラメータの置換
  if (params) {
    return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
      return str.replace(new RegExp(`{${paramKey}}`, "g"), paramValue);
    }, result);
  }

  return result;
}

// フォールバック対応の翻訳取得関数
function getTranslateWithFallback(
  locale: string,
  translations: Translations,
  key: string,
  params?: Record<string, string>
): string {
  const options = getI18nOptions();

  // まず現在の言語で翻訳を試みる
  const result = getTranslate(locale, translations, key, params);

  // キーがそのまま返された場合（＝翻訳が見つからなかった場合）
  if (
    result === key &&
    options.fallbackLocale &&
    locale !== options.fallbackLocale
  ) {
    // フォールバック言語で翻訳を試みる
    return getTranslate(options.fallbackLocale, translations, key, params);
  }

  // 見つかった翻訳、またはフォールバックも失敗した場合はキーをそのまま返す
  return result;
}

// デバッグ情報付きフォールバック関数
function getTranslateWithFallbackDebug(
  locale: string,
  translations: Translations,
  key: string,
  params?: Record<string, string>
): string {
  const options = getI18nOptions();

  // まず現在の言語で翻訳を試みる
  const result = getTranslate(locale, translations, key, params);

  // デバッグモードがオンで翻訳が見つからなかった場合
  if (options.debug && options.missingTranslationWarnings && result === key) {
    console.warn(`[i18n] Missing translation: ${locale}.${key}`);
  }

  // キーがそのまま返された場合（＝翻訳が見つからなかった場合）
  if (
    result === key &&
    options.fallbackLocale &&
    locale !== options.fallbackLocale
  ) {
    // フォールバック言語で翻訳を試みる
    const fallbackResult = getTranslate(
      options.fallbackLocale,
      translations,
      key,
      params
    );

    if (
      options.debug &&
      options.missingTranslationWarnings &&
      fallbackResult !== key
    ) {
      console.info(
        `[i18n] Using fallback: ${options.fallbackLocale}.${key} for ${locale}.${key}`
      );
    }

    return fallbackResult;
  }

  return result;
}

// フォールバック対応の翻訳関数
export const t = derived(
  [locale, translations],
  ([$locale, $translations]) =>
    (key: string, params?: Record<string, string>) => {
      const options = getI18nOptions();
      if (options.debug && options.missingTranslationWarnings) {
        return getTranslateWithFallbackDebug(
          $locale,
          $translations,
          key,
          params
        );
      } else {
        return getTranslateWithFallback($locale, $translations, key, params);
      }
    }
);

// 言語を切り替える関数
export function setLocale(newLocale: string) {
  _locale.set(newLocale);
}

// 翻訳データを直接設定する関数
export function setTranslations(newTranslations: Translations): void {
  translations.set(newTranslations);
}

// Svelte 5用の翻訳ディレクティブ
export function translate(
  node: HTMLElement,
  options: { key: string; params?: Record<string, string> }
) {
  const updateText = () => {
    node.textContent = getTranslateWithFallback(
      get(locale),
      get(translations),
      options.key,
      options.params
    );
  };

  // 初期テキスト設定
  updateText();

  // locale変更を監視
  const unsub = locale.subscribe(() => updateText());

  return {
    update(newOptions: { key: string; params?: Record<string, string> }) {
      options = newOptions;
      updateText();
    },
    destroy() {
      unsub();
    },
  };
}

// HTMLタイトル用の翻訳関数
export const setTitle = (key: string, params?: Record<string, string>) => {
  if (!globalThis.document) {
    return;
  }

  onMount(() => {
    const unsubscribe = t.subscribe(($t) => {
      if (globalThis.document) {
        document.title = $t(key, params);
      }
    });

    return unsubscribe;
  });
};
