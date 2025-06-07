<template>
  <div class="main-content">
    <!-- Welcome View -->
    <WelcomeView
      v-if="!selectedCollection && !showingCurrentTabs"
      :collections="collections"
      :totalTabs="totalTabs"
      :currentTabs="currentTabs"
      @createCollection="$emit('createCollection')"
      @saveCurrentTabs="$emit('saveCurrentTabs')"
    />

    <!-- Tab Group View -->
    <TabGroupView
      v-else-if="selectedCollection && 'isTabGroup' in selectedCollection"
      :tabGroup="(selectedCollection as TabGroupSelection).data"
      :collections="collections"
      @saveAsCollection="saveTabGroupAsCollection"
      @addTabToCollection="handleAddTabToCollection"
      @createCollection="$emit('createCollection')"
    />

    <!-- Current Tabs View -->
    <CurrentTabsView
      v-else-if="showingCurrentTabs"
      :currentTabs="currentTabs"
      :collections="collections"
      @saveCurrentTabs="$emit('saveCurrentTabs')"
      @createCollection="$emit('createCollection')"
      @addTabToCollection="handleAddTabToCollection"
    />

    <!-- Collection View -->
    <div v-else-if="selectedCollection" class="collection-view">
      <!-- Collection Header -->
      <div class="collection-header">
        <div class="collection-title-section">
          <div
            class="collection-color-large"
            :style="{ backgroundColor: selectedCollection.color || '#3B82F6' }"
          ></div>
          <div class="collection-info">
            <h1 class="collection-title">{{ selectedCollection.name }}</h1>
            <p v-if="selectedCollection.description" class="collection-description">
              {{ selectedCollection.description }}
            </p>
            <div class="collection-meta">
              <span class="meta-item">
                {{ selectedCollection.tabs.length }} tabs
              </span>
              <span class="meta-separator">•</span>
              <span class="meta-item">
                Updated {{ formatRelativeTime(selectedCollection.updatedAt) }}
              </span>
              <span v-if="selectedCollection.category" class="meta-separator">•</span>
              <span v-if="selectedCollection.category" class="meta-item">
                {{ selectedCollection.category }}
              </span>
            </div>
          </div>
        </div>

        <div class="collection-actions">
          <button
            @click="restoreCollection(selectedCollection)"
            class="action-btn primary"
            title="Restore all tabs"
          >
            <ArrowTopRightOnSquareIcon class="w-5 h-5" />
            Restore Tabs
          </button>
          <button
            @click="editingCollection = !editingCollection"
            class="action-btn secondary"
            title="Edit collection"
          >
            <PencilIcon class="w-5 h-5" />
            Edit
          </button>
          <button
            @click="showDeleteConfirm = true"
            class="action-btn danger"
            title="Delete collection"
          >
            <TrashIcon class="w-5 h-5" />
            Delete
          </button>
        </div>
      </div>

      <!-- Edit Collection Form -->
      <div v-if="editingCollection" class="edit-form">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input
            v-model="editForm.name"
            type="text"
            class="form-input"
            placeholder="Collection name"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea
            v-model="editForm.description"
            class="form-textarea"
            placeholder="Collection description"
          ></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <input
            v-model="editForm.category"
            type="text"
            class="form-input"
            placeholder="Category (optional)"
          />
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div class="color-picker">
            <div
              v-for="color in colorOptions"
              :key="color"
              :class="['color-option', { selected: editForm.color === color }]"
              :style="{ backgroundColor: color }"
              @click="editForm.color = color"
            ></div>
          </div>
        </div>
        <div class="form-actions">
          <button @click="cancelEdit" class="action-btn secondary">Cancel</button>
          <button @click="saveEdit" class="action-btn primary">Save Changes</button>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="selectedCollection.tags && selectedCollection.tags.length > 0" class="tags-section">
        <div class="tags-list">
          <span
            v-for="tag in selectedCollection.tags"
            :key="tag"
            class="tag"
          >
            #{{ tag }}
          </span>
        </div>
      </div>

      <!-- Tab Search -->
      <TabSearch 
        v-model="tabSearchQuery"
        placeholder="Search tabs in this collection..."
      />

      <!-- Tabs List -->
      <div class="tabs-list">
        <div class="tabs-header">
          <h3 class="tabs-title">
            Tabs ({{ filteredTabs.length }}{{ filteredTabs.length !== selectedCollection.tabs.length ? ' of ' + selectedCollection.tabs.length : '' }})
          </h3>
          <div class="tabs-actions">
            <div class="view-mode-toggle">
              <button 
                @click="viewMode = 'list'" 
                :class="['view-mode-btn', { active: viewMode === 'list' }]" 
                title="List view"
              >
                <QueueListIcon class="w-5 h-5" />
              </button>
              <button 
                @click="viewMode = 'grid'" 
                :class="['view-mode-btn', { active: viewMode === 'grid' }]" 
                title="Grid view"
              >
                <Squares2X2Icon class="w-5 h-5" />
              </button>
            </div>
            <button @click="selectAllTabs" class="action-btn small">
              {{ selectedTabs.length === filteredTabs.length ? 'Deselect All' : 'Select All' }}
            </button>
            <button
              v-if="selectedTabs.length > 0"
              @click="deleteSelectedTabs"
              class="action-btn small danger"
            >
              Delete Selected ({{ selectedTabs.length }})
            </button>
          </div>
        </div>

        <TabGrid
          :tabs="filteredTabs"
          :selectedTabs="selectedTabs"
          :collections="collections"
          :searchQuery="tabSearchQuery"
          type="collection"
          :view-mode="viewMode"
          @toggleSelection="toggleTabSelection"
          @openTab="openTab"
          @removeTab="removeTab"
        />
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <div v-if="showDeleteConfirm" class="dialog-overlay" @click="showDeleteConfirm = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog-title">Delete Collection</h3>
        <p class="dialog-text">
          Are you sure you want to delete "{{ selectedCollection && !('isTabGroup' in selectedCollection) ? selectedCollection.name : 'this item' }}"? This action cannot be undone.
        </p>
        <div class="dialog-actions">
          <button @click="showDeleteConfirm = false" class="action-btn secondary">
            Cancel
          </button>
          <button @click="confirmDelete" class="action-btn danger">
            Delete Collection
          </button>
        </div>
      </div>
    </div>

    <!-- Create Collection Dialog -->
    <CreateCollectionDialog
      v-if="showCreateCollectionDialog"
      @close="showCreateCollectionDialog = false"
      @create="createCollection"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ArrowTopRightOnSquareIcon,
  PencilIcon,
  TrashIcon,
  QueueListIcon,
  Squares2X2Icon
} from '@heroicons/vue/24/outline';
import type { Collection, Tab, TabGroupSelection } from '../types';
import WelcomeView from './WelcomeView.vue';
import CurrentTabsView from './CurrentTabsView.vue';
import TabGroupView from './TabGroupView.vue';
import TabSearch from './TabSearch.vue';
import TabGrid from './TabGrid.vue';
import CreateCollectionDialog from './CreateCollectionDialog.vue';

