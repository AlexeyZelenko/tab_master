<template>
  <div class="dialog-overlay" @click="$emit('close')">
    <div class="dialog" @click.stop>
      <h3 class="dialog-title">Add Tab to Collection</h3>
      <p class="dialog-text">
        Select a collection to add "{{ tab?.title }}" to:
      </p>
      
      <div class="collection-list">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="collection-option"
          @click="$emit('addToCollection', collection.id)"
        >
          <div
            class="collection-color-small"
            :style="{ backgroundColor: collection.color || '#3B82F6' }"
          ></div>
          <div class="collection-option-info">
            <div class="collection-option-name">{{ collection.name }}</div>
            <div class="collection-option-meta">{{ collection.tabs.length }} tabs</div>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button @click="$emit('close')" class="action-btn secondary">
          Cancel
        </button>
        <button @click="$emit('createCollection')" class="action-btn primary">
          Create New Collection
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Collection, Tab } from '../types';

interface Props {
  tab: Tab | null;
  collections: Collection[];
}

defineProps<Props>();
defineEmits<{
  close: [];
  addToCollection: [collectionId: string];
  createCollection: [];
}>();
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
  max-width: 500px;
  border: 1px solid var(--border-color);
  max-height: 80vh;
  overflow-y: auto;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.dialog-text {
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.collection-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
}

.collection-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--border-color);
}

.collection-option:last-child {
  border-bottom: none;
}

.collection-option:hover {
  background: var(--card-hover);
}

.collection-color-small {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.collection-option-info {
  flex: 1;
}

.collection-option-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.collection-option-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn.secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-hover);
}
</style> 