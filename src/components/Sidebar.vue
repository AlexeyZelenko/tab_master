<template>
  <div class="sidebar">
    <!-- Header -->
    <div class="sidebar-header">
      <div class="app-logo">
        <div class="logo-icon">🗂️</div>
        <h1 class="app-title">Keep Tabs</h1>
      </div>
      
      <div class="header-actions">
        <button @click="$emit('openSettings')" class="settings-btn" title="Settings">
          <Cog6ToothIcon class="w-5 h-5" />
        </button>
        <button @click="toggleTheme" class="theme-toggle" :title="`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`">
          <component :is="state.theme === 'dark' ? SunIcon : MoonIcon" class="w-5 h-5" />
        </button>
        <button @click="exportCollections" class="export-btn" title="Export collections">
          <ArrowDownTrayIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-container">
      <div class="search-box">
        <MagnifyingGlassIcon class="search-icon" />
        <input
          v-model="state.searchQuery"
          type="text"
          placeholder="Search collections..."
          class="search-input"
        />
        <button
          v-if="state.searchQuery"
          @click="state.searchQuery = ''"
          class="clear-search"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Current Tabs Section -->
    <div class="tabs-section">
      <div class="section-header">
        <FolderIcon class="section-icon" />
        <h2 class="section-title">TABS</h2>
      </div>
      
      <div class="current-tabs">
        <div 
          class="tab-browser-item"
          :class="{ active: showingCurrentTabs }"
          @click="selectCurrentTabs"
        >
          <div class="browser-info">
            <div class="browser-icon">🌐</div>
            <div class="browser-details">
              <div class="browser-name">This browser</div>
              <div class="tab-count">{{ state.currentTabs.length }} tabs</div>
            </div>
          </div>
          <button
            @click.stop="$emit('openSaveDialog')"
            class="save-tabs-btn"
            title="Save current tabs as collection"
          >
            <PlusIcon class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Groups Section -->
    <div v-if="state.tabGroups?.length > 0" class="tab-groups-section">
      <div class="section-header">
        <div class="section-title-container" @click="toggleTabGroupsCollapsed">
          <RectangleGroupIcon class="section-icon" />
          <h2 class="section-title">TAB GROUPS</h2>
          <button class="collapse-toggle" :class="{ collapsed: tabGroupsCollapsed }">
            <component :is="tabGroupsCollapsed ? ChevronRightIcon : ChevronDownIcon" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-show="!tabGroupsCollapsed" class="tab-groups-list">
        <div
          v-for="group in state.tabGroups"
          :key="group.id"
          class="tab-group-item"
          @click="selectTabGroup(group)"
        >
          <div class="group-info">
            <div
              class="group-color"
              :class="`group-color-${group.color}`"
            ></div>
            <div class="group-details">
              <div class="group-name">
                {{ group.title || `Group ${group.id}` }}
                <span v-if="group.collapsed" class="collapsed-indicator">⮞</span>
                <span v-else class="expanded-indicator">⮟</span>
              </div>
              <div class="group-meta">
                {{ group.tabs.length }} tabs • {{ group.color }}
              </div>
            </div>
          </div>
          <div class="group-actions">
            <button
              @click.stop="saveTabGroupAsCollection(group)"
              class="save-group-btn"
              title="Save group as collection"
            >
              <PlusIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Collections Section -->
    <div class="collections-section">
      <div class="section-header">
        <div class="section-title-container">
          <ArchiveBoxIcon class="section-icon" />
          <h2 class="section-title">COLLECTIONS</h2>
        </div>
        <button @click="showCreateDialog = true" class="add-collection-btn" title="Create new collection">
          <PlusIcon class="w-4 h-4" />
        </button>
      </div>

      <div class="collections-list">
        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          :class="['collection-item', { active: state.selectedCollection?.id === collection.id }]"
          @click="selectCollection(collection)"
        >
          <div class="collection-info">
            <div
              class="collection-color"
              :style="{ backgroundColor: collection.color || '#3B82F6' }"
            ></div>
            <div class="collection-details">
              <div class="collection-name">{{ collection.name }}</div>
              <div class="collection-meta">
                {{ collection.tabs.length }} tabs • Updated {{ formatRelativeTime(collection.updatedAt) }}
              </div>
            </div>
          </div>
          <div class="collection-actions">
            <button
              @click.stop="restoreCollection(collection)"
              class="restore-btn"
              title="Restore tabs"
            >
              <ArrowTopRightOnSquareIcon class="w-4 h-4" />
            </button>
            <button
              @click.stop="deleteCollection(collection.id)"
              class="delete-btn"
              title="Delete collection"
            >
              <TrashIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-section">
      <div class="stat-item">
        <span class="stat-label">Total Collections:</span>
        <span class="stat-value">{{ state.collections.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Total Saved Tabs:</span>
        <span class="stat-value">{{ totalTabs }}</span>
      </div>
    </div>

    <!-- Create Collection Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="showCreateDialog = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog-title">Create New Collection</h3>
        <input
          v-model="newCollectionName"
          type="text"
          placeholder="Collection name"
          class="dialog-input"
          @keyup.enter="createNewCollection"
        />
        <textarea
          v-model="newCollectionDescription"
          placeholder="Description (optional)"
          class="dialog-textarea"
        ></textarea>
        <div class="dialog-actions">
          <button @click="showCreateDialog = false" class="dialog-btn dialog-btn-secondary">
            Cancel
          </button>
          <button @click="createNewCollection" class="dialog-btn dialog-btn-primary">
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Import File Input -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FolderIcon,
  ArchiveBoxIcon,
  PlusIcon,
  ArrowTopRightOnSquareIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  SunIcon,
  MoonIcon,
  RectangleGroupIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  Cog6ToothIcon
} from '@heroicons/vue/24/outline';
import type { Collection } from '../types';

interface Props {
  state: any;
  filteredCollections: Collection[];
  totalTabs: number;
  createCollection: (name: string, description?: string) => Collection;
  deleteCollection: (id: string) => void;
  saveCurrentTabsAsCollection: (name: string, description?: string) => Promise<Collection>;
  restoreCollection: (collection: Collection) => void;
  exportCollections: () => void;
  importCollections: (file: File) => Promise<void>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'selectCollection', collection: Collection | null): void;
  (e: 'toggleTheme'): void;
  (e: 'openSettings'): void;
  (e: 'openSaveDialog'): void;
  (e: 'openCreateDialog'): void;
  (e: 'deleteCollection', id: string): void;
  (e: 'restoreCollection', collection: Collection): void;
  (e: 'importCollections', file: File): void;
  (e: 'exportCollections'): void;
}>();

