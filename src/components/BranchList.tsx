import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { FormControl, Select, MenuItem, Input } from '@material-ui/core';
import { checkoutBranch } from '../containers/repos';
import { useStyles } from './CardComponent';

/**
 * React Component to display a list of branches from the repository associated with a particular card on the 
 * canvas. The list displays both local and remote branches, and allows for checking out any branch at any 
 * point (without concern for whether there are changes on a particular branch). Checkouts will only affect 
 * the contents of the indicated card.
 * @param props Metafile UUID and Card UUID required for determining correct repository and display target. Optional
 * update boolean flag indicates whether all checkouts should update the main worktree (instead of using linked worktrees).
 */
export const BranchList: React.FunctionComponent<{ metafileId: string; cardId: string; update?: boolean; }> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafileId]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : undefined);
  const [branch, updateBranch] = useState(metafile.branch ? metafile.branch : 'untracked');
  const dispatch = useDispatch();
  const cssClasses = useStyles();

  const checkout = (newBranch: string) => {
    console.log(`checkout: ${newBranch}`);
    updateBranch(newBranch);
    dispatch(checkoutBranch(props.cardId, metafile.id, newBranch, undefined, props.update));
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
