<template>
  <div class="tab-group-view">
    <!-- Tab Group Header -->
    <div class="collection-header">
      <div class="collection-title-section">
        <div
          class="collection-color-large group-color"
          :class="`group-color-${tabGroup.color}`"
        ></div>
        <div class="collection-info">
          <h1 class="collection-title">
            {{ tabGroup.title || `Group ${tabGroup.id}` }}
            <span v-if="tabGroup.collapsed" class="collapsed-indicator">⮞</span>
            <span v-else class="expanded-indicator">⮟</span>
          </h1>
          <p class="collection-description">
            Tab group with {{ tabGroup.tabs.length }} tabs • {{ tabGroup.color }} color
          </p>
          <div class="collection-meta">
            <span class="meta-item">
              {{ tabGroup.tabs.length }} tabs
            </span>
            <span class="meta-separator">•</span>
            <span class="meta-item">
              Window {{ tabGroup.windowId }}
            </span>
            <span class="meta-separator">•</span>
            <span class="meta-item">
              {{ tabGroup.collapsed ? 'Collapsed' : 'Expanded' }}
            </span>
          </div>
        </div>
      </div>

      <div class="collection-actions">
        <button
          @click="$emit('saveAsCollection')"
          class="action-btn primary"
          title="Save this tab group as a collection"
        >
          <ArchiveBoxArrowDownIcon class="w-5 h-5" />
          Save as Collection
        </button>
        <button
          @click="focusGroup"
          class="action-btn secondary"
          title="Focus all tabs in group"
        >
          <ArrowTopRightOnSquareIcon class="w-5 h-5" />
          Focus Group
        </button>
      </div>
    </div>

    <!-- Tab Search -->
    <div class="tab-search">
      <div class="search-box">
        <MagnifyingGlassIcon class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search tabs in this group..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="clear-search"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Tab Group List -->
    <div class="tabs-list">
      <div class="tabs-header">
        <h3 class="tabs-title">
          Group Tabs ({{ filteredTabs.length }}{{ filteredTabs.length !== tabGroup.tabs.length ? ' of ' + tabGroup.tabs.length : '' }})
        </h3>
      </div>

      <div class="tabs-grid group-tabs-grid">
        <div
          v-for="tab in filteredTabs"
          :key="tab.id"
          class="tab-card group-tab"
        >
          <div class="tab-favicon">
            <img v-if="tab.favicon" :src="tab.favicon" :alt="tab.title" class="favicon-img" />
            <div v-else class="favicon-placeholder">🌐</div>
          </div>
          <div class="tab-info">
            <div class="tab-title">{{ tab.title }}</div>
            <div class="tab-url">{{ tab.url }}</div>
          </div>
          <div class="tab-actions">
            <button
              @click.stop="showAddToCollectionDialog(tab)"
              class="tab-action-btn add-to-collection"
              title="Add to collection"
            >
              <PlusIcon class="w-4 h-4" />
            </button>
            <button
              @click="openTab(tab.url)"
              class="tab-action-btn"
              title="Go to tab"
            >
              <ArrowTopRightOnSquareIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="filteredTabs.length === 0" class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">
          {{ searchQuery ? 'No matching tabs' : 'No tabs in this group' }}
        </h3>
        <p class="empty-description">
          {{ searchQuery ? 'Try adjusting your search query.' : 'This group appears to be empty.' }}
        </p>
      </div>
    </div>

    <!-- Add to Collection Dialog -->
    <div v-if="showAddToCollection" class="dialog-overlay" @click="showAddToCollection = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog-title">Add Tab to Collection</h3>
        <p class="dialog-text">
          Select a collection to add "{{ selectedTabForCollection?.title }}" to:
        </p>
        
        <div class="collection-list">
          <div
            v-for="collection in collections"
            :key="collection.id"
            class="collection-option"
            @click="addTabToCollection(collection.id)"
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
          <button @click="showAddToCollection = false" class="action-btn secondary">
            Cancel
          </button>
          <button @click="$emit('createCollection')" class="action-btn primary">
            Create New Collection
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  PlusIcon,
  ArchiveBoxArrowDownIcon,
  ArrowTopRightOnSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline';
