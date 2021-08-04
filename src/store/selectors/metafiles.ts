import { RootState } from '../store';
import { MetafilesState } from '../slices/metafiles';

export const selectMetafiles = (state: RootState): MetafilesState => state.metafiles;
