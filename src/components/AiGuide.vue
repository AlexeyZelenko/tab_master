<template>
  <div class="dialog-overlay" @click="$emit('close')">
    <div class="dialog guide-dialog" @click.stop>
      <div class="guide-header">
        <h3 class="dialog-title">How to Use AI Features</h3>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      <div class="guide-content">
        <p>
          The AI feature uses OpenAI's GPT model to analyze your open tabs and suggest a relevant name and description for your new collection.
        </p>
        
        <h4>Step 1: Get an OpenAI API Key</h4>
        <ol>
          <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> and sign in.</li>
          <li>Click <strong>"+ Create new secret key"</strong>.</li>
          <li>Name the key (e.g., "Keep Tabs Extension") and copy the `sk-...` key.</li>
        </ol>
        <p class="note">
          <strong>Note:</strong> OpenAI may require a paid account for API access. Please check their current policies.
        </p>

        <h4>Step 2: Enable AI Features in the Extension</h4>
        <ol>
          <li>Click the <strong>Settings icon (⚙️)</strong> in the sidebar.</li>
          <li>Check the box for <strong>"Enable AI Features"</strong>.</li>
          <li>Paste your secret API key into the input field.</li>
          <li>Click <strong>"Save"</strong>. Your key is stored locally and securely.</li>
        </ol>

        <h4>Step 3: Use the AI Assistant</h4>
        <ol>
          <li>Click the <strong>Save button (+)</strong> next to "This browser".</li>
          <li>In the dialog, click the purple <strong>"✨ Suggest with AI"</strong> button.</li>
          <li>The name and description fields will be auto-filled. Review or edit them, then save your collection.</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['close']);
</script>

<style scoped>
.guide-dialog {
  max-width: 600px;
  text-align: left;
}
.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  line-height: 1;
  color: var(--text-secondary);
  cursor: pointer;
}
.guide-content {
  font-size: 0.9rem;
  color: var(--text-secondary);
}
.guide-content h4 {
  font-size: 1rem;
  color: var(--text-primary);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.guide-content ol {
  padding-left: 1.5rem;
}
.guide-content li {
  margin-bottom: 0.5rem;
}
.note {
  font-size: 0.8rem;
  background-color: var(--input-bg);
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid var(--primary-color);
}
a {
  color: var(--primary-color);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}
</style> 