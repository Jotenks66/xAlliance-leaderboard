<script>
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" />
	<link rel="stylesheet" href="/app.css" />
</svelte:head>

<div class="container">
  <div class="header">
    <a href="https://xalliance.io/" rel="noreferrer" target="_blank" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;">
      <img src="/xAlliance-logo-dark.png" alt="xAlliance" style="height:48px;display:block;" />
    </a>
  </div>
  {@render children?.()}
  <footer class="footer" aria-label="Footer links">
    <a class="badge link" href="https://xalliance.io/" target="_blank" rel="noopener noreferrer">xalliance.io</a>
    <a class="badge link" href="https://x.com/xalliancedao" target="_blank" rel="noopener noreferrer">@xalliancedao</a>
  </footer>
</div>
