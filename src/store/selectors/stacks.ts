import { stackAdapter } from '../slices/stacks';
import { RootState } from '../store';

const selectors = stackAdapter.getSelectors<RootState>(state => state.stacks);

const stackSelectors = { ...selectors };

export default stackSelectors;