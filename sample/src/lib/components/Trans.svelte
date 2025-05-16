<!-- src/lib/i18n/Trans.svelte -->
<script lang="ts">
  import { locale, t } from "svelte5-i18n";

  // プロパティ定義
  export let key = "";
  export let params: Record<string, string> = {};
</script>

{t($locale, key, params)}
