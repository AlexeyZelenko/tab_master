<template>
  <div :class="['app', theme]">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner">⏳</div>
      <div class="loading-text">Loading Keep Tabs...</div>
    </div>

    <!-- Main app -->
    <div v-else-if="tabManager" class="app-layout">
      <Sidebar
        :state="tabManager.state"
        :filteredCollections="tabManager.filteredCollections"
        :totalTabs="tabManager.totalTabs"
        :createCollection="tabManager.createCollection"
        :deleteCollection="tabManager.deleteCollection"
        :saveCurrentTabsAsCollection="tabManager.saveCurrentTabsAsCollection"
        :restoreCollection="tabManager.restoreCollection"
        :exportCollections="tabManager.exportCollections"
        :importCollections="tabManager.importCollections"
        @selectCollection="handleSelectCollection"
        @toggleTheme="toggleTheme"
        @openSettings="openSettings"
        @openSaveDialog="showSaveDialog = true"
        @openCreateDialog="showCreateDialog = true"
      />
      
      <MainContent
        :selectedCollection="selectedCollection"
        :showingCurrentTabs="showingCurrentTabs"
        :collections="tabManager.state.collections"
        :totalTabs="tabManager.totalTabs"
        :currentTabs="tabManager.state.currentTabs"
        @updateCollection="tabManager.updateCollection"
        @deleteCollection="tabManager.deleteCollection"
        @restoreCollection="tabManager.restoreCollection"
        @removeTabFromCollection="tabManager.removeTabFromCollection"
        @createCollection="showCreateDialog = true"
        @saveCurrentTabs="showSaveDialog = true"
        @addTabToCollection="handleAddTabToCollection"
      />
    </div>

    <!-- Error state -->
    <div v-else class="error-container">
      <div class="error-icon">❌</div>
      <div class="error-text">Failed to initialize Keep Tabs</div>
    </div>

    <!-- Settings Dialog -->
    <div v-if="showSettingsDialog" class="dialog-overlay" @click="showSettingsDialog = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog-title">Settings</h3>
        <div class="settings-group">
          <h4 class="settings-subtitle">AI Suggestions</h4>
          <div class="setting-item">
            <label for="ai-enabled">Enable AI Features</label>
            <input type="checkbox" id="ai-enabled" v-model="isAiEnabled" />
          </div>
          <p class="setting-description">
            Allows the extension to suggest a name and description for new collections using AI. Requires an OpenAI API key.
            <a href="#" @click.prevent="openAiGuide" class="guide-link">How does this work?</a>
          </p>
          <div class="setting-item" v-if="isAiEnabled">
            <label for="api-key">OpenAI API Key</label>
            <input
              v-model="apiKey"
              id="api-key"
              type="password"
              placeholder="sk-..."
              class="dialog-input"
            />
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="closeSettings" class="dialog-btn dialog-btn-secondary">
            Cancel
          </button>
          <button @click="saveSettings" class="dialog-btn dialog-btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>

    <!-- AI Guide Page -->
    <AiGuide v-if="showAiGuide" @close="showAiGuide = false" />

    <!-- Global Create Collection Dialog -->
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

    <!-- Global Save Current Tabs Dialog -->
    <div v-if="showSaveDialog" class="dialog-overlay" @click="showSaveDialog = false">
      <div class="dialog" @click.stop>
        <h3 class="dialog-title">Save Current Tabs</h3>
        <div class="ai-suggestion-section" v-if="isAiFeatureAvailable">
          <button @click="fetchAiSuggestion" :disabled="isAiLoading" class="dialog-btn dialog-btn-ai">
            <span v-if="isAiLoading">✨ Thinking...</span>
            <span v-else>✨ Suggest with AI</span>
          </button>
        </div>
        <div class="ai-hint" v-else>
          <p>
            <span class="ai-icon">✨</span>
            Want AI to suggest names and descriptions?
            <button @click="openSettings" class="link-button">Enable AI features</button>
            in settings.
          </p>
        </div>
        <input
          v-model="saveCollectionName"
          type="text"
          placeholder="Collection name"
          class="dialog-input"
          @keyup.enter="saveCurrentTabs"
        />
        <textarea
          v-model="saveCollectionDescription"
          placeholder="Description (optional)"
          class="dialog-textarea"
        ></textarea>
        <div class="dialog-actions">
          <button @click="showSaveDialog = false" class="dialog-btn dialog-btn-secondary">
            Cancel
          </button>
          <button @click="saveCurrentTabs" class="dialog-btn dialog-btn-primary">
            Save {{ tabManager?.state?.currentTabs?.length || 0 }} tabs
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import Sidebar from './components/Sidebar.vue';
import MainContent from './components/MainContent.vue';
import AiGuide from './components/AiGuide.vue';
import type { Collection, TabGroupSelection } from './types';

// Reactive state
const isLoading = ref(true);
const tabManager = ref<any>(null);
const selectedCollection = ref<Collection | TabGroupSelection | null>(null);
const showingCurrentTabs = ref(false);

