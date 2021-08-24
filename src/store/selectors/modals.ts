import { RootState } from '../store';
import { modalsAdapter } from '../slices/modals';

export const modalSelectors = modalsAdapter.getSelectors<RootState>(state => state.modals);