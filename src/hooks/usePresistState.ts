import React from 'react';

interface DataWithId {
  id: string | number;
}

function usePersistentState<T extends DataWithId[]>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const readValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key “${key}”:`, error);
      return defaultValue;
    }
  };

  const [storedValue, setStoredValue] = React.useState<T>(readValue);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      // 保存状态
      setStoredValue(newValue);
      // 保存到 localStorage
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Error setting localStorage key “${key}”:`, error);
    }
  };

  return [storedValue, setValue];
}

export default usePersistentState;
