<template>
  <div class="current-tabs-view">
    <!-- Current Tabs Header -->
    <div class="collection-header">
      <div class="collection-title-section">
        <div class="collection-color-large browser-color">
          🌐
        </div>
        <div class="collection-info">
          <h1 class="collection-title">This Browser</h1>
          <p class="collection-description">
            All currently open tabs in this browser window
          </p>
          <div class="collection-meta">
            <span class="meta-item">
              {{ currentTabs.length }} tabs
            </span>
            <span class="meta-separator">•</span>
            <span class="meta-item">
              Updated now
            </span>
          </div>
        </div>
      </div>

      <div class="collection-actions">
        <button
          @click="$emit('saveCurrentTabs')"
          class="action-btn primary"
          title="Save all current tabs as collection"
        >
          <ArchiveBoxArrowDownIcon class="w-5 h-5" />
          Save All Tabs
        </button>
      </div>
    </div>

    <!-- Tab Search -->
    <TabSearch 
      v-model="tabSearchQuery"
      placeholder="Search current tabs..."
    />

    <!-- Current Tabs List -->
    <div class="tabs-list">
      <div class="tabs-header">
        <h3 class="tabs-title">
          Current Tabs ({{ filteredCurrentTabs.length }}{{ filteredCurrentTabs.length !== currentTabs.length ? ' of ' + currentTabs.length : '' }})
        </h3>
        <div v-if="filteredCurrentTabs.length > 0" class="tabs-header-actions">
          <button
            @click="selectAllCurrentTabs"
            class="tab-action-btn"
            :title="selectedCurrentTabs.length === filteredCurrentTabs.length ? 'Deselect all' : 'Select all'"
          >
            <MinusCircleIcon v-if="selectedCurrentTabs.length === filteredCurrentTabs.length" class="w-5 h-5" />
            <Squares2X2Icon v-else class="w-5 h-5" />
          </button>
          <button
            v-if="selectedCurrentTabs.length > 0"
            @click="showAddSelectedToCollectionDialog"
            class="tab-action-btn add-selected"
            :title="`Add ${selectedCurrentTabs.length} selected tabs to collection`"
          >
            <PlusIcon class="w-4 h-4" />
            Add {{ selectedCurrentTabs.length }} to Collection
          </button>
        </div>
      </div>

      <TabGrid
        :tabs="filteredCurrentTabs"
        :selectedTabs="selectedCurrentTabs"
        :collections="collections"
        :getTabCollection="getTabCollection"
        type="current"
        @toggleSelection="toggleCurrentTabSelection"
        @openTab="openTab"
        @addToCollection="showAddToCollectionDialog"
      />
    </div>

    <!-- Add to Collection Dialog -->
    <AddToCollectionDialog
      v-if="showAddToCollection"
      :tab="selectedTabForCollection"
      :collections="collections"
      @close="showAddToCollection = false"
      @addToCollection="addTabToCollection"
      @createCollection="$emit('createCollection')"
    />

    <!-- Add Selected Tabs to Collection Dialog -->
    <AddSelectedToCollectionDialog
      v-if="showAddSelectedToCollection"
      :selectedCount="selectedCurrentTabs.length"
      :collections="collections"
      @close="showAddSelectedToCollection = false"
      @addToCollection="addSelectedTabsToCollection"
      @createCollection="$emit('createCollection')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { PlusIcon, ArchiveBoxArrowDownIcon, Squares2X2Icon, MinusCircleIcon } from '@heroicons/vue/24/outline';
import type { Collection, Tab } from '../types';
import TabSearch from './TabSearch.vue';
import TabGrid from './TabGrid.vue';
import AddToCollectionDialog from './AddToCollectionDialog.vue';
import AddSelectedToCollectionDialog from './AddSelectedToCollectionDialog.vue';

interface Props {
  currentTabs: Tab[];
  collections: Collection[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  saveCurrentTabs: [];
  createCollection: [];
  addTabToCollection: [collectionId: string, tab: Tab];
}>();

const tabSearchQuery = ref('');
const selectedCurrentTabs = ref<string[]>([]);
const showAddToCollection = ref(false);
const showAddSelectedToCollection = ref(false);
const selectedTabForCollection = ref<Tab | null>(null);

const filteredCurrentTabs = computed(() => {
  if (!tabSearchQuery.value) return props.currentTabs;
  
  const query = tabSearchQuery.value.toLowerCase();
  return props.currentTabs.filter(tab =>
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

const toggleCurrentTabSelection = (tabId: string) => {
  const index = selectedCurrentTabs.value.indexOf(tabId);
  if (index > -1) {
    selectedCurrentTabs.value.splice(index, 1);
  } else {
    selectedCurrentTabs.value.push(tabId);
  }
};

const selectAllCurrentTabs = () => {
  if (selectedCurrentTabs.value.length === filteredCurrentTabs.value.length) {
    selectedCurrentTabs.value = [];
  } else {
    selectedCurrentTabs.value = filteredCurrentTabs.value.map(tab => tab.id);
  }
};

const showAddSelectedToCollectionDialog = () => {
  if (selectedCurrentTabs.value.length > 0) {
    showAddSelectedToCollection.value = true;
  }
};

const addSelectedTabsToCollection = (collectionId: string) => {
  selectedCurrentTabs.value.forEach(tabId => {
    const tab = props.currentTabs.find(t => t.id === tabId);
    if (tab) {
      emit('addTabToCollection', collectionId, tab);
    }
  });
  selectedCurrentTabs.value = [];
  showAddSelectedToCollection.value = false;
};

// Function to find which collection contains a specific tab
const getTabCollection = (url: string) => {
  return props.collections.find(collection =>
    collection.tabs.some(tab => tab.url === url)
  );
};

// Сброс выбранных вкладок при изменении поиска
watch(tabSearchQuery, () => {
  selectedCurrentTabs.value = [];
});
</script>

<style scoped>
.current-tabs-view {
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.browser-color {
  background: linear-gradient(135deg, #3B82F6, #1D4ED8);
  color: white;
  font-size: 1.5rem;
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
}

.action-btn.primary {
  background: var(--primary-color);
  color: white;
}

.action-btn.primary:hover {
  background: var(--primary-hover);
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

.tabs-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-action-btn {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: none;
  border-radius: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  transition: all 0.2s;
}

.tab-action-btn:hover {
  background: var(--primary-bg);
  color: var(--primary-color);
}

.tab-action-btn.add-selected {
  background: var(--primary-color);
  color: white;
}

.tab-action-btn.add-selected:hover {
  background: var(--primary-hover);
}
</style> 