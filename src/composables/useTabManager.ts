import { ref, computed, watch } from 'vue';
import type { Tab, Collection, AppState, TabGroupSelection } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'keep-tabs-data';

export function useTabManager() {
  const state = ref<AppState>({
    collections: [],
    currentTabs: [],
    tabGroups: [],
    searchQuery: '',
    selectedCollection: null as Collection | TabGroupSelection | null,
    theme: 'dark',
    autoSave: true,
    apiKey: '',
    isAiEnabled: false
  });

  // Load data from localStorage
  const loadData = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        state.value = {
          ...state.value,
          ...data,
          collections: data.collections.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt)
          }))
        };
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // Save data to localStorage
  const saveData = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Watch for changes and auto-save
  watch(state, saveData, { deep: true });

  // Initialize mock current tabs
  const initializeMockTabs = () => {
    if (state.value.currentTabs.length === 0) {
      state.value.currentTabs = [
        {
          id: uuidv4(),
          title: 'Keep Tabs - Tab Manager',
          url: 'https://localhost:5173',
          active: true,
          lastAccessed: new Date()
        },
        {
          id: uuidv4(),
          title: 'Vue.js Documentation',
          url: 'https://vuejs.org/guide/',
          lastAccessed: new Date()
        },
        {
          id: uuidv4(),
          title: 'GitHub - Vue',
          url: 'https://github.com/vuejs/vue',
          lastAccessed: new Date()
        }
      ];
    }
  };

  // Initialize sample collections
  const initializeSampleCollections = () => {
    if (state.value.collections.length === 0) {
      state.value.collections = [
        {
          id: uuidv4(),
          name: 'Hiking',
          description: 'Best hiking trails and gear',
          category: 'Outdoor',
          tags: ['nature', 'trails', 'gear'],
          color: '#10B981',
          createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
          tabs: [
            {
              id: uuidv4(),
              title: 'List of trails in Canada',
              url: 'https://www.alltrails.com/canada',
              lastAccessed: new Date()
            },
            {
              id: uuidv4(),
              title: 'Discover 8 of Canada\'s Most Scenic Hiking Trails',
              url: 'https://www.explore.com/canada-hiking-trails',
              lastAccessed: new Date()
            },
            {
              id: uuidv4(),
              title: 'Top 10 hikes in the Canadian Rockies',
              url: 'https://www.canadianrockies.net/hiking',
              lastAccessed: new Date()
            }
          ]
        },
        {
          id: uuidv4(),
          name: 'Camping',
          description: 'Camping gear and locations',
          category: 'Outdoor',
          tags: ['camping', 'gear', 'outdoors'],
          color: '#F97316',
          createdAt: new Date(Date.now() - 5 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 60 * 1000),
          tabs: [
            {
              id: uuidv4(),
              title: 'Best Camping Gear 2024',
              url: 'https://www.outdoorgearlab.com/camping',
              lastAccessed: new Date()
            },
            {
              id: uuidv4(),
              title: 'National Parks Camping',
              url: 'https://www.nps.gov/camping',
              lastAccessed: new Date()
            }
          ]
        },
        {
          id: uuidv4(),
          name: 'Music',
          description: 'Music production and theory',
          category: 'Creative',
          tags: ['music', 'production', 'theory'],
          color: '#8B5CF6',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          tabs: [
            {
              id: uuidv4(),
              title: 'Music Theory Fundamentals',
              url: 'https://musictheory.net',
              lastAccessed: new Date()
            },
            {
              id: uuidv4(),
              title: 'Ableton Live Tutorials',
              url: 'https://www.ableton.com/tutorials',
              lastAccessed: new Date()
            }
          ]
        }
      ];
    }
  };

  // Computed properties
  const filteredCollections = computed(() => {
    if (!state.value.searchQuery) return state.value.collections;
    
    const query = state.value.searchQuery.toLowerCase();
    return state.value.collections.filter(collection =>
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query) ||
      collection.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      collection.tabs.some(tab => 
        tab.title.toLowerCase().includes(query) ||
        tab.url.toLowerCase().includes(query)
      )
    );
  });

  const totalTabs = computed(() => 
    state.value.collections.reduce((sum, collection) => sum + collection.tabs.length, 0)
  );

  // Collection methods
  const createCollection = (name: string, description?: string, tabs?: Tab[]) => {
    const collection: Collection = {
      id: uuidv4(),
      name,
      description,
      tabs: tabs || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      color: '#3B82F6'
    };
    
    state.value.collections.unshift(collection);
    return collection;
  };

  const updateCollection = (id: string, updates: Partial<Collection>) => {
    const index = state.value.collections.findIndex(c => c.id === id);
    if (index !== -1) {
      state.value.collections[index] = {
        ...state.value.collections[index],
        ...updates,
        updatedAt: new Date()
      };
    }
  };

  const deleteCollection = (id: string) => {
    const index = state.value.collections.findIndex(c => c.id === id);
    if (index !== -1) {
      state.value.collections.splice(index, 1);
      if (state.value.selectedCollection && 'id' in state.value.selectedCollection && state.value.selectedCollection.id === id) {
        state.value.selectedCollection = null;
      }
    }
  };

  const saveCurrentTabsAsCollection = (name: string, description?: string) => {
    return createCollection(name, description, [...state.value.currentTabs]);
  };

  const restoreCollection = (collection: Collection) => {
    // In a real browser extension, this would open the tabs
    console.log('Restoring collection:', collection.name);
    state.value.currentTabs = [...collection.tabs];
  };

  // Tab methods
  const addTabToCollection = (collectionId: string, tab: Tab) => {
    const collection = state.value.collections.find(c => c.id === collectionId);
    if (collection) {
      collection.tabs.push(tab);
      collection.updatedAt = new Date();
    }
  };

  const removeTabFromCollection = (collectionId: string, tabId: string) => {
    const collection = state.value.collections.find(c => c.id === collectionId);
    if (collection) {
      const index = collection.tabs.findIndex(t => t.id === tabId);
      if (index !== -1) {
        collection.tabs.splice(index, 1);
        collection.updatedAt = new Date();
        console.log(`Tab removed from collection ${collection.name}, saving data...`);
        saveData();
      }
    }
  };

  const closeTab = (tabId: string) => {
    const index = state.value.currentTabs.findIndex(t => t.id === tabId);
    if (index !== -1) {
      state.value.currentTabs.splice(index, 1);
    }
  };

  // Export/Import
  const exportCollections = () => {
    const data = {
      collections: state.value.collections,
      exportDate: new Date(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keep-tabs-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCollections = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.collections && Array.isArray(data.collections)) {
            data.collections.forEach((collection: any) => {
              state.value.collections.push({
                ...collection,
                id: uuidv4(), // Generate new ID to avoid conflicts
                createdAt: new Date(collection.createdAt),
                updatedAt: new Date(collection.updatedAt)
              });
            });
            resolve();
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  // Initialize data
  loadData();
  initializeMockTabs();
  initializeSampleCollections();

  return {
    state,
    filteredCollections,
    totalTabs,
    createCollection,
    updateCollection,
    deleteCollection,
    saveCurrentTabsAsCollection,
    restoreCollection,
    addTabToCollection,
    removeTabFromCollection,
    closeTab,
    exportCollections,
    importCollections
  };
}