import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { ExactlyOne } from '../../containers/format';
import { extractFilename } from '../../containers/io';
import { AppThunkAPI } from '../hooks';
import metafileSelectors from '../selectors/metafiles';
import { Card, cardAdded, cardUpdated } from '../slices/cards';
import { Metafile } from '../slices/metafiles';
import { createMetafile } from './metafiles';

export const createCard = createAsyncThunk<Card, ExactlyOne<{ path: PathLike, metafile: Metafile }>, AppThunkAPI>(
    'cards/createCard',
    async (input, thunkAPI) => {
        let card = thunkAPI.dispatch(cardAdded({
            id: v4(),
            name: input.metafile ? input.metafile.name : extractFilename(input.path),
            created: DateTime.local().valueOf(),
            modified: DateTime.local().valueOf(),
            captured: undefined,
            zIndex: 0,
            left: 10,
            top: 70,
            type: input.metafile ? input.metafile.handler : 'Loading',
            metafile: input.metafile ? input.metafile.id : '',
            classes: []
        })).payload;

        if (input.path) {
            const existing = metafileSelectors.selectByFilepath(thunkAPI.getState(), input.path);
            const metafile = existing.length > 0 ? existing[0] : await thunkAPI.dispatch(createMetafile({ path: input.path })).unwrap();
            if (metafile) {
                card = thunkAPI.dispatch(cardUpdated({
                    ...card,
                    name: metafile.name,
                    type: metafile.handler,
                    metafile: metafile.id
                })).payload;
            }
        }
        return card;
    }
);