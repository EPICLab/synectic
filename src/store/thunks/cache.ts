import { PathLike } from 'fs-extra';
import { readFileAsync } from '../../containers/io';
import { createAppAsyncThunk } from '../hooks';
import cacheSelectors from '../selectors/cache';
import { Cache, cacheRemoved, cacheUpdated } from '../slices/cache';
import { UUID } from '../types';

export const fetchCache = createAppAsyncThunk<Cache | undefined, PathLike>(
    'cache/fetch',
    async (path, thunkAPI) => {
        return cacheSelectors.selectById(thunkAPI.getState(), path.toString());
    }
);

export const subscribe = createAppAsyncThunk<Cache, { path: PathLike, card: UUID }>(
    'cache/subscribe',
    async ({ path, card }, thunkAPI) => {
        const existing = cacheSelectors.selectById(thunkAPI.getState(), path.toString());
        const reserved = existing ? existing.reserved.includes(card) ? existing.reserved : [...existing.reserved, card] : [card];

        return thunkAPI.dispatch(cacheUpdated({
            path: path.toString(),
            reserved: reserved,
            content: await readFileAsync(path, { encoding: 'utf-8' })
        })).payload;
    }
);

export const subscribeAll = createAppAsyncThunk<Cache[], { paths: PathLike[], card: UUID }>(
    'cache/subscribeAll',
    async ({ paths, card }, thunkAPI) => {
        return await Promise.all(paths.map(async p => await thunkAPI.dispatch(subscribe({ path: p, card: card })).unwrap()));
    }
);

export const unsubscribe = createAppAsyncThunk<undefined, { path: PathLike, card: UUID }>(
    'cache/unsubscribe',
    async ({ path, card }, thunkAPI) => {
        const existing = cacheSelectors.selectById(thunkAPI.getState(), path.toString());
        if (existing?.reserved.includes(card)) {
            const updated = thunkAPI.dispatch(cacheUpdated({
                ...existing,
                reserved: existing.reserved.filter(c => c != card)
            })).payload;
            if (updated.reserved.length === 0) thunkAPI.dispatch(cacheRemoved(existing.path));
        }
        return undefined;
    }
);

export const unsubscribeAll = createAppAsyncThunk<undefined, { paths: PathLike[], card: UUID }>(
    'cache/unsubscribeAll',
    async ({ paths, card }, thunkAPI) => {
        paths.forEach(async p => await thunkAPI.dispatch(unsubscribe({ path: p, card: card })));
        return undefined;
    }
);
