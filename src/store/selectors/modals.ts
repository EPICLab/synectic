import { RootState } from '../store';
import { modalsAdapter } from '../slices/modals';

export const selectors = modalsAdapter.getSelectors<RootState>(state => state.modals);

const modalSelectors = { ...selectors };

export default modalSelectors;