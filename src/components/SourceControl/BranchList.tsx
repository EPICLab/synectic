import React, { useContext, useState } from 'react';
import { FormControl, MenuItem, Typography, TextField } from '@material-ui/core';
import type { UUID } from '../../types';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { RootState } from '../../store/store';
import { FSCache } from '../Cache/FSCache';
import { useStyles } from '../Card/CardComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeUndefinedProperties } from '../../containers/format';
import { checkoutBranch, switchCardMetafile } from '../../store/thunks/repos';

/**
 * React Component to display a list of branches from the repository associated with a particular card on the 
 * canvas. The list displays both local and remote branches, and allows for checking out any branch at any 
 * point (without concern for whether there are changes on a particular branch). Checkouts will only affect 
 * the contents of the indicated card.
 * @param cardId The UUID for the parent Card component displaying this component.
 * @param repoId The UUID of the repository used to find and display branches.
 * @param overwrite Optional boolean indicating whether all checkouts should update the main worktree (instead of using linked worktrees).
 */
export const BranchList: React.FunctionComponent<{ cardId: UUID; repoId: UUID; overwrite?: boolean; }> = props => {
  const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, props.cardId));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card ? card.metafile : ''));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, (metafile && metafile.branch) ? metafile.branch : ''));
  const branches = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo, true) : []);
  const [selected, setSelected] = useState(branch ? branch.ref : '');
  const { subscribe, unsubscribe } = useContext(FSCache);
  const cssClasses = useStyles();
  const dispatch = useAppDispatch();

  const checkout = async (newBranch: string) => {
    console.log(`checkout: ${newBranch}`);
    if (card && metafile) {
      setSelected(newBranch);
      const overwrite = removeUndefinedProperties({ overwrite: props.overwrite });
      const updated = await dispatch(checkoutBranch({ metafileId: metafile.id, branchRef: newBranch, ...overwrite })).unwrap();
      if (metafile.path) unsubscribe(metafile.path);
      if (updated) await dispatch(switchCardMetafile({ card: card, metafile: updated }));
      if (updated && updated.path) subscribe(updated.path);
    }
  };

  return (
    <FormControl id='branch-control' className={cssClasses.root}>
      <TextField
        id='branch-name'
        select
        value={selected}
        onChange={(e) => checkout(e.target.value as string)}
        variant='standard'
        size='small'
        InputProps={{
          disableUnderline: true,
        }}
      >
        {branches.filter(branch => branch.ref !== 'HEAD').map(branch => (
          <MenuItem key={branch.id} value={branch.ref}>
            <Typography variant='body2'>
              {branch.ref}
            </Typography>
          </MenuItem>
        ))}
        {selected === '' && <MenuItem key={'untracked'} value={''}><Typography variant='body2'>untracked</Typography></MenuItem>}
      </TextField>
    </FormControl>
  );
};
