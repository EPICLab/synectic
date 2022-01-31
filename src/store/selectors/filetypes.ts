import { RootState } from '../store';
import { filetypesAdapter } from '../slices/filetypes';

export const selectors = filetypesAdapter.getSelectors<RootState>(state => state.filetypes);

const filetypeSelectors = { ...selectors };

export default filetypeSelectors;