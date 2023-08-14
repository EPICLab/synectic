import { commitAdapter } from '../slices/commits';
import { RootState } from '../store';

const selectors = commitAdapter.getSelectors<RootState>(state => state.commits);

const commitSelectors = {
  ...selectors
};

export default commitSelectors;
