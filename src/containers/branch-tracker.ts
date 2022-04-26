import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { AppThunkAPI } from '../store/hooks';
import { createMetafile } from '../store/thunks/metafiles';
import { createCard } from '../store/thunks/cards';

export const loadBranchVersions = createAsyncThunk<void, void, AppThunkAPI>(
  'cards/loadBranchVersion',
  async (_, thunkAPI) => {
    const metafile = await thunkAPI.dispatch(createMetafile({
      metafile: {
        name: 'Branch Tracker',
        modified: DateTime.local().valueOf(),
        handler: 'BranchTracker',
        filetype: 'Text'
      }
    })).unwrap();
    thunkAPI.dispatch(createCard({ metafile: metafile }));
  }
)