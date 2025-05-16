// src/lib/i18n/index.ts
import { get, writable } from "svelte/store";

// タイプ定義
type TranslationRecord = {
  [key: string]: string | TranslationRecord;
};
type Translations = Record<string, TranslationRecord>;
type LocaleCode = string;

// シグナルの初期化
export const locale = writable<LocaleCode>("ja");
export const translations = writable<Translations>({});

// 初期設定用のオプション
interface I18nOptions {
  defaultLocale?: LocaleCode;
  supportedLocales?: LocaleCode[];
  loadPath?: string;
  fallbackLocale?: LocaleCode;
}

// デフォルトオプション
const defaultOptions: I18nOptions = {
  defaultLocale: "ja",
  supportedLocales: ["ja", "en"],
  loadPath: "/i18n/locales/{locale}.json",
  fallbackLocale: "ja",
};

// 初期化関数
export async function initI18n(options: I18nOptions = {}): Promise<void> {
  const opts = { ...defaultOptions, ...options };

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
    console.log(initialLocale);
    locale.set(initialLocale as string);
  } else {
    // サーバーサイドの場合はデフォルト言語を使用
    locale.set(opts.defaultLocale as string);
  }
  /* 
  const currentLocale = get(locale);

  // 最初の言語ファイル読み込みをPromiseとして保持
  initialLoadPromise = loadTranslations(currentLocale, opts);
  await initialLoadPromise;

  // ロケール変更時の処理
  locale.subscribe((newLocale) => {
    if (newLocale) {
      if (typeof window !== "undefined") {
        localStorage?.setItem("preferred-locale", newLocale);
      }
      loadTranslations(newLocale, opts);
    }
  }); */
}

// 翻訳を取得する関数
export function t(
  _locale: string,
  key: string,
  params?: Record<string, string>
): string {
  const currentLocale = get(locale);
  const allTranslations = get(translations);

  const localeTranslations = allTranslations[currentLocale] || {};

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

// 言語を切り替える関数
export function setLocale(newLocale: LocaleCode): void {
  locale.set(newLocale);
}

// 現在の言語を取得する関数
export function getLocale(): LocaleCode {
  return get(locale);
}

// 翻訳データを直接設定する関数（テスト用）
export function setTranslations(newTranslations: Translations): void {
  translations.set(newTranslations);
}
// Svelte 5用の翻訳ディレクティブ
export function translate(
  node: HTMLElement,
  options: { key: string; params?: Record<string, string> }
) {
  const updateText = () => {
    node.textContent = t(get(locale), options.key, options.params);
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
export const setTitle =
  typeof document === "undefined"
    ? () => {}
    : (key: string, params?: Record<string, string>) => {
        const updateTitle = () => {
          document.title = t(get(locale), key, params);
        };
        updateTitle();
        if (typeof window !== "undefined") {
          locale.subscribe(() => updateTitle());
        }
      };
