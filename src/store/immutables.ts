/**
 * Immutably copy the values of all enumerable own properties from old object 
 * and map new values onto it in a new target object.
 * 
 * @param oldObject The initial source object from which to copy properties.
 * @param newValues The new value object from which to copy properties.
 * @returns {object} New object containing all enumerable own properties from both params.
 */
export const updateObject = <T>(oldObject: T, newValues: Partial<T>): T => {
  return Object.assign({}, oldObject, newValues);
};

/**
 * Immutably append a new item to an array by constructing a new combined array.
 * 
 * @param oldArray The initial source Array object.
 * @param newItem A new item to be appended to array.
 * @returns {object[]} New array containing all items from old array and including new item.
 */
export const addItemInArray = <T>(oldArray: T[], newItem: T): T[] => [...oldArray, newItem];

/**
 * Immutably remove an element from an array by producing a new reduced array.
 * 
 * @param array The initial source Array object.
 * @param item A target item contained within the array.
 * @returns {object[]} New array containing all elements from array excluding target item.
 */
export const removeItemInArray = <T>(array: T[], item: T): T[] => {
  return array.filter(element => element !== item);
}

/**
 * Immutably append a new item to a map by constructing a new combined map.
 * 
 * @param map The initial source key-value map object.
 * @param newItem A new item to be appended to map.
 * @returns {object} New map containing all items from old map and including new item.
 */
export const addItemInMap = <T extends { id: string }>(map: { [id: string]: T }, newItem: T): { [id: string]: T } => {
  const updatedItems: { [id: string]: T } = {};
  for (const k in map) {
    updatedItems[k] = map[k] as T;
  }
  updatedItems[newItem.id] = newItem;
  return updatedItems;
};

/**
 * Immutably remove an item from a map by producing a new reduced map.
 * 
 * @param map The initial source key-value map object.
 * @param itemId An id associated with an item contained in the map.
 * @returns {object} New map containing all items from map excluding item with matching id.
 */
export const removeItemInMap = <T extends { id: string }>(map: { [id: string]: T }, itemId: string): { [id: string]: T } => {
  return Object.keys(map).reduce((items: { [id: string]: T }, id) => {
    if (id !== itemId) {
      items[id] = map[id] as T;
    }
    return items;
  }, {});
}

/**
 * Immutably remove items from map using specified filter function.
 * 
 * @param map The initial source key-value map object.
 * @param filterFn Filter function that returns true for each item in map that 
 * meets conditions specified in function.
 * @returns {object} New map containing all items from map excluding matching items.
 */
export const removeMatchesInMap = <T>(map: { [id: string]: T }, filterFn: (item: T) => boolean): { [id: string]: T } => {
  return Object.keys(map).reduce((items: { [id: string]: T }, id) => {
    const item = map[id] as T;
    if (!filterFn(item)) {
      items[id] = item;
    }
    return items;
  }, {});
};

/**
 * Immutably filters items from map using specified filter function and applies a callback function to update each matching item.
 * 
 * @param map The initial source key-value map object.
 * @param filterFn Filter function that returns true for each item in map that 
 * meets conditions specified in function.
 * @param updateItemCallback Callback function to apply towards items that meet 
 * filter function predicates.
 * @returns {object} New map containing all items from map including updated items.
 */
export const updateMatchesInMap = <T>(
  map: { [id: string]: T }, filterFn: (item: T) => boolean, updateItemCallback: (item: T) => T
): { [id: string]: T } => {
  const updatedItems: { [id: string]: T } = {};
  for (const k in map) {
    const item = map[k] as T;
    if (filterFn(item)) {
      updatedItems[k] = updateItemCallback(item);
    } else {
      updatedItems[k] = item;
    }
  }
  return updatedItems;
};

/**
 * Immutably update a specific item in a key-value map based on item id and applying a callback function to that item.
 * 
 * @param map The initial source key-value map object.
 * @param itemId An id associated with an item contained in the map.
 * @param updateItemCallback Callback function to apply towards item with matching id.
 * @returns {object} New map containing all items from map including updated item.
 */
export const updateItemInMapById = <T extends { id: string }>(
  map: { [id: string]: T }, itemId: string, updateItemCallback: (item: T) => T
): { [id: string]: T } => {
  return updateMatchesInMap(map, (item => item.id === itemId), updateItemCallback);
};

