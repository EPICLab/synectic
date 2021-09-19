import React, { useState } from 'react';
import { RootState } from '../store/store';
import { FormControl, Select, MenuItem, Input } from '@material-ui/core';
import { checkoutBranch } from '../containers/repos';
import { useStyles } from './CardComponent';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { repoSelectors } from '../store/selectors/repos';

/**
 * React Component to display a list of branches from the repository associated with a particular card on the 
 * canvas. The list displays both local and remote branches, and allows for checking out any branch at any 
 * point (without concern for whether there are changes on a particular branch). Checkouts will only affect 
 * the contents of the indicated card.
 * @param props Metafile UUID and Card UUID required for determining correct repository and display target. Optional
 * update boolean flag indicates whether all checkouts should update the main worktree (instead of using linked worktrees).
 */
export const BranchList: React.FunctionComponent<{ metafileId: string; cardId: string; update?: boolean; }> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
  const [branch, updateBranch] = useState(metafile?.branch ? metafile.branch : 'untracked');
  const dispatch = useAppDispatch();
  const cssClasses = useStyles();

  const checkout = (newBranch: string) => {
    console.log(`checkout: ${newBranch}`);
    updateBranch(newBranch);
    if (metafile) dispatch(checkoutBranch({ cardId: props.cardId, metafileId: metafile.id, branch: newBranch, update: props.update }));
  };

  return (
    <FormControl id='branch-control' className={cssClasses.root}>
      <Select labelId='branch-selection-name-label' id='branch-name' value={branch}
        className={cssClasses.root} autoWidth={true} input={<Input className={cssClasses.root} />}
        onChange={(e) => checkout(e.target.value as string)}>
        {repo && Object.values(repo.local).map(local => (<MenuItem key={local} value={local}>{local}</MenuItem>)
        )}
        {branch == 'untracked' && <MenuItem key={branch} value={branch}>{branch}</MenuItem>}
      </Select>
    </FormControl>
  );
};
