// copied from: https://usehooks.com/usetoggle, modified with TypeScript types as needed
import {useCallback, useState} from 'react';

/**
 * Custom React Hook to toggle a boolean value. This hook takes a boolean parameter and toggles
 * that value to the opposite. The toggle function that is returned can be used to toggle between
 * states, or directly set by providing a boolean value.
 * @param initialValue An initial state consisting of a boolean value.
 * @returns {[boolean, (value: boolean | undefined) => void]} A tuple containing the current
 * boolean state, and a function for toggling that state.
 */
const useToggle = (
  initialValue: boolean | (() => boolean),
): [boolean, (value?: boolean | undefined) => void] => {
  const [on, setOn] = useState(initialValue);

  const handleToggle = useCallback((value: boolean | undefined) => {
    if (value !== undefined) return setOn(value);

    return setOn(v => !v);
  }, []);

  return [on, handleToggle];
};

export default useToggle;