const showCreateDialog = ref(false);
const showSaveDialog = ref(false);
const newCollectionName = ref('');
const newCollectionDescription = ref('');
const saveCollectionName = ref('');
const saveCollectionDescription = ref('');
const showSettingsDialog = ref(false);
const apiKey = ref('');
const isAiEnabled = ref(false);
const isAiLoading = ref(false);
const showAiGuide = ref(false);

// Async initialization function
async function initializeTabManager() {
  const isExtensionEnvironment = typeof chrome !== 'undefined' && chrome.storage;
  console.log('Environment check:', { isExtensionEnvironment, chrome: typeof chrome });
  
  if (isExtensionEnvironment) {
    console.log('Loading Chrome tab manager...');
    const { useChromeTabManager } = await import('./composables/useChromeTabManager');
    const manager = await useChromeTabManager();
    console.log('Chrome tab manager loaded:', manager);
    return manager;
  } else {
    console.log('Loading mock tab manager...');
    const { useTabManager } = await import('./composables/useTabManager');
    const manager = useTabManager();
    console.log('Mock tab manager loaded:', manager);
    return manager;
  }
}

// Initialize on mount
onMounted(async () => {
  console.log('App mounted, initializing tab manager...');
  try {
    tabManager.value = await initializeTabManager();
    console.log('TabManager state:', tabManager.value.state);
    
    // Синхронизируем selectedCollection с состоянием tabManager
    watch(() => tabManager.value?.state?.selectedCollection, (newSelectedCollection) => {
      selectedCollection.value = newSelectedCollection;
      if (!newSelectedCollection) {
        showingCurrentTabs.value = true;
      } else {
        showingCurrentTabs.value = false;
      }
    }, { immediate: true });
    
    isLoading.value = false;
  } catch (error) {
    console.error('Failed to initialize tab manager:', error);
    isLoading.value = false;
  }
});

// Computed properties
const theme = computed(() => tabManager.value?.state?.theme || 'light');
const isAiFeatureAvailable = computed(() => {
  const available = tabManager.value?.state.isAiEnabled && tabManager.value?.state.apiKey;
  console.log('AI feature availability check:', {
    isAiEnabled: tabManager.value?.state.isAiEnabled,
    hasApiKey: !!tabManager.value?.state.apiKey,
    isAvailable: available
  });
  return available;
});

const handleSelectCollection = (collection: Collection | TabGroupSelection | null) => {
  console.log('handleSelectCollection called with:', collection);
  
  // Handle tab group selection
  if (collection && typeof collection === 'object' && 'type' in collection && collection.type === 'tabGroup') {
    console.log('Tab group selected:', collection);
    showingCurrentTabs.value = false;
    
    // Create proper TabGroupSelection object
    const tabGroupSelection: TabGroupSelection = {
      type: 'tabGroup',
      data: (collection as any).data,
      isTabGroup: true
    };
    
    selectedCollection.value = tabGroupSelection;
    
    if (tabManager.value) {
      tabManager.value.state.selectedCollection = tabGroupSelection;
    }
    return;
  }

  // Handle regular collection or null selection
  if (collection === null) {
    // This means we're switching to show current tabs
    showingCurrentTabs.value = true;
    selectedCollection.value = null;
  } else {
    showingCurrentTabs.value = false;
    selectedCollection.value = collection as Collection;
  }
  
  if (tabManager.value) {
    tabManager.value.state.selectedCollection = collection;
  }
};

const toggleTheme = () => {
  if (tabManager.value) {
    tabManager.value.state.theme = tabManager.value.state.theme === 'dark' ? 'light' : 'dark';
  }
};

const createNewCollection = () => {
  if (newCollectionName.value.trim() && tabManager.value) {
    const collection = tabManager.value.createCollection(
      newCollectionName.value.trim(), 
      newCollectionDescription.value.trim() || undefined
    );
    selectedCollection.value = collection;
    tabManager.value.state.selectedCollection = collection;
    newCollectionName.value = '';
    newCollectionDescription.value = '';
    showCreateDialog.value = false;
  }
};

const saveCurrentTabs = async () => {
  if (saveCollectionName.value.trim() && tabManager.value) {
    const collection = await tabManager.value.saveCurrentTabsAsCollection(
      saveCollectionName.value.trim(), 
      saveCollectionDescription.value.trim() || undefined
    );
    selectedCollection.value = collection;
    tabManager.value.state.selectedCollection = collection;
    saveCollectionName.value = '';
    saveCollectionDescription.value = '';
    showSaveDialog.value = false;
  }
};

const handleAddTabToCollection = (collectionId: string, tab: any) => {
  if (tabManager.value) {
    // Создаем новую вкладку для коллекции
    const newTab = {
      id: Date.now().toString(),
      title: tab.title,
      url: tab.url,
      favicon: tab.favicon,
      lastAccessed: new Date()
    };
    
    // Используем метод из tabManager для добавления вкладки
    tabManager.value.addTabToCollection(collectionId, newTab);
    
    const collection = tabManager.value.state.collections.find((c: Collection) => c.id === collectionId);
    console.log(`Tab "${tab.title}" added to collection "${collection?.name}"`);
  }
};

