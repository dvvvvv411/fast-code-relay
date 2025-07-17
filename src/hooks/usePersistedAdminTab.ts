
import { useState, useEffect } from 'react';

const ADMIN_TAB_STORAGE_KEY = 'admin-active-tab';

// Valid admin tab values - must match the tabs in AdminPanel
const VALID_TABS = [
  'requests',
  'phones', 
  'uebersicht',
  'auftraege',
  'support',
  'livechat',
  'appointment-overview',
  'appointment-recipients',
  'arbeitsvertrag',
  'feedback',
  'telegram'
] as const;

type AdminTab = typeof VALID_TABS[number];

const isValidTab = (tab: string): tab is AdminTab => {
  return VALID_TABS.includes(tab as AdminTab);
};

export const usePersistedAdminTab = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
      if (stored && isValidTab(stored)) {
        console.log('🔄 Restoring admin tab from localStorage:', stored);
        return stored;
      }
    } catch (error) {
      console.warn('⚠️ Failed to read admin tab from localStorage:', error);
    }
    
    console.log('🔄 Using default admin tab: requests');
    return 'requests';
  });

  const setPersistedTab = (tab: AdminTab) => {
    console.log('💾 Persisting admin tab to localStorage:', tab);
    setActiveTab(tab);
    
    try {
      localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tab);
    } catch (error) {
      console.warn('⚠️ Failed to save admin tab to localStorage:', error);
    }
  };

  return [activeTab, setPersistedTab] as const;
};
