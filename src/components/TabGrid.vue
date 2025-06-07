<template>
  <div :class="['tabs-grid', { 'grid-view': type === 'current' || viewMode === 'grid' }]">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      :class="['tab-card', type === 'current' ? 'current-tab' : '', { selected: selectedTabs.includes(tab.id) }]"
      @click="type === 'collection' ? $emit('toggleSelection', tab.id) : undefined"
    >
      <div class="tab-selection" v-if="type === 'current'">
        <input
          type="checkbox"
          :checked="selectedTabs.includes(tab.id)"
          @change="$emit('toggleSelection', tab.id)"
          class="tab-checkbox"
        />
      </div>
      
      <div class="tab-selection" v-else>
        <input
          type="checkbox"
          :checked="selectedTabs.includes(tab.id)"
          class="tab-checkbox"
          @click.stop
          @change="$emit('toggleSelection', tab.id)"
        />
      </div>
      
      <div class="tab-favicon">
        <img v-if="tab.favicon && type === 'current'" :src="tab.favicon" :alt="tab.title" class="favicon-img" />
        <div v-else class="favicon-placeholder">🌐</div>
      </div>
      
      <div class="tab-info" v-if="type === 'current'">
        <div class="tab-title-wrapper">
          <div class="tab-title" :title="tab.title">{{ tab.title }}</div>
          <button
            @click.stop="toggleTabDetails(tab.id)"
            class="tab-details-toggle"
            :title="expandedTabs.includes(tab.id) ? 'Hide details' : 'Show details'"
          >
            <ChevronDownIcon
              :class="['w-4 h-4', { 'rotate-180': expandedTabs.includes(tab.id) }]"
            />
          </button>
        </div>
        
        <!-- Quick info line -->
        <div v-if="!expandedTabs.includes(tab.id)" class="tab-quick-info">
          <span v-if="tab.pinned" class="quick-info-item pinned-quick">
            📌 Pinned
          </span>
           <span v-if="tab.active" class="quick-info-item active-quick">
            ✨ Active
          </span>
          <span v-if="getTabCollection && getTabCollection(tab.url)" class="quick-info-item collection-quick">
            📁 {{ getTabCollection(tab.url)?.name }}
          </span>
        </div>
        
        <!-- Tab Details Dropdown -->
        <div v-if="expandedTabs.includes(tab.id)" class="tab-details">
          <div class="detail-grid">
            <span class="detail-label">URL</span>
            <a :href="tab.url" target="_blank" class="detail-value tab-url" :title="tab.url">
              {{ formatUrl(tab.url, 40) }}
            </a>
            
            <span class="detail-label">Status</span>
            <div class="detail-value status-pills">
              <span v-if="tab.pinned" class="status-pill pinned-quick">📌 Pinned</span>
              <span v-if="tab.active" class="status-pill active-quick">✨ Active</span>
            </div>
            
            <span class="detail-label">Collection</span>
            <template v-if="getTabCollection && getTabCollection(tab.url)">
              <div class="detail-value collection-info">
                <div
                  class="collection-color-small"
                  :style="{ backgroundColor: getTabCollection(tab.url)?.color || '#3B82F6' }"
                ></div>
                <span class="collection-name">{{ getTabCollection(tab.url)?.name }}</span>
              </div>
            </template>
            <template v-else>
              <div class="detail-value not-in-collection">
                Not in any collection
              </div>
            </template>
            
            <template v-if="tab.lastAccessed">
              <span class="detail-label">Accessed</span>
              <span class="detail-value">{{ formatRelativeTime(tab.lastAccessed) }}</span>
            </template>
            
            <template v-if="tab.groupId">
              <span class="detail-label">Group ID</span>
              <span class="detail-value">{{ tab.groupId }}</span>
            </template>
          </div>
        </div>
      </div>
      
      <div class="tab-content" v-else>
        <h4 class="tab-title">{{ tab.title }}</h4>
        <a
          :href="tab.url"
          target="_blank"
          class="tab-url"
          @click.stop
        >
          {{ formatUrl(tab.url) }}
        </a>
        <div v-if="tab.lastAccessed" class="tab-meta">
          Last accessed: {{ formatRelativeTime(tab.lastAccessed) }}
        </div>
      </div>

      <div class="tab-actions">
        <button
          v-if="type === 'current' && (!getTabCollection || !getTabCollection(tab.url))"
          @click.stop="$emit('addToCollection', tab)"
          class="tab-action-btn add-to-collection"
          title="Add to collection"
        >
          <PlusIcon class="w-4 h-4" />
        </button>
        <button
          @click.stop="$emit('openTab', tab.url)"
          class="tab-action-btn"
          :title="type === 'current' ? 'Go to tab' : 'Open tab'"
        >
          <ArrowTopRightOnSquareIcon class="w-4 h-4" />
        </button>
        <button
          v-if="type === 'collection'"
          @click.stop="$emit('removeTab', tab.id)"
          class="tab-action-btn danger"
          title="Remove from collection"
        >
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="tabs.length === 0" class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">
        {{ emptyTitle }}
      </h3>
      <p class="empty-description">
        {{ emptyDescription }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { PlusIcon, ArrowTopRightOnSquareIcon, XMarkIcon, ChevronDownIcon } from '@heroicons/vue/24/outline';
import type { Collection, Tab } from '../types';

interface Props {
  tabs: Tab[];
  selectedTabs: string[];
  collections?: Collection[];
  type: 'current' | 'collection';
  searchQuery?: string;
  getTabCollection?: (url: string) => Collection | undefined;
  viewMode?: 'list' | 'grid';
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'list'
});

