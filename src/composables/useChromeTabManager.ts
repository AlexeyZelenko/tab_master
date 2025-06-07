import { ref, computed, watch, toRaw } from 'vue';
import type { Tab, Collection, AppState, TabGroup, TabGroupSelection } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'keep-tabs-data';

export async function useChromeTabManager() {
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

  // Load data from chrome.storage
  const loadData = async () => {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      console.log('Raw data from storage:', result[STORAGE_KEY]);
      
      if (result[STORAGE_KEY]) {
        const data = result[STORAGE_KEY];
        state.value = {
          ...state.value,
          ...data,
          collections: Array.isArray(data.collections) ? data.collections.map((c: any) => ({
            ...c,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
            tabs: c.tabs || [] // Ensure tabs array exists
          })) : [],
          apiKey: data.apiKey || '',
          isAiEnabled: data.isAiEnabled || false,
        };
        console.log('State after loading data:', {
          apiKey: !!state.value.apiKey,
          isAiEnabled: state.value.isAiEnabled
        });
      }
      
      // Load current tabs from chrome.storage
      const tabsResult = await chrome.storage.local.get(['currentTabs']);
      
      if (tabsResult.currentTabs) {
        state.value.currentTabs = tabsResult.currentTabs;
      } else {
        await loadCurrentTabs();
      }
      
      console.log('Data loaded:', {
        apiKey: !!state.value.apiKey,
        isAiEnabled: state.value.isAiEnabled,
        collections: state.value.collections.length
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      state.value.collections = [];
    }
  };

  // Save data to chrome.storage
  const saveData = async () => {
    try {
      // Используем toRaw для преобразования reactive объектов в обычные
      const rawData = toRaw(state.value);
      console.log('Saving data to chrome.storage:', {
        apiKey: !!rawData.apiKey,
        isAiEnabled: rawData.isAiEnabled,
        collections: rawData.collections.length
      });
      await chrome.storage.local.set({ [STORAGE_KEY]: rawData });
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  // Load current tabs from Chrome API
  const loadCurrentTabs = async () => {
    try {
      const tabs = await chrome.tabs.query({});
      state.value.currentTabs = tabs.map(tab => ({
        id: tab.id?.toString() || uuidv4(),
        title: tab.title || 'Untitled',
        url: tab.url || '',
        favicon: tab.favIconUrl,
        pinned: tab.pinned,
        active: tab.active,
        groupId: tab.groupId && tab.groupId !== -1 ? tab.groupId : undefined,
        lastAccessed: new Date()
      }));
    } catch (error) {
      console.error('Failed to load current tabs:', error);
    }
  };

  // Load tab groups from Chrome API
  const loadTabGroups = async () => {
    try {
      console.log('Starting to load tab groups...');
      
      if (!chrome.tabGroups) {
        console.warn('chrome.tabGroups API not available');
        return;
      }
      
      const groups = await chrome.tabGroups.query({});
      console.log('Raw tab groups from Chrome API:', groups);
      
      const tabGroupsData: TabGroup[] = [];
      
      for (const group of groups) {
        console.log('Processing group:', group);
        
        // Get tabs for this group
        const groupTabs = await chrome.tabs.query({ groupId: group.id });
        console.log('Tabs for group', group.id, ':', groupTabs);
        
        const tabs: Tab[] = groupTabs.map(tab => ({
          id: tab.id?.toString() || '',
          title: tab.title || '',
          url: tab.url || '',
          favicon: tab.favIconUrl,
          pinned: tab.pinned,
          active: tab.active,
          groupId: tab.groupId
        }));
        
        console.log('Processed tabs for group:', tabs);
        
        tabGroupsData.push({
          id: group.id,
          title: group.title || undefined,
          color: group.color,
          collapsed: group.collapsed,
          windowId: group.windowId,
          tabs: tabs
        });
      }
      
      console.log('Final tab groups data:', tabGroupsData);
      state.value.tabGroups = tabGroupsData;
      console.log('Updated state.tabGroups:', state.value.tabGroups);
    } catch (error) {
      console.error('Failed to load tab groups:', error);
    }
  };

  // Refresh both tabs and groups
  const loadCurrentTabsAndGroups = async () => {
    await loadCurrentTabs();
    await loadTabGroups();
  };

  // Watch for changes and auto-save
  watch(state, saveData, { deep: true });

  // Computed properties
  const filteredCollections = computed(() => {
    if (!state.value.searchQuery) return state.value.collections;
    
    const query = state.value.searchQuery.toLowerCase();
    return state.value.collections.filter(collection => {
      if (!collection) return false;
      
      const nameMatch = collection.name?.toLowerCase().includes(query);
      const descMatch = collection.description?.toLowerCase().includes(query);
      const tagMatch = collection.tags?.some(tag => tag.toLowerCase().includes(query));
      const tabMatch = collection.tabs?.some(tab => 
        tab.title.toLowerCase().includes(query) ||
        tab.url.toLowerCase().includes(query)
      );
      
      return nameMatch || descMatch || tagMatch || tabMatch;
    });
  });

  const totalTabs = computed(() => 
    state.value.collections.reduce((sum, collection) => {
      if (!collection || !collection.tabs) return sum;
      return sum + collection.tabs.length;
    }, 0)
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

  const updateCollection = (collection: Collection) => {
    const index = state.value.collections.findIndex(c => c.id === collection.id);
    if (index !== -1) {
      // Ensure tabs array exists
      const updatedCollection = {
        ...collection,
        tabs: collection.tabs || [],
        updatedAt: new Date()
      };
      state.value.collections[index] = updatedCollection;
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

  const saveCurrentTabsAsCollection = async (name: string, description?: string) => {
    await loadCurrentTabs();
    return createCollection(name, description, [...state.value.currentTabs]);
  };

  const restoreCollection = async (collection: Collection) => {
    try {
      // Close all current tabs except pinned ones
      const currentTabs = await chrome.tabs.query({});
      const tabsToClose = currentTabs.filter(tab => !tab.pinned);
      
      for (const tab of tabsToClose) {
        if (tab.id) {
          await chrome.tabs.remove(tab.id);
        }
      }

      // Open tabs from collection
      for (const tab of collection.tabs) {
        await chrome.tabs.create({
          url: tab.url,
          pinned: tab.pinned || false
        });
      }

      // Update current tabs
      await loadCurrentTabs();
    } catch (error) {
      console.error('Failed to restore collection:', error);
    }
  };

  const getAiSuggestion = async (tabs?: Tab[]) => {
    if (!state.value.apiKey) {
      throw new Error('API key is not set.');
    }
    const tabsToProcess = tabs || state.value.currentTabs;
    if (!tabsToProcess || tabsToProcess.length === 0) {
      return { name: '', description: '' };
    }
    const titles = tabsToProcess.map(tab => tab.title).join('\n');
    const prompt = `Based on the following list of browser tab titles, generate a short, relevant name (2-4 words) and a one-sentence description for this collection. Return the response as a JSON object with "name" and "description" keys. Tab titles:\n${titles}`;
  
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.value.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error.message}`);
    }
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  };

  // Tab methods
  const addTabToCollection = (collectionId: string, tab: Tab) => {
    const collection = state.value.collections.find(c => c.id === collectionId);
    if (collection) {
      // Ensure tabs array exists
      if (!collection.tabs) {
        collection.tabs = [];
      }
      
      // Check if tab already exists in collection
      const existingTab = collection.tabs.find(t => t.url === tab.url);
      if (!existingTab) {
        // Create a new tab object with a unique ID
        const newTab: Tab = {
          id: uuidv4(),
          title: tab.title,
          url: tab.url,
          favicon: tab.favicon,
          lastAccessed: new Date()
        };
        collection.tabs.push(newTab);
        collection.updatedAt = new Date();
        console.log(`Tab "${tab.title}" added to collection "${collection.name}"`);
        saveData(); // Save changes to storage
      } else {
        console.log(`Tab "${tab.title}" already exists in collection "${collection.name}"`);
      }
    } else {
      console.error(`Collection with ID ${collectionId} not found`);
    }
  };

  const removeTabFromCollection = (collectionId: string, tabId: string) => {
    const collection = state.value.collections.find(c => c.id === collectionId);
    if (collection && collection.tabs) {
      const index = collection.tabs.findIndex(t => t.id === tabId);
      if (index !== -1) {
        collection.tabs.splice(index, 1);
        collection.updatedAt = new Date();
        console.log(`Tab removed from collection ${collection.name}, saving data...`);
        saveData();
      }
    }
  };

  const closeTab = async (tabId: string) => {
    try {
      const numericTabId = parseInt(tabId);
      if (!isNaN(numericTabId)) {
        await chrome.tabs.remove(numericTabId);
        await loadCurrentTabs();
      }
    } catch (error) {
      console.error('Failed to close tab:', error);
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
                id: uuidv4(),
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

  const initManager = async () => {
    await loadData();
    await loadCurrentTabsAndGroups();

    // Listen for tab changes
    chrome.tabs.onUpdated.addListener(loadCurrentTabsAndGroups);
    chrome.tabs.onRemoved.addListener(loadCurrentTabsAndGroups);
    chrome.tabGroups.onUpdated.addListener(loadCurrentTabsAndGroups);
    
    console.log('Chrome tab manager initialized');
    
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
      importCollections,
      getAiSuggestion,
      loadCurrentTabs: loadCurrentTabsAndGroups,
      saveData
    };
  };
  
  return initManager();
}