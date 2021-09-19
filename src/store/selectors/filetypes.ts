import { RootState } from '../store';
import { filetypesAdapter } from '../slices/filetypes';

export const filetypeSelectors = filetypesAdapter.getSelectors<RootState>(state => state.filetypes);