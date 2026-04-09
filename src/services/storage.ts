/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_PREFIX = '@sku_foundry:';

export const AsyncStorage = {
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (e) {
      console.error('AsyncStorage Error:', e);
    }
  },

  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error('AsyncStorage Error:', e);
      return null;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error('AsyncStorage Error:', e);
    }
  },

  clear: async (): Promise<void> => {
    try {
      localStorage.clear();
    } catch (e) {
      console.error('AsyncStorage Error:', e);
    }
  },
  
  // Helper to store objects directly
  setObject: async (key: string, value: any): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  getObject: async <T>(key: string): Promise<T | null> => {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : null;
  }
};