interface Props {
  selectedCollection: Collection | TabGroupSelection | null;
  showingCurrentTabs: boolean;
  collections: Collection[];
  currentTabs: Tab[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  updateCollection: [collection: Collection];
  deleteCollection: [id: string];
  restoreCollection: [collection: Collection];
  addTabToCollection: [collectionId: string, tab: Tab];
  removeTabFromCollection: [collectionId: string, tabId: string];
  createCollection: [];
  saveCurrentTabs: [];
}>();

const tabSearchQuery = ref('');
const selectedTabs = ref<string[]>([]);
const viewMode = ref<'list' | 'grid'>('list');
const editingCollection = ref(false);
const showDeleteConfirm = ref(false);
const showCreateCollectionDialog = ref(false);
const editForm = ref({
  name: '',
  description: '',
  category: '',
  color: '#3B82F6'
});

const colorOptions = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#F97316', '#06B6D4', '#EC4899', '#84CC16', '#6B7280'
];

// Computed properties
const totalTabs = computed(() => {
  return props.collections.reduce((total, collection) => total + collection.tabs.length, 0);
});

const filteredTabs = computed(() => {
  if (!props.selectedCollection || 'isTabGroup' in props.selectedCollection) return [];
  
  const collection = props.selectedCollection as Collection;
  if (!tabSearchQuery.value) return collection.tabs;
  
  const query = tabSearchQuery.value.toLowerCase();
  return collection.tabs.filter(tab =>
    tab.title.toLowerCase().includes(query) ||
    tab.url.toLowerCase().includes(query)
  );
});

// Methods
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

const openTab = (url: string) => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url });
  } else {
    window.open(url, '_blank');
  }
};

const toggleTabSelection = (tabId: string) => {
  const index = selectedTabs.value.indexOf(tabId);
  if (index > -1) {
    selectedTabs.value.splice(index, 1);
  } else {
    selectedTabs.value.push(tabId);
  }
};

