import { RootState } from '../store';
import { ModalsState } from '../slices/modals';

export const selectModals = (state: RootState): ModalsState => state.modals;
