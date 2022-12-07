// copied from: https://usehooks-ts.com/react-hook/use-map
import { useCallback, useState } from 'react'

export type MapOrEntries<K, V> = Map<K, V> | [K, V][]

// Public interface
export interface Actions<K, V> {
    set: (key: K, value: V) => void
    setAll: (entries: MapOrEntries<K, V>) => void
    remove: (key: K) => void
    reset: Map<K, V>['clear']
}

// We hide some setters from the returned map to disable autocompletion
type Return<K, V> = [Omit<Map<K, V>, 'set' | 'clear' | 'delete'>, Actions<K, V>]

/**
 * Custom React Hook for providing an API to interact with a `Map` data structure. It takes an array of tuples in 
 * the `[key, value]` format and returns an interface for interacting with the Map instance via common map functions.
 * 
 * @param initialState An initial `Map` entry or nothing.
 * @returns {[Map, Actions]} An instance of `Map` (including `foreach`, `get`, `has`, `entries`, `keys`, `values`, and `size`),
 * and an object of methods (`set`, `setAll`, `remove`, and `reset`) for updating the map.
 */
function useMap<K, V>(
    initialState: MapOrEntries<K, V> = new Map(),
): Return<K, V> {
    const [map, setMap] = useState(new Map(initialState));

    const actions: Actions<K, V> = {
        set: useCallback((key, value) => {
            setMap(prev => new Map(prev.set(key, value)))
        }, []),

        setAll: useCallback(entries => {
            setMap(() => new Map(entries));
        }, []),

        remove: useCallback(key => {
            setMap(prev => {
                const copy = new Map(prev);
                copy.delete(key);
                return copy;
            })
        }, []),

        reset: useCallback(() => {
            setMap(() => new Map());
        }, []),
    };

    return [map, actions];
}

export default useMap;
