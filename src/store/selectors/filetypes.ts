import { RootState } from '../store';
import { FiletypesState } from '../slices/filetypes';

export const selectFiletypes = (state: RootState): FiletypesState => state.filetypes;