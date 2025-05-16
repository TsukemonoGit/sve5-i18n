<!-- src/lib/i18n/LocaleSwitcher.svelte -->
<script lang="ts">
  import { setLocale, getLocale, locale } from "svelte5-i18n";

  // プロパティ定義
  interface Props {
    locales?: string[];
    labels?: Record<string, string>;
  }

  let {
    locales = ["ja", "en"],
    labels = { ja: "日本語", en: "English" },
  }: Props = $props();

  if (typeof window !== "undefined") {
    $effect(() => {
      // ロケール変更時の追加処理をここに記述できます
      console.log(`Locale changed to: ${getLocale()}`);
    });
  }
</script>

<div class="locale-switcher">
  {#each locales as loc}
    <button
      class="locale-button"
      class:active={$locale === loc}
      onclick={() => setLocale(loc)}
    >
      {labels[loc]}
    </button>
  {/each}
</div>

<style>
  .locale-switcher {
    display: flex;
    gap: 0.5rem;
  }

  .locale-button {
    padding: 0.25rem 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
  }

  .locale-button.active {
    background: #4a5568;
    color: white;
  }
</style>
