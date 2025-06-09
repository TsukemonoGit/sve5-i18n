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
const _locale = writable<LocaleCode>("en");

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
  fallbackLocale: undefined,
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

// loaders変数をモジュールスコープに移動
// 遅延ロード関数を内部で保持
const loaders = new Map<string, () => Promise<TranslationRecord>>();

// 新しい言語を登録する関数
export function registerLocale(
  locale: LocaleCode,
  translationsOrLoader?:
    | TranslationRecord
    | (() => Promise<{ default: TranslationRecord }>)
): void {
  const options = getI18nOptions();

  // サポートされている言語リストに追加
  if (!options.supportedLocales?.includes(locale)) {
    options.supportedLocales = [...(options.supportedLocales || []), locale];
    setI18nOptions(options);
  }

  // 動的インポート関数が提供された場合
  if (typeof translationsOrLoader === "function") {
    loaders.set(locale, async () => {
      try {
        const module = await translationsOrLoader();
        return module.default;
      } catch (error) {
        if (options.debug) {
          console.error(
            `[i18n] 言語 ${locale} の動的インポートに失敗しました:`,
            error
          );
        }
        throw error;
      }
    });

    if (options.debug) {
      console.log(`[i18n] 言語 ${locale} の遅延ロードを登録しました`);
    }
    return;
  }

  // 翻訳データが直接提供された場合
  if (translationsOrLoader) {
    const currentTranslations = get(translations);
    setTranslations({
      ...currentTranslations,
      [locale]: translationsOrLoader,
    });

    if (options.debug) {
      console.log(`[i18n] 言語 ${locale} を直接登録しました`);
    }
    return;
  }

  // 翻訳データが提供されていない場合は、loadPathからの取得用のローダーを登録
  loaders.set(locale, async () => {
    const options = getI18nOptions();
    const loadPath = options.loadPath?.replace("{locale}", locale);

    if (!loadPath) {
      throw new Error(`loadPathが設定されていません`);
    }

    try {
      const response = await fetch(loadPath);
      if (!response.ok) {
        throw new Error(
          `翻訳データの取得に失敗しました: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (options.debug) {
        console.error(`[i18n] 言語 ${locale} の読み込みに失敗しました:`, error);
      }
      throw error;
    }
  });

  if (options.debug) {
    console.log(`[i18n] 言語 ${locale} のURLからの読み込みを登録しました`);
  }
}

// ローダー実行関数
export async function loadLocale(
  locale: LocaleCode
): Promise<TranslationRecord | undefined> {
  const loader = loaders.get(locale);
  if (!loader) {
    const options = getI18nOptions();
    if (options.debug) {
      console.warn(`[i18n] 言語 ${locale} のローダーが登録されていません`);
    }
    return undefined;
  }

  try {
    const localeData = await loader();
    const currentTranslations = get(translations);

    setTranslations({
      ...currentTranslations,
      [locale]: localeData,
    });

    const options = getI18nOptions();
    if (options.debug) {
      console.log(`[i18n] 言語 ${locale} を読み込みました`);
    }

    return localeData;
  } catch (error) {
    const options = getI18nOptions();
    if (options.debug) {
      console.error(`[i18n] 言語 ${locale} の読み込みに失敗しました:`, error);
    }
    throw error;
  }
}

// 初期化関数も更新
export async function initI18n(options: I18nOptions = {}): Promise<void> {
  // デフォルトオプションとマージ
  const opts = { ...defaultOptions, ...options };

  // フォールバック言語が明示的に指定されていない場合、デフォルト言語を使用
  if (!opts.fallbackLocale && opts.defaultLocale) {
    opts.fallbackLocale = opts.defaultLocale;
  }

  // グローバルオプションを保存
  setI18nOptions(opts);

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

    // 言語設定をローカルストレージに保存
    // if (initialLocale) {
    //   localStorage.setItem("preferred-locale", initialLocale);
    // }

    // 初期言語の翻訳データを自動的に読み込む
    if (initialLocale) {
      try {
        // すでに登録されたローダーを使用して読み込み
        await loadLocale(initialLocale as string);
      } catch (error) {
        if (opts.debug) {
          console.warn(`[i18n] 初期言語の読み込みに失敗しました`, error);
        }
      }
    }
  } else {
    // サーバーサイドの場合はデフォルト言語を使用
    _locale.set(opts.defaultLocale as string);
  }
}

// 翻訳を取得する基本関数
function getTranslate(
  locale: string,
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
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
      return str.replace(new RegExp(`{${paramKey}}`, "g"), String(paramValue));
    }, result);
  }

  return result;
}

// フォールバック対応の翻訳取得関数
function getTranslateWithFallback(
  locale: string,
  translations: Translations,
  key: string,
  params?: Record<string, string | number>
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
  params?: Record<string, string | number>
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
    (key: string, params?: Record<string, string | number>) => {
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

// setLocale関数も更新して動的ローディングに対応
export async function setLocale(newLocale: string): Promise<void> {
  const options = getI18nOptions();

  // サポートされた言語かチェック
  if (!options.supportedLocales?.includes(newLocale)) {
    if (options.debug) {
      console.warn(`[i18n] サポートされていない言語です: ${newLocale}`);
    }
    return;
  }

  // 既存の翻訳データを取得
  const currentTranslations = get(translations);

  // 該当言語の翻訳データがまだ読み込まれていない場合は読み込む
  if (!currentTranslations[newLocale]) {
    try {
      await loadLocale(newLocale);
    } catch (error) {
      if (options.debug) {
        console.error(`[i18n] 言語データの読み込みに失敗しました:`, error);
      }
      return;
    }
  }

  // 言語を切り替え
  _locale.set(newLocale);

  // 設定をローカルストレージに保存
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("preferred-locale", newLocale);
  }

  if (options.debug) {
    console.log(`[i18n] 言語を変更しました: ${newLocale}`);
  }
}

// 翻訳データを直接設定する関数
export function setTranslations(newTranslations: Translations): void {
  translations.set(newTranslations);
}

// 現在の言語の翻訳データを取得する関数
export function getCurrentTranslations(): TranslationRecord | undefined {
  const currentLocale = get(locale);
  const allTranslations = get(translations);
  return allTranslations[currentLocale];
}

// Svelte 5用の翻訳ディレクティブ
export function translate(
  node: HTMLElement,
  options: { key: string; params?: Record<string, string | number> }
) {
  const updateText = () => {
    const currentLocale = get(locale);
    const allTranslations = get(translations);

    node.textContent = getTranslateWithFallback(
      currentLocale,
      allTranslations,
      options.key,
      options.params
    );
  };

  // 初期テキスト設定
  updateText();

  // locale変更とtranslations変更を監視
  const unsubLocale = locale.subscribe(() => updateText());
  const unsubTranslations = translations.subscribe(() => updateText());

  return {
    update(newOptions: {
      key: string;
      params?: Record<string, string | number>;
    }) {
      options = newOptions;
      updateText();
    },
    destroy() {
      unsubLocale();
      unsubTranslations();
    },
  };
}

// HTMLタイトル用の翻訳関数
export const setTitle = (
  key: string,
  params?: Record<string, string | number>
) => {
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
