import { stackAdapter } from '../slices/stacks';
import type { RootState } from '../store';

const selectors = stackAdapter.getSelectors<RootState>(state => state.stacks);

const stackSelectors = { ...selectors };

export default stackSelectors;
