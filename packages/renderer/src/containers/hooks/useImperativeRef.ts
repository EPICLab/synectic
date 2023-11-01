import {useCallback, useState} from 'react';

export const useImperativeRef = <T>() => {
  const [refState, setRefState] = useState<T>();
  const ref = useCallback((n: T | null) => {
    if (n) setRefState(n);
  }, []);

  return [refState, ref] as const;
};
