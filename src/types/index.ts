export interface Tab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  pinned?: boolean;
  active?: boolean;
  lastAccessed?: Date;
  groupId?: number;
}

export interface TabGroup {
  id: number;
  title?: string;
  color: 'grey' | 'blue' | 'red' | 'yellow' | 'green' | 'pink' | 'purple' | 'cyan' | 'orange';
  collapsed: boolean;
  windowId: number;
  tabs: Tab[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  tabs: Tab[];
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  color?: string;
}

export interface BrowserSession {
  id: string;
  name: string;
  tabs: Tab[];
  windowId?: number;
  lastActive: Date;
}

export interface AppState {
  collections: Collection[];
  currentTabs: Tab[];
  tabGroups: TabGroup[];
  searchQuery: string;
  selectedCollection: Collection | TabGroupSelection | null;
  theme: 'light' | 'dark';
  autoSave: boolean;
  apiKey: string;
  isAiEnabled: boolean;
}

export interface TabGroupSelection {
  type: 'tabGroup';
  data: TabGroup;
  isTabGroup: true;
}