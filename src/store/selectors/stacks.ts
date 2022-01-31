import { stacksAdapter } from '../slices/stacks';
import { RootState } from '../store';

const selectors = stacksAdapter.getSelectors<RootState>(state => state.stacks);

const stackSelectors = { ...selectors };

export default stackSelectors;