const selectAllTabs = () => {
  if (selectedTabs.value.length === filteredTabs.value.length) {
    selectedTabs.value = [];
  } else {
    selectedTabs.value = filteredTabs.value.map(tab => tab.id);
  }
};

const removeTab = (tabId: string) => {
  if (props.selectedCollection && !('isTabGroup' in props.selectedCollection)) {
    emit('removeTabFromCollection', props.selectedCollection.id, tabId);
  }
};

const deleteSelectedTabs = () => {
  if (props.selectedCollection && !('isTabGroup' in props.selectedCollection)) {
    const collection = props.selectedCollection as Collection;
    selectedTabs.value.forEach(tabId => {
      emit('removeTabFromCollection', collection.id, tabId);
    });
    selectedTabs.value = [];
  }
};

const restoreCollection = (collection: Collection) => {
  emit('restoreCollection', collection);
};

const cancelEdit = () => {
  editingCollection.value = false;
  if (props.selectedCollection && !('isTabGroup' in props.selectedCollection)) {
    editForm.value = {
      name: props.selectedCollection.name,
      description: props.selectedCollection.description || '',
      category: props.selectedCollection.category || '',
      color: props.selectedCollection.color || '#3B82F6'
    };
  }
};

const saveEdit = () => {
  if (props.selectedCollection && !('isTabGroup' in props.selectedCollection)) {
    const updatedCollection: Collection = {
      ...props.selectedCollection,
      name: editForm.value.name,
      description: editForm.value.description,
      category: editForm.value.category,
      color: editForm.value.color,
      updatedAt: new Date()
    };
    emit('updateCollection', updatedCollection);
    editingCollection.value = false;
  }
};

const confirmDelete = () => {
  if (props.selectedCollection && !('isTabGroup' in props.selectedCollection)) {
    emit('deleteCollection', props.selectedCollection.id);
    showDeleteConfirm.value = false;
  }
};

const handleAddTabToCollection = (collectionId: string, tab: Tab) => {
  emit('addTabToCollection', collectionId, tab);
};

const saveTabGroupAsCollection = async () => {
  if (props.selectedCollection && 'isTabGroup' in props.selectedCollection) {
    try {
      emit('saveCurrentTabs');
    } catch (error) {
      console.error('Error saving tab group as collection:', error);
    }
  }
};

const createCollection = (data: { name: string; color: string }) => {
  // Implementation would be handled by parent component
  console.log('Create collection:', data);
  showCreateCollectionDialog.value = false;
  emit('createCollection');
};

// Watch for collection changes
watch(() => props.selectedCollection, (newCollection) => {
  console.log('New selectedCollection:', newCollection);
  console.log('showingCurrentTabs:', props.showingCurrentTabs);
  
  if (newCollection && !('isTabGroup' in newCollection)) {
    console.log('Collection selected:', newCollection);
    editForm.value = {
      name: newCollection.name,
      description: newCollection.description || '',
      category: newCollection.category || '',
      color: newCollection.color || '#3B82F6'
    };
  } else if (newCollection && 'isTabGroup' in newCollection) {
    console.log('TabGroup selected:', newCollection);
  } else {
    console.log('No collection selected');
  }
  
  selectedTabs.value = [];
  tabSearchQuery.value = '';
  editingCollection.value = false;
}, { immediate: true });
</script>

<style scoped>
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.collection-view {
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

.action-btn.secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
}

.action-btn.secondary:hover {
  background: var(--button-secondary-hover);
  color: var(--text-primary);
}

.action-btn.danger {
  background: var(--error-color);
  color: white;
}

.action-btn.danger:hover {
  background: var(--error-hover);
}

.action-btn.small {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.edit-form {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-option {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
}

.color-option:hover,
.color-option.selected {
  border-color: var(--text-primary);
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.tags-section {
  margin-bottom: 1.5rem;
}

.tags-list {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.25rem 0.5rem;
  background: var(--primary-bg);
  color: var(--primary-color);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
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

.tabs-actions {
  display: flex;
  gap: 0.5rem;
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

.dialog-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.view-mode-toggle {
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border-radius: 0.375rem;
  padding: 0.125rem;
  margin-right: 0.5rem;
}

.view-mode-btn {
  background: transparent;
  border: none;
  padding: 0.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.view-mode-btn:hover {
  color: var(--text-primary);
}

.view-mode-btn.active {
  background: var(--card-bg);
  color: var(--primary-color);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
</style>