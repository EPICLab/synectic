import { RootState } from '../store';
import { ReposState } from '../slices/repos';

export const selectRepos = (state: RootState): ReposState => state.repos;
