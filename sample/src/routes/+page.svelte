<!-- src/routes/+page.svelte -->
<script lang="ts">
  import Trans from "$lib/components/Trans.svelte";
  import { t } from "svelte5-i18n";
  import { translate } from "svelte5-i18n";

  let name = $state("ユーザー");

  // 名前変更ハンドラー
  function handleNameChange(e: Event) {
    name = (e.target as HTMLInputElement).value;
  }
</script>

<div class="container">
  <h1>Svelte 5 i18n Demo</h1>

  <div class="welcome-section">
    <!-- 存在する翻訳キー -->
    <p>{$t("common.welcome", { name: name })}</p>
    <input
      type="text"
      value={name}
      oninput={handleNameChange}
      placeholder="あなたの名前"
    />
  </div>

  <div class="menu-section">
    <h2 use:translate={{ key: "dashboard.status" }}>ステータス</h2>

    <div class="button-group">
      <button class="action-button">
        <Trans key="menu.add" />
      </button>
      <button class="action-button">
        <Trans key="menu.delete" />
      </button>
      <button class="action-button primary">
        <Trans key="menu.save" />
      </button>
      <button class="action-button">
        <Trans key="menu.cancel" />
      </button>
    </div>

    <!-- フォールバックキーを使う例 -->
    <p>
      <strong
        use:translate={{
          key: "menu.unknown",
          fallbackKey:
            "menu.add" /* 存在しないキーmenu.unknownの代わりにmenu.addを表示 */,
        }}>（フォールバックあり）</strong
      >
    </p>
  </div>

  <div class="info-section">
    <p>
      <strong use:translate={{ key: "dashboard.items.items" }}
        >アイテム数</strong
      >: 42
    </p>
    <p>
      <strong use:translate={{ key: "dashboard.lastUpdate" }}>最終更新</strong>:
      {new Date().toLocaleString()}
    </p>

    <!-- さらにフォールバック言語の例 -->
    <p>
      <strong
        use:translate={{
          key: "dashboard.noKey",
          fallbackKey:
            "noja" /* 日本語辞書に存在しないキーがフォールバック言語の翻訳に切り替わる */,
        }}>（フォールバック言語適用例）</strong
      >
    </p>
  </div>
</div>

<style>
  /* ...省略（元のまま） */
</style>
