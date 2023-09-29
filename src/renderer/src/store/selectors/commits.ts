import { commitAdapter } from '../slices/commits';
import type { RootState } from '../store';

const selectors = commitAdapter.getSelectors<RootState>(state => state.commits);

const commitSelectors = {
  ...selectors
};

export default commitSelectors;
