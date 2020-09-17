import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, FormControl, Input, InputLabel, ListSubheader, MenuItem, Select } from '@material-ui/core';

import { Repository, UUID } from '../types';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { useBranchStatus } from '../store/hooks/useBranchStatus';

type DialogProps = {
  open: boolean;
  repos: Repository[];
  onClose: (canceled: boolean, selected: [UUID, UUID]) => void;
}

export const MergePickerDialog: React.FunctionComponent<DialogProps> = props => {
  const [base, setBase] = useState<{ repo: UUID, branch: string }>({ repo: '', branch: '' });
  const [compare, setCompare] = useState<{ repo: UUID, branch: string }>({ repo: '', branch: '' });
  const baseStatus = useBranchStatus(base.repo, base.branch);
  const compareStatus = useBranchStatus(compare.repo, compare.branch);

  useEffect(() => {
    if (base.repo !== '' && compare.repo !== '') console.log(`ready to analyze...`);
  }, [base, compare]);

  const setSelected = (target: 'base' | 'compare', value: string) => {
    const repoBranch = { repo: value.split('/')[0], branch: value.split('/')[1] };
    (target === 'base') ? setBase(repoBranch) : setCompare(repoBranch);
  };

  const analyze = () => {
    console.log(`base: ${base?.repo}/${base?.branch} (cards: ${baseStatus.cards.length}, modified: ${baseStatus.modified.length})`);
    console.log(`compare: ${compare?.repo}/${compare?.branch} (cards: ${compareStatus.cards.length}, modified: ${compareStatus.modified.length})`);
  };

  return (
    <Dialog id='picker-dialog' open={props.open} onClose={() => props.onClose(false, ['', ''])}>
      <div className='diff-container'>
        <DialogTitle style={{ gridArea: 'header' }}>Select branches to compare</DialogTitle>
        <FormControl aria-label='Left Form' style={{ gridArea: 'left', width: 100 }}>
          <InputLabel htmlFor='merge-select-left' id='merge-select-left-label'>Base</InputLabel>
          <Select id='merge-select-left' aria-labelledby='merge-select-left-label' value={base.repo !== '' ? `${base?.repo}/${base?.branch}` : ''}
            autoWidth={true} onChange={(e) => setSelected('base', e.target.value as string)} input={<Input />}>
            <MenuItem value=''><em>None</em></MenuItem>
            {props.repos.map(repo => [
              <ListSubheader key={`${repo.id}-subheader`}>{repo.name}</ListSubheader>,
              ...(repo.local.map(branch => <MenuItem key={`${repo.id}/${branch}`} value={`${repo.id}/${branch}`}>{branch}</MenuItem>))
            ])}
          </Select>
        </FormControl>
        <FormControl aria-label='Right Form' style={{ gridArea: 'right', width: 100 }}>
          <InputLabel htmlFor='merge-select-right' id='merge-select-right-label'>Compare</InputLabel>
          <Select id='merge-select-right' aria-labelledby='merge-select-right-label' value={compare.repo !== '' ? `${compare?.repo}/${compare?.branch}` : ''}
            autoWidth={true} onChange={(e) => setSelected('compare', e.target.value as string)} input={<Input />}>
            <MenuItem value=''><em>None</em></MenuItem>
            {props.repos.map(repo => [
              <ListSubheader key={`${repo.id}-subheader`}>{repo.name}</ListSubheader>,
              ...(repo.local.map(branch => <MenuItem key={`${repo.id}/${branch}`} value={`${repo.id}/${branch}`}>{branch}</MenuItem>))
            ])}
          </Select>
        </FormControl>
        <button onClick={analyze}>View Selected...</button>
      </div>
    </Dialog >
  );
}

const MergePickerButton: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const repos = useSelector((state: RootState) => Object.values(state.repos));

  const handleClose = () => {
    setOpen(!open);
  };

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' onClick={() => setOpen(!open)}>Merge Branches...</Button>
      {open ? <MergePickerDialog open={open} repos={repos} onClose={handleClose} /> : null}
    </>
  );
}

export default MergePickerButton;