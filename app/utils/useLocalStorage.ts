import { useState, useEffect, useCallback } from 'react';

// Check if we're in a browser environment
function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

interface StorageItem {
  value: any;
  expiry: number;
}

function useLocalStorage<T>(key: string, initialValue: T, ttl?: number) {
  // Initialize state with a function to avoid calling localStorage on every render
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient()) {
      return initialValue;
    }

    try {
      const item = localStorage.getItem(key);
      
      if (!item) {
        return initialValue;
      }

      const parsedItem: StorageItem = JSON.parse(item);
      
      // Check if item is expired
      if (parsedItem.expiry && new Date().getTime() > parsedItem.expiry) {
        localStorage.removeItem(key);
        return initialValue;
      }

      return parsedItem.value;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (!isClient()) {
      setStoredValue(value);
      return;
    }

    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to localStorage with expiry if TTL is provided
      const item: StorageItem = {
        value: valueToStore,
        expiry: ttl ? new Date().getTime() + ttl : 0
      };
      
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue, ttl]);

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    if (!isClient()) {
      setStoredValue(initialValue);
      return;
    }

    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  // Check for expiry on mount and set up interval for periodic checks
  useEffect(() => {
    if (!isClient() || !ttl) return;

    const checkExpiry = () => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const parsedItem: StorageItem = JSON.parse(item);
          if (parsedItem.expiry && new Date().getTime() > parsedItem.expiry) {
            localStorage.removeItem(key);
            setStoredValue(initialValue);
          }
        }
      } catch (error) {
        console.error('Error checking expiry:', error);
      }
    };

    // Check immediately
    checkExpiry();

    // Set up interval to check periodically (every minute)
    const interval = setInterval(checkExpiry, 60000);

    return () => clearInterval(interval);
  }, [key, initialValue, ttl]);

  return [storedValue, setValue, removeValue] as const;
}

// Utility functions (keeping the original API)
function setWithExpiry(key: string, value: any, ttl: number): void {
  if (!isClient()) {
    console.warn('localStorage is not available in this environment');
    return;
  }

  try {
    const nowGetTime: number = new Date().getTime();
    const expiry = nowGetTime + ttl;

    const item: StorageItem = {
      value,
      expiry
    };
    
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error setting localStorage item:', error);
  }
}

function getWithExpiry(key: string): any {
  if (!isClient()) {
    return null;
  }

  try {
    const itemStr = localStorage.getItem(key);

    if (!itemStr) {
      return null;
    }

    const item: StorageItem = JSON.parse(itemStr);

    if (!item || typeof item !== 'object' || !item.hasOwnProperty('expiry')) {
      localStorage.removeItem(key);
      return null;
    }

    const nowDate = new Date();

    if (item.expiry && nowDate.getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.value;
  } catch (error) {
    console.error('Error getting localStorage item:', error);
    try {
      localStorage.removeItem(key);
    } catch (removeError) {
      console.error('Error removing corrupted localStorage item:', removeError);
    }
    return null;
  }
}

export { useLocalStorage, setWithExpiry, getWithExpiry };