const openSettings = () => {
  if (tabManager.value) {
    apiKey.value = tabManager.value.state.apiKey;
    isAiEnabled.value = tabManager.value.state.isAiEnabled;
    console.log('Opening settings:', {
      apiKey: !!tabManager.value.state.apiKey,
      isAiEnabled: tabManager.value.state.isAiEnabled
    });
  }
  showSettingsDialog.value = true;
};

const closeSettings = () => {
  showSettingsDialog.value = false;
};

const saveSettings = () => {
  if (tabManager.value) {
    tabManager.value.state.apiKey = apiKey.value;
    tabManager.value.state.isAiEnabled = isAiEnabled.value;
    console.log('Saving settings:', {
      apiKey: !!tabManager.value.state.apiKey,
      isAiEnabled: tabManager.value.state.isAiEnabled
    });
  }
  showSettingsDialog.value = false;
};

const fetchAiSuggestion = async () => {
  if (!tabManager.value) return;
  isAiLoading.value = true;
  try {
    const suggestion = await tabManager.value.getAiSuggestion();
    saveCollectionName.value = suggestion.name;
    saveCollectionDescription.value = suggestion.description;
  } catch (error) {
    console.error(error);
    // Optionally, show an error to the user
    alert((error as Error).message);
  } finally {
    isAiLoading.value = false;
  }
};

const openAiGuide = () => {
  showSettingsDialog.value = false;
  showAiGuide.value = true;
};

// Watch for settings changes to sync with the state
watch(showSettingsDialog, (isShowing) => {
  if (isShowing && tabManager.value) {
    apiKey.value = tabManager.value.state.apiKey;
    isAiEnabled.value = tabManager.value.state.isAiEnabled;
  }
});
</script>

<style>
/* CSS Variables for theming */
:root {
  /* Light theme */
  --primary-color: #3B82F6;
  --primary-hover: #2563EB;
  --primary-bg: rgba(59, 130, 246, 0.1);
  --secondary-color: #8B5CF6;
  --success-color: #10B981;
  --warning-color: #F59E0B;
  --error-color: #EF4444;
  --error-hover: #DC2626;
  
  --text-primary: #1F2937;
  --text-secondary: #6B7280;
  
  --main-bg: #F9FAFB;
  --sidebar-bg: #FFFFFF;
  --card-bg: #FFFFFF;
  --card-hover: #F3F4F6;
  --input-bg: #FFFFFF;
  
  --button-secondary-bg: #F3F4F6;
  --button-secondary-hover: #E5E7EB;
  
  --border-color: #E5E7EB;
  
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  
  color-scheme: light;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Dark theme */
.dark {
  --text-primary: #F9FAFB;
  --text-secondary: #9CA3AF;
  
  --main-bg: #0F172A;
  --sidebar-bg: #1E293B;
  --card-bg: #1E293B;
  --card-hover: #334155;
  --input-bg: #334155;
  
  --button-secondary-bg: #334155;
  --button-secondary-hover: #475569;
  
  --border-color: #334155;
  
  color-scheme: dark;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: var(--main-bg);
  color: var(--text-primary);
  overflow: hidden;
}

.app {
  height: 100vh;
  background: var(--main-bg);
  transition: all 0.2s ease;
}

.app-layout {
  display: flex;
  height: 100vh;
}

/* Dialog styles */
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
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: 90%;
  max-width: 400px;
  border: 1px solid var(--border-color);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
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
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
  font-family: inherit;
}

.dialog-textarea {
  min-height: 80px;
  resize: vertical;
}

.dialog-input:focus,
.dialog-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.dialog-btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.dialog-btn-secondary {
  background: var(--button-secondary-bg);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
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

/* Scrollbar styles */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--card-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

/* Animation classes */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Responsive design for popup */
@media (max-width: 450px) {
  .app-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100% !important;
    height: auto;
    max-height: 40vh;
  }
  
  .main-content {
    height: 60vh;
  }
}

/* Utility classes */
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }

/* Loading and error states */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.loading-spinner,
.error-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.loading-text,
.error-text {
  font-size: 1.25rem;
  color: var(--text-secondary);
}

.loading-spinner {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.settings-group {
  margin-bottom: 20px;
}
.settings-subtitle {
  margin-bottom: 10px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 5px;
}
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.setting-description {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: -5px;
  margin-bottom: 15px;
}

.dialog-btn-ai {
  background-color: #5a3ab3; /* A nice purple for AI */
  color: white;
  width: 100%;
  margin-bottom: 15px;
}
.dialog-btn-ai:hover {
  background-color: #4a2e9a;
}

.guide-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.8rem;
}
.guide-link:hover {
  text-decoration: underline;
}

.ai-hint {
  background: var(--primary-bg);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
}

.ai-hint p {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ai-icon {
  font-size: 1.25rem;
}

.link-button {
  background: none;
  border: none;
  color: var(--primary-color);
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
}

.link-button:hover {
  color: var(--primary-hover);
}
</style>