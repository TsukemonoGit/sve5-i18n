<!-- src/lib/i18n/Trans.svelte -->
<script lang="ts">
  import { t } from "svelte5-i18n";

  interface Props {
    key: string;
    fallbackKey?: string; // 追加
    params?: Record<string, string>;
  }
  let { key = "", fallbackKey = undefined, params = {} }: Props = $props();
</script>

{$t(key, fallbackKey, params)}