const expandedTabs = ref<string[]>([]);

const toggleTabDetails = (tabId: string) => {
  const index = expandedTabs.value.indexOf(tabId);
  if (index > -1) {
    expandedTabs.value.splice(index, 1);
  } else {
    expandedTabs.value.push(tabId);
  }
};

const formatUrl = (url: string, maxLength: number = 30) => {
  try {
    const urlObj = new URL(url);
    let formattedUrl = (urlObj.hostname + urlObj.pathname).replace(/\/$/, "");
    if (formattedUrl.length > maxLength) {
      return formattedUrl.substring(0, maxLength) + '...';
    }
    return formattedUrl;
  } catch {
    if (url.length > maxLength) {
      return url.substring(0, maxLength) + '...';
    }
    return url;
  }
};

const formatRelativeTime = (date: Date | string) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diff = now.getTime() - targetDate.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

const emptyTitle = computed(() => {
  if (props.type === 'current') {
    return props.searchQuery ? 'No matching tabs' : 'No current tabs';
  }
  return props.searchQuery ? 'No matching tabs' : 'No tabs in this collection';
});

const emptyDescription = computed(() => {
  if (props.type === 'current') {
    return props.searchQuery ? 'Try adjusting your search query.' : 'Open some tabs to see them here.';
  }
  return props.searchQuery ? 'Try adjusting your search query.' : 'Add some tabs to get started.';
});
</script>

<style scoped>
.tabs-grid {
  display: grid;
  gap: 1rem;
  overflow-y: auto;
  padding: 0.5rem;
  grid-template-columns: 1fr;
}

.tabs-grid.grid-view {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.tab-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1rem;
  transition: all 0.2s;
  cursor: pointer;
}

.tab-card:hover {
  background: var(--card-hover);
  border-color: var(--primary-color);
}

.tab-card.selected {
  background: var(--primary-bg);
  border-color: var(--primary-color);
}

.current-tab {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: default;
}

.tab-card:not(.current-tab) {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.tab-selection {
  flex-shrink: 0;
  padding-top: 0.125rem;
}

.tab-checkbox {
  cursor: pointer;
}

.tab-favicon {
  position: relative;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favicon-img {
  width: 1rem;
  height: 1rem;
  border-radius: 0.25rem;
}

.favicon-placeholder {
  font-size: 1rem;
}

.tab-title-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}

.tab-details-toggle {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab-details-toggle:hover {
  background: var(--card-hover);
  color: var(--text-primary);
}

.tab-details-toggle .w-4 {
  transition: transform 0.2s;
}

.tab-details-toggle .rotate-180 {
  transform: rotate(180deg);
}

.tab-details {
  border-radius: 0.5rem;
  padding: 0.875rem;
  margin-top: 0.75rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: 1rem;
  row-gap: 0.625rem;
  align-items: baseline;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.8125rem;
  white-space: nowrap;
  text-align: left;
}

.detail-value {
  color: var(--text-primary);
  font-size: 0.8125rem;
  word-break: break-word;
}

.detail-value.tab-url {
  font-weight: 500;
  word-break: break-all;
}

.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.status-pill {
  padding: 0.25rem 0.625rem;
  white-space: nowrap;
}

.collection-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.collection-color-small {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.collection-name {
  font-weight: 500;
}

.not-in-collection {
  color: var(--text-secondary);
  font-style: italic;
}

.tab-quick-info {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.quick-info-item {
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.collection-quick {
  background: var(--primary-bg);
  color: var(--primary-color);
}

.pinned-quick {
  background: var(--warning-color);
  color: white;
}

.active-quick {
  background: var(--success-color);
  color: white;
}

.tab-info {
  flex: 1;
  min-width: 0;
}

.tab-content {
  flex: 1;
  min-width: 0;
}

.tab-title {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  line-height: 1.4;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tab-url {
  font-size: 0.75rem;
  color: var(--primary-color);
  text-decoration: none;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.25rem;
}

.tab-url:hover {
  text-decoration: underline;
}

.tab-meta {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.tab-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s;
  padding-top: 0.25rem;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-action-btn:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.tab-action-btn.add-to-collection {
  background: var(--primary-color);
  color: white;
}

.tab-action-btn.add-to-collection:hover {
  background: var(--primary-hover);
}

.tab-action-btn.danger:hover {
  background: var(--error-color);
  color: white;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-description {
  color: var(--text-secondary);
  margin: 0;
}
</style> 