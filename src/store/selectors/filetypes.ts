import { createCachedSelector } from 're-reselect';
import { Filetype, filetypeAdapter } from '../slices/filetypes';
import { RootState } from '../store';
import { CardType } from '../types';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { equalArrays } from '../../containers/utils';

export const selectors = filetypeAdapter.getSelectors<RootState>(state => state.filetypes);
const deepFiletypeEqualityCheck = (a: Filetype[], b: Filetype[]) => equalArrays(a, b);

/**
 * Selector for retrieving Filetype entities based on `filetype`. This selector caches on `filetype` as long as `selectAll` has not 
 * changed. The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated 
 * when entitites change in `selectAll`, but not when `filetype` input selector changes.
 */
const selectByFiletype = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, filetype: string) => filetype,
    (filetypes, filetype) => filetypes.filter(f => f.filetype === filetype)
)({
    keySelector: (_, filetype) => filetype,
    selectorCreator: createSelectorCreator(defaultMemoize, deepFiletypeEqualityCheck),
});

/**
 * Selector for retrieving Filetype entities based on `handler`. This selector caches on `handler` as long as `selectAll` has not 
 * changed. The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated 
 * when entitites change in `selectAll`, but not when `handler` input selector changes.
 */
const selectByHandler = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, handler: CardType) => handler,
    (filetypes, handler) => filetypes.filter(f => f.handler === handler)
)({
    keySelector: (_, handler) => handler,
    selectorCreator: createSelectorCreator(defaultMemoize, deepFiletypeEqualityCheck),
});

/**
 * Selector for retrieving Filetype entities based on `extension`. This selector caches on `extension` as long as `selectAll` has not 
 * changed. The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated 
 * when entitites change in `selectAll`, but not when `extension` input selector changes.
 */
const selectByExtension = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, extension: string) => extension,
    (filetypes, extension) => filetypes.filter(f => f.extensions.some(ext => ext === extension))
)({
    keySelector: (_, extension) => extension,
    selectorCreator: createSelectorCreator(defaultMemoize, deepFiletypeEqualityCheck),
});

const filetypeSelectors = { ...selectors, selectByFiletype, selectByHandler, selectByExtension };

export default filetypeSelectors;