import React, { useState } from 'react';
import { RootState } from '../../store/store';
import { FormControl, Select, MenuItem, Input, Typography } from '@material-ui/core';
import { useStyles } from '../Card/CardComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import cardSelectors from '../../store/selectors/cards';
import { removeUndefinedProperties } from '../../containers/format';
import repoSelectors from '../../store/selectors/repos';
import { checkoutBranch, switchCardMetafile } from '../../store/thunks/repos';

/**
 * React Component to display a list of branches from the repository associated with a particular card on the 
 * canvas. The list displays both local and remote branches, and allows for checking out any branch at any 
 * point (without concern for whether there are changes on a particular branch). Checkouts will only affect 
 * the contents of the indicated card.
 * @param props Metafile UUID and Card UUID required for determining correct repository and display target. Optional
 * overwrite boolean flag indicates whether all checkouts should update the main worktree (instead of using linked worktrees).
 */
export const BranchList: React.FunctionComponent<{ metafileId: string; cardId: string; overwrite?: boolean; }> = props => {
  const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, props.cardId));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafileId));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
  const [branch, updateBranch] = useState(metafile?.branch ? metafile.branch : 'untracked');
  const dispatch = useAppDispatch();
  const cssClasses = useStyles();

  const checkout = async (newBranch: string) => {
    console.log(`checkout: ${newBranch}`);
    if (card && metafile) {
      const overwrite = removeUndefinedProperties({ overwrite: props.overwrite });
      const updated = await dispatch(checkoutBranch({ metafileId: metafile.id, branch: newBranch, ...overwrite })).unwrap();
      if (updated) await dispatch(switchCardMetafile({ card: card, metafile: updated }));
      updateBranch(newBranch);
    }
  };

  return (
    <FormControl id='branch-control' className={cssClasses.root}>
      <Select labelId='branch-selection-name-label' id='branch-name' value={branch}
        className={cssClasses.root} autoWidth={true} input={<Input className={cssClasses.root} />}
        onChange={(e) => checkout(e.target.value as string)}>
        {repo && Object.values(repo.local).filter(local => local !== 'HEAD').map(local => (<MenuItem key={local} value={local}><Typography variant='body2'>{local}</Typography></MenuItem>)
        )}
        {branch == 'untracked' && <MenuItem key={branch} value={branch}><Typography variant='body2'>{branch}</Typography></MenuItem>}
      </Select>
    </FormControl>
  );
};
