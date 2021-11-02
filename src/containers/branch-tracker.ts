import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { AppThunkAPI } from '../store/hooks';
import { fetchMetafile } from '../store/thunks/metafiles';
import { loadCard } from './handlers';

export const loadBranchVersions = createAsyncThunk<void, void, AppThunkAPI>(
  'cards/loadBranchVersion',
  async (_, thunkAPI) => {
    thunkAPI.dispatch(fetchMetafile({
      virtual: {
        id: v4(),
        modified: DateTime.local().valueOf(),
        name: 'Repos Tracker', handler: 'ReposTracker'
      }
    }))
      .unwrap()
      .then(metafile => {
        if (metafile) thunkAPI.dispatch(loadCard({ metafile: metafile }));
      });
  }
)