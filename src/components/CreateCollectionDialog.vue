<template>
  <div class="dialog-overlay" @click="$emit('close')">
    <div class="dialog" @click.stop>
      <h3 class="dialog-title">
        {{ tab ? 'Create Collection with Tab' : 'Create New Collection' }}
      </h3>
      
      <div v-if="tab" class="dialog-text">
        Creating a new collection with the tab: <strong>{{ tab.title }}</strong>
      </div>
      
      <form @submit.prevent="handleSubmit" class="collection-form">
        <div class="form-group">
          <label for="collectionName" class="form-label">Collection Name</label>
          <input
            id="collectionName"
            v-model="collectionName"
            type="text"
            class="form-input"
            placeholder="Enter collection name"
            required
            autocomplete="off"
          />
        </div>

        <div class="form-group">
          <label for="collectionColor" class="form-label">Color</label>
          <div class="color-picker">
            <div
              v-for="color in availableColors"
              :key="color"
              class="color-option"
              :class="{ 'selected': selectedColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectedColor = color"
            ></div>
          </div>
        </div>

        <div class="dialog-actions">
          <button type="button" @click="$emit('close')" class="action-btn secondary">
            Cancel
          </button>
          <button type="submit" class="action-btn primary" :disabled="!collectionName.trim()">
            Create Collection
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Tab } from '../types';

interface Props {
  tab?: Tab;
}

defineProps<Props>();

const collectionName = ref('');
const selectedColor = ref('#3B82F6');

const availableColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#84CC16', // Lime
  '#6B7280', // Gray
];

const emit = defineEmits<{
  close: [];
  create: [data: { name: string; color: string }];
}>();

const handleSubmit = () => {
  if (collectionName.value.trim()) {
    emit('create', {
      name: collectionName.value.trim(),
      color: selectedColor.value
    });
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
  max-width: 500px;
  border: 1px solid var(--border-color);
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

.collection-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
}

.color-option {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--text-primary);
  transform: scale(1.1);
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

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}

.action-btn.secondary:hover:not(:disabled) {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--primary-hover);
}
</style> 