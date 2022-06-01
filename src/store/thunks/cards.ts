import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { ExactlyOne, getRandomInt } from '../../containers/utils';
import { extractFilename } from '../../containers/io';
import { AppThunkAPI } from '../hooks';
import { Card, cardAdded, cardUpdated } from '../slices/cards';
import { Metafile } from '../slices/metafiles';
import { createMetafile } from './metafiles';

export const createCard = createAsyncThunk<Card, ExactlyOne<{ path: PathLike, metafile: Metafile }>, AppThunkAPI>(
    'cards/createCard',
    async (input, thunkAPI) => {
        let card: Card = thunkAPI.dispatch(cardAdded({
            id: v4(),
            name: input.metafile ? input.metafile.name : extractFilename(input.path),
            created: DateTime.local().valueOf(),
            modified: DateTime.local().valueOf(),
            captured: undefined,
            zIndex: 0,
            left: getRandomInt(10, 70),
            top: getRandomInt(70, 130),
            type: input.metafile ? input.metafile.handler : 'Loading',
            metafile: input.metafile ? input.metafile.id : '',
            classes: []
        })).payload;

        if (input.path) {
            const metafile = await thunkAPI.dispatch(createMetafile({ path: input.path })).unwrap();
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