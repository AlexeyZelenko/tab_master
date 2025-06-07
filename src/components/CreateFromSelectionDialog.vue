<template>
  <div class="dialog-overlay" @click="$emit('close')">
    <div class="dialog" @click.stop>
      <h3 class="dialog-title">Create New Collection from Selection</h3>
      
      <div class="ai-suggestion-section" v-if="isAiFeatureAvailable">
        <button @click="fetchAiSuggestion" :disabled="isAiLoading" class="dialog-btn dialog-btn-ai">
          <span v-if="isAiLoading">✨ Thinking...</span>
          <span v-else>✨ Suggest with AI</span>
        </button>
      </div>

      <input
        v-model="collectionName"
        type="text"
        placeholder="Collection name"
        class="dialog-input"
        @keyup.enter="handleCreate"
      />
      <textarea
        v-model="collectionDescription"
        placeholder="Description (optional)"
        class="dialog-textarea"
      ></textarea>
      <p class="dialog-text">This will create a new collection with {{ selectedTabs.length }} tabs.</p>
      
      <div class="dialog-actions">
        <button @click="$emit('close')" class="dialog-btn dialog-btn-secondary">
          Cancel
        </button>
        <button @click="handleCreate" class="dialog-btn dialog-btn-primary">
          Create Collection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed } from 'vue';
import type { Tab } from '../types';

const props = defineProps<{
  selectedTabs: Tab[];
  isAiEnabled: boolean;
  apiKey: string;
  getAiSuggestion: (tabs: Tab[]) => Promise<{ name: string; description: string }>;
}>();

const emit = defineEmits(['close', 'create']);

const collectionName = ref('');
const collectionDescription = ref('');
const isAiLoading = ref(false);

const isAiFeatureAvailable = computed(() => props.isAiEnabled && props.apiKey);

const fetchAiSuggestion = async () => {
  isAiLoading.value = true;
  try {
    const suggestion = await props.getAiSuggestion(props.selectedTabs);
    collectionName.value = suggestion.name;
    collectionDescription.value = suggestion.description;
  } catch (error) {
    alert((error as Error).message);
  } finally {
    isAiLoading.value = false;
  }
};

const handleCreate = () => {
  if (collectionName.value.trim()) {
    emit('create', {
      name: collectionName.value.trim(),
      description: collectionDescription.value.trim(),
      tabs: props.selectedTabs,
    });
    emit('close');
  }
};
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.dialog {
  background: var(--card-bg);
  border-radius: 0.5rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  border: 1px solid var(--border-color);
}
.dialog-btn-ai {
  background-color: #5a3ab3;
  color: white;
  width: 100%;
  margin-bottom: 15px;
}
.dialog-btn-ai:hover {
  background-color: #4a2e9a;
}
.dialog-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}
/* You may need to copy more dialog styles from App.vue for full consistency */
.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}
.dialog-input,
.dialog-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}
.dialog-textarea {
  min-height: 80px;
  resize: vertical;
}
.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}
.dialog-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}
.dialog-btn-secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}
.dialog-btn-primary {
  background: var(--primary-color);
  color: white;
}
</style> 