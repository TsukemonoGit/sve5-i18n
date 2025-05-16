<script lang="ts">
  import LocaleSwitcher from "$lib/components/LocaleSwitcher.svelte";
  import { onMount } from "svelte";

  import { setTitle } from "svelte5-i18n";
  import "$lib/i18n/index.ts";

  onMount(async () => {
    /* await initI18n({
      defaultLocale: "ja",
      supportedLocales: ["ja", "en"],
      loadPath: "/langs/{locale}.json",
    }); */

    // ページタイトルの設定
    setTitle("common.title");
  });
</script>

<header>
  <div class="title">Svelte 5 i18n</div>
  <LocaleSwitcher />
</header>

<main>
  <slot />
</main>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background-color: #f0f4f8;
    border-bottom: 1px solid #e2e8f0;
  }

  .title {
    font-size: 1.5rem;
    font-weight: bold;
  }

  main {
    padding: 1rem;
  }
</style>
