// copied from: https://usehooks.com/usemap, modified with TypeScript types as needed
import { useReducer, useRef } from 'react';

/**
 * Custom React Hook to synchronize and update state based on the Map data structure.
 * This hook provides a wrapper around the JavaScript
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map Map}
 * object and allows you to easily update and synchronize the map state with the component’s
 * rendering. By using this hook, you can add, delete, or clear entries in the map while ensuring
 * that the component re-renders whenever these operations are performed.
 * @param initialState An initial state consisting of key-value tuples in an array object, where
 * any value (both objects and
 * {@link https://developer.mozilla.org/en-US/docs/Glossary/Primitive primitive values}) maybe used
 * as either a key or a value.
 * @returns {Map} A Map object holding key-value pairs that adhere to the types provided explicitly
 * by type variables, or resolved to the type of the first key-value pair in the `initialState`.
 */
const useMap = <K, V>(initialState: Iterable<readonly [K, V]> | null | undefined): Map<K, V> => {
  const mapRef = useRef(new Map(initialState));
  const [, reRender] = useReducer(x => x + 1, 0);

  mapRef.current.set = (...args) => {
    Map.prototype.set.apply(mapRef.current, args);
    reRender();
    return mapRef.current;
  };

  mapRef.current.clear = (...args) => {
    Map.prototype.clear.apply(mapRef.current, args);
    reRender();
  };

  mapRef.current.delete = (...args) => {
    const res = Map.prototype.delete.apply(mapRef.current, args);
    reRender();

    return res;
  };

  return mapRef.current;
};

export default useMap;
