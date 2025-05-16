<!-- src/lib/i18n/Trans.svelte -->
<script lang="ts">
  import { t } from "svelte5-i18n";

  // プロパティ定義
  interface Props {
    key: string;
    params?: Record<string, string>;
  }
  let { key = "", params = {} }: Props = $props();
</script>

{$t(key, params)}
