import { throttle } from 'lodash-es';
import React from 'react';

import { useApiConfig } from '$src/store/app';

interface DataWithId {
  id: string | number;
}

export const PersistentKey = 'yacd.closedConns';
const getPersistentKey = `../yacd-persistent-api/get/${PersistentKey}`;
const setPersistentKey = `../yacd-persistent-api/set/${PersistentKey}`;

const setDataToMongo = throttle(
  async <T extends DataWithId[]>(
    secret: string,
    newValue: T,
    filter: (v: T[number]) => boolean,
  ) => {
    try {
      const values = newValue.filter(filter);

      if (values.length) {
        await fetch(setPersistentKey, {
          method: 'POST',
          headers: {
            'x-yacd-auth': secret,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(values),
        });
      }
    } catch (error) {
      console.log(error);
    }
  },
  1000,
);

const recordConnectionId = <T extends DataWithId[]>(data: T, set: Set<string | number>) =>
  data.forEach((d) => set.add(d.id));

function usePersistentConnections<T extends DataWithId[]>(
  defaultValue: T,
): [T, number, React.Dispatch<React.SetStateAction<T>>] {
  const apiConfig = useApiConfig();

  const [connections, setConnections] = React.useState<T>(defaultValue);
  const [actualLength, setActualLength] = React.useState(0);

  const serverExistId = React.useRef(new Set<string | number>());

  React.useEffect(() => {
    const syncMongo = async () => {
      try {
        const response = await fetch(getPersistentKey, {
          headers: {
            'x-yacd-auth': apiConfig.secret,
          },
        });
        const { data, length } = (await response.json()) as { data: T; length: number };
        setActualLength(length);
        recordConnectionId(data, serverExistId.current);
        setConnections(data);
      } catch (error) {
        console.warn(`Error reading from the MongoDB key “${PersistentKey}”:`, error);
        setConnections(defaultValue);
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
        .then((response) => response.json() as Promise<{ data: T; length: number }>)
        .then(({ data, length }) => {
          setActualLength(length);
          recordConnectionId(data, serverExistId.current);
        })
        .catch();
    }, 30 * 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const setValue = React.useCallback((value: T | ((val: T) => T)) => {
    setConnections((prevState) => {
      const newValue = value instanceof Function ? value(prevState) : value;
      setDataToMongo(apiConfig.secret, newValue, (nv) => !serverExistId.current.has(nv.id));
      return newValue;
    });
  }, []);

  return [connections, actualLength, setValue];
}

export default usePersistentConnections;
