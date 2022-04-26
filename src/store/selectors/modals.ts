import { RootState } from '../store';
import { modalAdapter } from '../slices/modals';

export const selectors = modalAdapter.getSelectors<RootState>(state => state.modals);

const modalSelectors = { ...selectors };

export default modalSelectors;