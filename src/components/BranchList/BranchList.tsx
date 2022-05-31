import React, { useState } from 'react';
import { FormControl, MenuItem, Typography, TextField, makeStyles } from '@material-ui/core';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { removeUndefinedProperties } from '../../containers/utils';
import { UUID } from '../../store/types';
import { cardUpdated } from '../../store/slices/cards';
import { checkoutBranch } from '../../store/thunks/branches';
import { Skeleton } from '@material-ui/lab';

export const useStyles = makeStyles({
  root: {
    color: 'rgba(171, 178, 191, 1.0)',
    fontSize: 'small',
    fontFamily: '\'Lato\', Georgia, Serif',
  },
});

/**
 * React Component to display a list of branches from the repository associated with a particular card on the 
 * canvas. The list displays both local and remote branches, and allows for checking out any branch at any 
 * point (without concern for whether there are changes on a particular branch). Checkouts will only affect 
 * the contents of the indicated card.
 * @param cardId The UUID for the parent Card component displaying this component.
 * @param repoId The UUID of the repository used to find and display branches.
 * @param overwrite Optional boolean indicating whether all checkouts should update the main worktree (instead of using linked worktrees).
 */
const BranchList = (props: { cardId: UUID; repoId: UUID; overwrite?: boolean; }) => {
  const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, props.cardId));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card ? card.metafile : ''));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, (metafile && metafile.branch) ? metafile.branch : ''));
  const branches = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo, true) : []);
  const [selected, setSelected] = useState(branch ? branch.ref : '');
  const loading = metafile && metafile.loading && metafile.loading.includes('checkout');
  const cssClasses = useStyles();
  const dispatch = useAppDispatch();

  const checkout = async (newBranch: string) => {
    console.log(`checkout: ${newBranch}`);
    if (card && metafile) {
      const overwrite = removeUndefinedProperties({ overwrite: props.overwrite });
      const updated = await dispatch(checkoutBranch({ metafile: metafile.id, branchRef: newBranch, ...overwrite })).unwrap();
      if (updated) dispatch(cardUpdated({
        ...card,
        name: updated.name,
        modified: updated.modified,
        metafile: updated.id
      }));
      if (updated) setSelected(newBranch);
    }
  };

  return (<>
    <FormControl id='branch-control' className={cssClasses.root}>
      {loading ? <Skeleton variant='text' aria-label='loading' animation='wave' >
        <FormControl id='branch-control' className={cssClasses.root} style={{ width: 120 }} />
      </Skeleton > :
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
          {branches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref)).map(branch => (
            <MenuItem key={branch.id} value={branch.ref}>
              <Typography variant='body2'>
                {branch.ref}
              </Typography>
            </MenuItem>
          ))}
          {selected === '' && <MenuItem key={'untracked'} value={''}><Typography variant='body2'>untracked</Typography></MenuItem>}
        </TextField>
      }
    </FormControl>
  </>);
};

export default BranchList;
