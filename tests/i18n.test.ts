import { describe, expect, test, vi, beforeEach } from "vitest";
import { get } from "svelte/store";
import {
  getTranslate,
  getTranslateWithFallback,
  t,
  setLocale,
  translations as translationStore,
  I18nOptions,
  setI18nOptions,
} from "../src/index";

// モック翻訳データ
const translationData = {
  ja: {
    app: {
      title: "こんにちは",
      welcome: "ようこそ、{name}さん",
    },
    common: {
      ok: "了解",
      greet: "Hello, {name}",
    },
  },
  en: {
    app: {
      title: "Hello",
      title_missing: "Hello fallback",
    },
    common: {
      ok: "OK",
    },
  },
};

let mockedOptions = {
  debug: true,
  missingTranslationWarnings: true,
  fallbackLocale: "en",
};

setI18nOptions(mockedOptions);

// ✅ 各テストの前にストアを初期化
beforeEach(() => {
  translationStore.set(translationData); // ストアにデータを注入
  setLocale("ja"); // ストアにロケールを設定
});

describe("getTranslate", () => {
  test("キーが存在すれば翻訳を返す", () => {
    expect(getTranslate("ja", translationData, "app.title")).toBe("こんにちは");
    expect(getTranslate("en", translationData, "app.title")).toBe("Hello");
  });

  test("params付きの翻訳が正しく展開される", () => {
    const result = getTranslate("ja", translationData, "app.welcome", {
      name: "カシヲ",
    });
    expect(result).toBe("ようこそ、カシヲさん");
  });

  test("キーが存在しなければ元のキーを返す", () => {
    expect(getTranslate("ja", translationData, "app.unknown")).toBe(
      "app.unknown"
    );
  });
});

describe("getTranslateWithFallback", () => {
  test("現在のロケールで翻訳が見つかればそれを使う", () => {
    expect(getTranslateWithFallback("ja", translationData, "app.title")).toBe(
      "こんにちは"
    );
  });

  test("現在のロケールに翻訳がなく、フォールバックロケールで見つかれば使う", () => {
    expect(
      getTranslateWithFallback("ja", translationData, "app.title_missing")
    ).toBe("Hello fallback");
  });

  test("両方で見つからない場合はキーを返す", () => {
    expect(getTranslateWithFallback("ja", translationData, "not.exists")).toBe(
      "not.exists"
    );
  });
});

describe("t derived store", () => {
  test("t() は現在のロケールで翻訳を返す", () => {
    const $t = get(t);
    expect($t("app.title")).toBe("こんにちは");
  });

  test("t() は fallback キーがあれば使う", () => {
    const $t = get(t);
    expect($t("app.not_exist", "common.ok")).toBe("了解");
  });

  test("t() は fallback ロケールも試みる", () => {
    const $t = get(t);
    expect($t("app.title_missing", "common.ok")).toBe("Hello fallback");
  });

  test("t() は見つからなければ最初のキーを返す", () => {
    const $t = get(t);
    expect($t("nothing.here", "nope.there")).toBe("nothing.here");
  });

  test("", () => {
    const $t = get(t);
    // 第一引数は存在しないキーなのでフォールバックキーにフォールバック
    expect($t("app.not_exist", "common.greet", { name: "Jason" })).toBe(
      "Hello, Jason"
    );
  });
});
