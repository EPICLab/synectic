import { stacksAdapter } from '../slices/stacks';
import { RootState } from '../store';

export const selectAllStacks = stacksAdapter.getSelectors<RootState>(state => state.stacks);