import { RootState } from '../store';
import { filetypesAdapter } from '../slices/filetypes';

export const selectAllFiletypes = filetypesAdapter.getSelectors<RootState>(state => state.filetypes);