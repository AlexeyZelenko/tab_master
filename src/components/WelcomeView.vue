<template>
  <div class="welcome-view">
    <div class="welcome-content">
      <div class="welcome-icon">🗂️</div>
      <h2 class="welcome-title">Welcome to Keep Tabs</h2>
      <p class="welcome-description">
        Select a collection from the sidebar to view and manage your saved tabs, 
        or create a new collection to get started.
      </p>
      
      <div class="quick-stats">
        <div class="stat-card">
          <div class="stat-number">{{ collections.length }}</div>
          <div class="stat-label">Collections</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalTabs }}</div>
          <div class="stat-label">Saved Tabs</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ currentTabs.length }}</div>
          <div class="stat-label">Current Tabs</div>
        </div>
      </div>

      <div class="quick-actions">
        <button @click="$emit('createCollection')" class="action-btn primary">
          <PlusIcon class="w-5 h-5" />
          Create Collection
        </button>
        <button @click="$emit('saveCurrentTabs')" class="action-btn secondary">
          <ArchiveBoxArrowDownIcon class="w-5 h-5" />
          Save Current Tabs
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusIcon, ArchiveBoxArrowDownIcon } from '@heroicons/vue/24/outline';
import type { Collection, Tab } from '../types';

interface Props {
  collections: Collection[];
  totalTabs: number;
  currentTabs: Tab[];
}

defineProps<Props>();
defineEmits<{
  createCollection: [];
  saveCurrentTabs: [];
}>();
</script>

<style scoped>
.welcome-view {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-content {
  text-align: center;
  max-width: 500px;
}

.welcome-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.welcome-description {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  text-align: center;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.quick-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
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
  text-decoration: none;
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-hover);
}

.action-btn.secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}
</style> 