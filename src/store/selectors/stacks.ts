import { stacksAdapter } from '../slices/stacks';
import { RootState } from '../store';

export const stackSelectors = stacksAdapter.getSelectors<RootState>(state => state.stacks);