import React from 'react';

interface DataWithId {
  id: string | number;
}

export const PersistentKey = 'yacd.closedConns';

function usePersistentConnections<T extends DataWithId[]>(
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = React.useState<T>(defaultValue);

  React.useEffect(() => {
    setStoredValue(() => {
      try {
        const item = window.localStorage.getItem(PersistentKey);
        return item ? (JSON.parse(item) as T) : defaultValue;
      } catch (error) {
        console.warn(`Error reading localStorage key “${PersistentKey}”:”`, error);
        return defaultValue;
      }
    });
  }, [defaultValue]);

  const setValue = React.useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prevState) => {
      const newValue = value instanceof Function ? value(prevState) : value;
      try {
        window.localStorage.setItem(PersistentKey, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error setting localStorage key “${PersistentKey}”:`, error);
      }
      return newValue;
    });
  }, []);

  return [storedValue, setValue];
}

export default usePersistentConnections;
