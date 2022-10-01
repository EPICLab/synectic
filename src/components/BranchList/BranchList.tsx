import { FormControl, makeStyles, MenuItem, TextField, Typography } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import { cardUpdated } from '../../store/slices/cards';
import { RootState } from '../../store/store';
import { switchBranch } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';

export const useStyles = makeStyles({
  formControl: {
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
 * 
 * @param props Prop object for branches on a specific repository.
 * @param props.cardId - The UUID for the parent Card component displaying this component.
 * @param props.repoId - The UUID of the repository used to find and display branches.
 * @returns {React.Component} A React function component.
 */
const BranchList = (props: { cardId: UUID; repoId: UUID; }) => {
  const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, props.cardId));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card ? card.metafile : ''));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
  const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, (metafile && metafile.branch) ? metafile.branch : ''));
  const repoBranches = useAppSelector((state: RootState) => repo ? branchSelectors.selectByRepo(state, repo, true) : []);
  const branches = repoBranches.filter(branch => branch.ref !== 'HEAD').sort((a, b) => a.ref.localeCompare(b.ref));
  const loading = metafile && metafile.loading && metafile.loading.includes('checkout');
  const [selected, setSelected] = useState(branch ? branch.ref : '');
  const styles = useStyles();
  const dispatch = useAppDispatch();

  const checkout = async (newBranch: string) => {
    console.log(`checkout: ${newBranch}`);
    if (card && metafile && repo) {
      try {
        const updated = await dispatch(switchBranch({ metafileId: metafile.id, ref: newBranch, root: repo.root })).unwrap();
        if (updated) setSelected(newBranch);
        if (updated) dispatch(cardUpdated({
          ...card,
          name: updated.name,
          modified: updated.modified,
          metafile: updated.id
        }));
      } catch (error) {
        console.error(`Checkout failed: `, error);
      }
    }
  };

  return (<>
    <FormControl id='branch-control' className={styles.formControl}>
      {loading ? <Skeleton variant='text' aria-label='loading' animation='wave' >
        <FormControl id='branch-control' className={styles.formControl} style={{ width: 100 }} />
      </Skeleton> :
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
          {branches.map(branch => (
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