const showCreateDialog = ref(false);
const showingCurrentTabs = ref(false);
const newCollectionName = ref('');
const newCollectionDescription = ref('');
const fileInput = ref<HTMLInputElement>();
const tabGroupsCollapsed = ref(false);

const selectCollection = (collection: Collection) => {
  showingCurrentTabs.value = false;
  emit('selectCollection', collection);
};

const selectCurrentTabs = () => {
  showingCurrentTabs.value = true;
  emit('selectCollection', null); // Special signal for current tabs
};

const toggleTheme = () => {
  emit('toggleTheme');
};

const createNewCollection = () => {
  if (newCollectionName.value.trim()) {
    props.createCollection(newCollectionName.value.trim(), newCollectionDescription.value.trim() || undefined);
    newCollectionName.value = '';
    newCollectionDescription.value = '';
    showCreateDialog.value = false;
  }
};

const handleFileImport = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    try {
      await props.importCollections(file);
    } catch (error) {
      alert('Failed to import collections: ' + (error as Error).message);
    }
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const selectTabGroup = (group: any) => {
  showingCurrentTabs.value = false;
  // Emit special signal for tab group selection
  emit('selectCollection', { 
    type: 'tabGroup', 
    data: group 
  } as any);
};

const saveTabGroupAsCollection = async (group: any) => {
  const collectionName = group.title || `Group ${group.id}`;
  const description = `Tab group with ${group.tabs.length} tabs (${group.color})`;
  
  try {
    await props.saveCurrentTabsAsCollection(collectionName, description);
  } catch (error) {
    console.error('Error saving tab group as collection:', error);
  }
};

const toggleTabGroupsCollapsed = () => {
  tabGroupsCollapsed.value = !tabGroupsCollapsed.value;
};
</script>

<style scoped>
.sidebar {
  width: 320px;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.sidebar-header {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.25rem;
}

.app-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.375rem;
}

