import React, { useContext, useEffect, useState } from 'react';
import { RootState } from '../../store/store';
import { FormControl, MenuItem, Typography, TextField } from '@material-ui/core';
import { useStyles } from '../Card/CardComponent';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import cardSelectors from '../../store/selectors/cards';
import { removeUndefinedProperties } from '../../containers/format';
import repoSelectors from '../../store/selectors/repos';
import { checkoutBranch, switchCardMetafile } from '../../store/thunks/repos';
import { FSCache } from '../Cache/FSCache';

/**
 * React Component to display a list of branches from the repository associated with a particular card on the 
 * canvas. The list displays both local and remote branches, and allows for checking out any branch at any 
 * point (without concern for whether there are changes on a particular branch). Checkouts will only affect 
 * the contents of the indicated card.
 * @param props Metafile UUID and Card UUID required for determining correct repository and display target. Optional
 * overwrite boolean flag indicates whether all checkouts should update the main worktree (instead of using linked worktrees).
 */
export const BranchList: React.FunctionComponent<{ cardId: string; overwrite?: boolean; }> = props => {
  const dispatch = useAppDispatch();
  const { subscribe, unsubscribe } = useContext(FSCache);
  const cssClasses = useStyles();
  const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, props.cardId));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, card ? card.metafile : ''));
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, (metafile && metafile.repo) ? metafile.repo : ''));
  const branches = repo ? repo.local.filter(local => local !== 'HEAD') : [];

  // const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  // const [repo, setRepo] = useState<Repository | undefined>(undefined);
  // const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

  const [branch, updateBranch] = useState(metafile?.branch ? metafile.branch : 'untracked');

  useEffect(() => {
    console.log(`new cardId: ${props.cardId}`);
  }, [props.cardId]);

  useEffect(() => {
    console.log(`new repo:`, { repo });
  }, [repo]);

  useEffect(() => {
    console.log(`new branches:`, { branches });
  }, [branches]);

  const checkout = async (newBranch: string) => {
    console.log(`checkout: ${newBranch}`, { card, metafile });
    updateBranch(newBranch);
    if (card && metafile) {
      const overwrite = removeUndefinedProperties({ overwrite: props.overwrite });
      const updated = await dispatch(checkoutBranch({ metafileId: metafile.id, branch: newBranch, ...overwrite })).unwrap();
      console.log(`BranchList checkout => updated:`, { updated });
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
        value={branch}
        onChange={(e) => checkout(e.target.value as string)}
        variant='outlined'
        size='small'
      >
        {branch === 'untracked' && <MenuItem key={branch} value={branch}><Typography variant='body2'>{branch}</Typography></MenuItem>}
        {branches.map(local => (
          <MenuItem key={local} value={local}>
            <Typography variant='body2'>
              {local}
            </Typography>
          </MenuItem>
        ))}
      </TextField>
      {/* <Select
        labelId='branch-selection-name-label'
        id='branch-name'
        value={branch}
        variant='outlined'
        // onChange={(e) => checkout(e.target.value as string)}
        // input={<Input className={cssClasses.root} />}
        // disableUnderline
        className={cssClasses.root}
        autoWidth={true}
      >
        {branch === 'untracked' && <MenuItem key={branch} value={branch}><Typography variant='body2'>{branch}</Typography></MenuItem>}
        {branches.map(local => (<MenuItem key={local} value={local}><Typography variant='body2'>{local}</Typography></MenuItem>))}
      </Select> */}
    </FormControl>
  );
};
