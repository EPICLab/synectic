import { RootState } from '../store';
import { modalsAdapter } from '../slices/modals';

export const selectAllModals = modalsAdapter.getSelectors<RootState>(state => state.modals);