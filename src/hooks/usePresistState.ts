import React from 'react';

import { useApiConfig } from '$src/store/app';

interface DataWithId {
  id: string | number;
}

export const PersistentKey = 'yacd.closedConns';

function usePersistentConnections<T extends DataWithId[]>(
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const apiConfig = useApiConfig();

  const [storedValue, setStoredValue] = React.useState<T>(defaultValue);

  const serverExistId = React.useRef(new Set<string | number>());

  React.useEffect(() => {
    const syncMongo = async () => {
      try {
        const response = await fetch(`../yacd-persistent-api/get/${PersistentKey}`, {
          headers: {
            'x-yacd-auth': apiConfig.secret,
          },
        });
        const data = (await response.json()) as T;
        data.forEach((d) => serverExistId.current.add(d.id));
        setStoredValue(data);
      } catch (error) {
        console.warn(`Error reading from the MongoDB key “${PersistentKey}”:`, error);
        setStoredValue(defaultValue);
      }
    };
    syncMongo();
  }, [apiConfig.secret, defaultValue]);

  const setValue = React.useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prevState) => {
        const newValue = value instanceof Function ? value(prevState) : value;
        fetch(`../yacd-persistent-api/set/${PersistentKey}`, {
          method: 'POST',
          headers: {
            'x-yacd-auth': apiConfig.secret,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newValue.filter((nv) => !serverExistId.current.has(nv.id))),
        }).catch((err) => console.log(err));
        return newValue;
      });
    },
    [apiConfig.secret],
  );

  return [storedValue, setValue];
}

export default usePersistentConnections;
