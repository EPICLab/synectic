import { createAsyncThunk } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { AppThunkAPI } from '../store/hooks';
import { fetchMetafile } from '../store/thunks/metafiles';
import { loadCard } from '../store/thunks/handlers';

export const loadBranchVersions = createAsyncThunk<void, void, AppThunkAPI>(
  'cards/loadBranchVersion',
  async (_, thunkAPI) => {
    thunkAPI.dispatch(fetchMetafile({
      virtual: {
        id: v4(),
        modified: DateTime.local().valueOf(),
        name: 'Branch Tracker',
        handler: 'BranchTracker'
      }
    }))
      .unwrap()
      .then(metafile => {
        if (metafile) thunkAPI.dispatch(loadCard({ metafile: metafile }));
      });
  }
)