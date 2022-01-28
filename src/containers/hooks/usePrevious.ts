// copied from: https://usehooks.com/usePrevious/
import { useEffect, useRef } from 'react';

/**
 * Custom React Hook for maintaining the previous value of props or state.
 * @param value The prop or state value to maintain in a `useRef` instance.
 * @returns The previous value of the props or state.
 */
const usePrevious = <T>(value: T) => {
    const ref = useRef<T>();

    useEffect(() => {
        ref.current = value;
    }, [value]);

    return ref.current;
}

export default usePrevious;