.theme-toggle,
.export-btn {
  padding: 0.375rem;
  border: none;
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-toggle:hover,
.export-btn:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.search-container {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.625rem;
  width: 0.875rem;
  height: 0.875rem;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.375rem 0.625rem 0.375rem 2rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.8125rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.clear-search {
  position: absolute;
  right: 0.375rem;
  padding: 0.1875rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.1875rem;
  transition: color 0.2s;
}

.clear-search:hover {
  color: var(--text-primary);
}

.tabs-section {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.section-header {
  padding: 0.625rem 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
}

.section-title-container {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  flex: 1;
}

.section-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
}

.add-collection-btn {
  padding: 0.1875rem;
  border: none;
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
  border-radius: 0.1875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-collection-btn:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.current-tabs {
  padding: 0.375rem;
}

.tab-browser-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  border-radius: 0.25rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-browser-item:hover {
  background: var(--card-hover);
  border-color: var(--primary-color);
}

.tab-browser-item.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.tab-browser-item.active .browser-name,
.tab-browser-item.active .tab-count {
  color: white;
}

.browser-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.browser-icon {
  font-size: 1rem;
}

.browser-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8125rem;
}

.tab-count {
  font-size: 0.6875rem;
  color: var(--text-secondary);
}

.save-tabs-btn {
  padding: 0.25rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 0.1875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.save-tabs-btn:hover {
  background: var(--primary-hover);
}

.collections-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.375rem;
}

.collection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 0.25rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.collection-item:hover {
  background: var(--card-hover);
  border-color: var(--primary-color);
}

.collection-item.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.collection-item.active .collection-name,
.collection-item.active .collection-meta {
  color: white;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.collection-color {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.collection-details {
  flex: 1;
  min-width: 0;
}

.collection-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-meta {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.collection-actions {
  display: flex;
  gap: 0.1875rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.collection-item:hover .collection-actions {
  opacity: 1;
}

.restore-btn,
.delete-btn {
  padding: 0.1875rem;
  border: none;
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
  border-radius: 0.1875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.restore-btn:hover {
  background: var(--success-color);
  color: white;
}

.delete-btn:hover {
  background: var(--error-color);
  color: white;
}

.stats-section {
  padding: 0.75rem;
  border-top: 1px solid var(--border-color);
  background: var(--sidebar-bg);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.stat-item:last-child {
  margin-bottom: 0;
}

.stat-label {
  font-size: 0.6875rem;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-primary);
}

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
  transition: border-color 0.2s;
}

.dialog-textarea {
  min-height: 80px;
  resize: vertical;
}

.dialog-input:focus,
.dialog-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
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
  transition: all 0.2s;
}

.dialog-btn-secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}

.dialog-btn-secondary:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.dialog-btn-primary {
  background: var(--primary-color);
  color: white;
}

.dialog-btn-primary:hover {
  background: var(--primary-hover);
}

.tab-groups-list {
  overflow-y: auto;
  padding: 0.375rem;
  max-height: 120px;
}

.tab-group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  border-radius: 0.25rem;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.tab-group-item:hover {
  background: var(--card-hover);
  border-color: var(--primary-color);
}

.group-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.group-color {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.group-details {
  flex: 1;
  min-width: 0;
}

.group-name {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.8125rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-meta {
  font-size: 0.6875rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-actions {
  display: flex;
  gap: 0.1875rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.tab-group-item:hover .group-actions {
  opacity: 1;
}

.save-group-btn {
  padding: 0.1875rem;
  border: none;
  background: var(--primary-color);
  color: white;
  border-radius: 0.1875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.save-group-btn:hover {
  background: var(--primary-hover);
}

.collapsed-indicator,
.expanded-indicator {
  font-size: 0.6875rem;
  color: var(--text-secondary);
}

/* Tab Group Colors */
.group-color-grey { background-color: #9aa0a6; }
.group-color-blue { background-color: #1a73e8; }
.group-color-red { background-color: #ea4335; }
.group-color-yellow { background-color: #fbbc04; }
.group-color-green { background-color: #34a853; }
.group-color-pink { background-color: #ea4aaa; }
.group-color-purple { background-color: #9334e6; }
.group-color-cyan { background-color: #1ba1f2; }
.group-color-orange { background-color: #ff6d01; }

.collapse-toggle {
  padding: 0.1875rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.collapse-toggle:hover {
  color: var(--text-primary);
}

.collapse-toggle.collapsed {
  transform: rotate(90deg);
}

.tab-groups-section .section-title-container {
  cursor: pointer;
  transition: color 0.2s;
  padding: 0.1875rem;
  border-radius: 0.1875rem;
}

.tab-groups-section .section-title-container:hover {
  background: var(--card-hover);
}

.tab-groups-section {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}

.collections-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>