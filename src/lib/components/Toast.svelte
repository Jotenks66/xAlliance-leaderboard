<script>
  let { message = '', visible = false } = $props();
</script>

{#if visible}
  <div class="toast" role="status" aria-live="polite">{message}</div>
{/if}

<style>
  .toast {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    background: rgba(15, 22, 41, 0.98);
    color: #e5e7eb;
    border: 1px solid #1f2a44;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 14px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    z-index: 50;
  }
</style>


