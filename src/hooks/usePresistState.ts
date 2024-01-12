import { throttle } from 'lodash-es';
import React from 'react';

import { useApiConfig } from '$src/store/app';

interface DataWithId {
  id: string | number;
}

export const PersistentKey = 'yacd.closedConns';
const getPersistentKey = `../yacd-persistent-api/get/${PersistentKey}`;

const setDataToMongo = throttle(
  async <T extends DataWithId[]>(
    secret: string,
    newValue: T,
    filter: (v: T[number]) => boolean,
  ) => {
    try {
      await fetch(`../yacd-persistent-api/set/${PersistentKey}`, {
        method: 'POST',
        headers: {
          'x-yacd-auth': secret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newValue.filter(filter)),
      });
    } catch (error) {
      console.log(error);
    }
  },
  1000,
);

function usePersistentConnections<T extends DataWithId[]>(
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const apiConfig = useApiConfig();

  const [storedValue, setStoredValue] = React.useState<T>(defaultValue);

  const serverExistId = React.useRef(new Set<string | number>());

  React.useEffect(() => {
    const syncMongo = async () => {
      try {
        const response = await fetch(getPersistentKey, {
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
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      fetch(getPersistentKey, {
        headers: {
          'x-yacd-auth': apiConfig.secret,
        },
      })
        .then((response) => response.json())
        .then((data: T) => {
          data.forEach((d) => serverExistId.current.add(d.id));
        })
        .catch();
    }, 10 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const setValue = React.useCallback((value: T | ((val: T) => T)) => {
    setStoredValue((prevState) => {
      const newValue = value instanceof Function ? value(prevState) : value;
      setDataToMongo(apiConfig.secret, newValue, (nv) => !serverExistId.current.has(nv.id));
      return newValue;
    });
  }, []);

  return [storedValue, setValue];
}

export default usePersistentConnections;