import type { TabGroup, Tab, Collection } from '../types';

interface Props {
  tabGroup: TabGroup;
  collections: Collection[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  saveAsCollection: [];
  addTabToCollection: [collectionId: string, tab: Tab];
  createCollection: [];
}>();

const searchQuery = ref('');
const showAddToCollection = ref(false);
const selectedTabForCollection = ref<Tab | null>(null);

const filteredTabs = computed(() => {
  if (!searchQuery.value) return props.tabGroup.tabs;
  
  const query = searchQuery.value.toLowerCase();
  return props.tabGroup.tabs.filter(tab =>
    tab.title.toLowerCase().includes(query) ||
    tab.url.toLowerCase().includes(query)
  );
});

const openTab = (url: string) => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
};

const focusGroup = () => {
  props.tabGroup.tabs.forEach(tab => {
    openTab(tab.url);
  });
};

const showAddToCollectionDialog = (tab: Tab) => {
  selectedTabForCollection.value = tab;
  showAddToCollection.value = true;
};

const addTabToCollection = (collectionId: string) => {
  if (selectedTabForCollection.value) {
    emit('addTabToCollection', collectionId, selectedTabForCollection.value);
    showAddToCollection.value = false;
    selectedTabForCollection.value = null;
  }
};
</script>

<style scoped>
.tab-group-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
}

.collection-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.collection-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.collection-color-large {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  flex-shrink: 0;
}

.group-color {
  border-radius: 0.75rem;
}

.collection-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.collection-description {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0 0 0.75rem 0;
}

.collection-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-separator {
  color: var(--text-secondary);
  opacity: 0.5;
}

.collapsed-indicator,
.expanded-indicator {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-left: 0.5rem;
}

.collection-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
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
  border: 1px solid var(--border-color);
}

.action-btn.secondary:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.tab-search {
  margin-bottom: 1rem;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  width: 1rem;
  height: 1rem;
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.clear-search {
  position: absolute;
  right: 0.5rem;
  padding: 0.25rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: color 0.2s;
}

.clear-search:hover {
  color: var(--text-primary);
}

.tabs-list {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tabs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-color);
}

.tabs-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.tabs-grid {
  flex: 1;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  padding-right: 0.5rem;
  padding-bottom: 1rem;
}

.group-tabs-grid {
  gap: 1rem;
}

.tab-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s;
  display: flex;
  gap: 0.75rem;
  position: relative;
}

.tab-card:hover {
  background: var(--card-hover);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.group-tab {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.group-tab:hover {
  background: var(--card-hover);
  border-color: var(--primary-color);
}

.tab-favicon {
  flex-shrink: 0;
}

.favicon-img {
  width: 2rem;
  height: 2rem;
  border-radius: 0.25rem;
  object-fit: cover;
}

.favicon-placeholder {
  width: 2rem;
  height: 2rem;
  background: var(--button-secondary-bg);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.tab-info {
  flex: 1;
  min-width: 0;
}

.tab-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tab-url {
  font-size: 0.75rem;
  color: var(--primary-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tab-actions {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.tab-card:hover .tab-actions {
  opacity: 1;
}

.tab-action-btn {
  padding: 0.25rem;
  border: none;
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-action-btn:hover {
  background: var(--primary-color);
  color: white;
}

.tab-action-btn.add-to-collection {
  background: var(--success-color, #10B981);
  color: white;
}

.tab-action-btn.add-to-collection:hover {
  background: var(--success-hover, #059669);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  font-size: 0.875rem;
  margin: 0;
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

.dialog-text {
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0 0 1.5rem 0;
}

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.collection-list {
  max-height: 200px;
  overflow-y: auto;
  margin: 1rem 0;
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
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
  flex-shrink: 0;
}

.collection-option-info {
  flex: 1;
}

.collection-option-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.25rem;
}

.collection-option-meta {
  font-size: 0.75rem;
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

/* Utility classes */
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
</style> 