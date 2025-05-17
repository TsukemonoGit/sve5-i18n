// src/lib/i18n/index.ts

import { initI18n, registerLocale, setTranslations } from "svelte5-i18n";

const defaultLocale = "en";

// 動的インポート方式で言語ファイルを登録
registerLocale("ja", () => import("./locales/ja.json"));
registerLocale("en", () => import("./locales/en.json"));

// 翻訳データを直接インポート（ビルド時に解決）
/* import ja from "./locales/ja.json";
import en from "./locales/en.json"; */

// setTranslations({
//   ja,
//   en,
// });

initI18n({
  defaultLocale: defaultLocale,
  supportedLocales: ["ja", "en"],
});
