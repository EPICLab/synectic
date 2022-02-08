import { relative } from 'path';
import { Middleware } from 'redux';
import { v4 } from 'uuid';
import { removeUndefined } from '../../containers/format';
import { cachedAdded, cachedRemoved, cachedSubscribed, cachedUnsubscribed } from '../slices/cached';
import type { Metafile } from '../../types';
import { RootState } from '../store';
import { isDirectoryMetafile, isFilebasedMetafile, isFileMetafile } from '../thunks/metafiles';
import { metafileRemoved } from '../slices/metafiles';

export const cache: Middleware<unknown, RootState> = api => next => action => {
    if (typeof action === 'function') {
        // handle Promises 
        return action(api.dispatch, api.getState);
    } else {
        if (action.type === 'metafiles/metafileRemoved') {
            const metafiles = removeUndefined(Object.values(api.getState().metafiles.entities));
            const metafile = metafiles.find(metafile => metafile.id === action.payload);

            if (metafile && isFileMetafile(metafile)) {
                const cached = removeUndefined(Object.values(api.getState().cached.entities)).find(cachedFile => cachedFile.path === metafile.path);
                if (cached && cached.reserves > 1) api.dispatch(cachedRemoved(cached.id));
            }
        }

        if (action.type === 'cards/cardRemoved') {
            const cards = removeUndefined(Object.values(api.getState().cards.entities));
            const card = cards.find(c => c.id === action.payload);
            const metafiles = removeUndefined(Object.values(api.getState().metafiles.entities));
            const metafile = card ? metafiles.find(m => m.id === card.metafile) : undefined;

            if (card && metafile) {
                const filepaths = isDirectoryMetafile(metafile) ? metafile.contains
                    : isFilebasedMetafile(metafile) ? [metafile.path.toString()] : [];

                const targetMetafiles = metafiles.filter(m => filepaths.find(f => m.path && relative(f, m.path.toString()).length === 0));
                const cached = removeUndefined(Object.values(api.getState().cached.entities));
                targetMetafiles.filter(isFilebasedMetafile)
                    .forEach(metafile => {
                        const existing = cached.find(cachedFile =>
                            relative(cachedFile.path.toString(), metafile.path.toString()).length === 0);
                        if (existing) {
                            if (existing.reserves > 1) {
                                api.dispatch(cachedUnsubscribed(existing));
                            } else {
                                api.dispatch(metafileRemoved(metafile.id));
                                api.dispatch(cachedRemoved(existing.id));
                            }
                        }
                    });
            }
        }

        const result = next(action);

        if (action.type === 'metafiles/metafileAdded') {
            const metafile: Metafile = action.payload;
            if (isFileMetafile(metafile)) {
                api.dispatch(cachedAdded({
                    id: v4(),
                    reserves: 0,
                    path: metafile.path,
                    metafile: metafile.id
                }));
            }
        }

        if (action.type === 'metafiles/fetchNew/fulfilled') {
            const metafile: Metafile = action.payload;
            if (isFileMetafile(metafile)) {
                const cached = removeUndefined(Object.values(api.getState().cached.entities)).find(cachedFile => cachedFile.path === metafile.path);
                if (cached) api.dispatch(cachedSubscribed(cached));
            }
        }

        if (['metafiles/fetchByPath/fulfilled', 'metafiles/fetchByVirtual/fulfilled'].includes(action.type)) {
            const metafile: Metafile = action.payload[0];
            if (isFileMetafile(metafile)) {
                const cached = removeUndefined(Object.values(api.getState().cached.entities)).find(cachedFile => cachedFile.path === metafile.path);
                if (cached) api.dispatch(cachedSubscribed(cached));
            }
        }

        return result;
    }
}
