import React, { useState } from 'react';
import * as MUI from '@material-ui/core';
import { DateTime } from 'luxon';
import { UUID } from '../../store/types';
import { RootState } from '../../store/store';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { buildCard } from '../../store/thunks/cards';
import { createMetafile } from '../../store/thunks/metafiles';
import cardSelectors from '../../store/selectors/cards';
import metafileSelectors from '../../store/selectors/metafiles';
import branchSelectors from '../../store/selectors/branches';

const DiffPickerDialog = (props: Modal) => {
  const cards = useAppSelector((state: RootState) => cardSelectors.selectAll(state));
  const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectEntities(state));
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const dispatch = useAppDispatch();
  const [selectedLeft, setSelectedLeft] = useState<UUID>('');
  const [selectedRight, setSelectedRight] = useState<UUID>('');

  const handleClose = async (canceled: boolean, selected: [UUID, UUID]) => {
    if (canceled || selected[0] === '' || selected[1] === '') return dispatch(modalRemoved(props.id));
    const left = cards.find(c => c.id === selected[0]);
    const leftMetafile = left && left.metafile ? metafiles[left.metafile] : undefined;
    const right = cards.find(c => c.id === selected[1]);
    const rightMetafile = right && right.metafile ? metafiles[right.metafile] : undefined;
    if (!left || !right || !leftMetafile || !rightMetafile) return dispatch(modalRemoved(props.id));
    const leftBranch = leftMetafile.branch ? branches[leftMetafile.branch] : undefined;
    const rightBranch = rightMetafile.branch ? branches[rightMetafile.branch] : undefined;

    const diffCardName = `${leftBranch ? leftBranch.ref + '/' : ''}${left.name} Δ ${rightBranch ? rightBranch.ref + '/' : ''}${right.name}`;
    const diffMetafile = await dispatch(createMetafile({
      metafile: {
        name: diffCardName,
        modified: DateTime.local().valueOf(),
        handler: 'Diff',
        filetype: leftMetafile.filetype,
        loading: [],
        targets: [left.id, right.id]
      }
    })).unwrap();
    dispatch(buildCard({ metafile: diffMetafile }));
    return dispatch(modalRemoved(props.id));
  };

  return (
    <MUI.Dialog id='picker-dialog' data-testid='diff-picker-dialog' role='dialog' open={true} onClose={() => handleClose(true, ['', ''])}>
      <div className='diff-container'>
        <MUI.DialogTitle id='picker-dialog-title' style={{ gridArea: 'header' }}>Select cards to diff</MUI.DialogTitle>
        <MUI.FormControl id='form-control-left' aria-label='Left Form' style={{ gridArea: 'left', width: 100 }}>
          <MUI.InputLabel htmlFor='diff-card-select-left' id='diff-card-select-left-label'>Left</MUI.InputLabel>
          <MUI.Select id='diff-card-select-left' aria-labelledby='diff-card-select-left-label' value={selectedLeft}
            autoWidth={true} onChange={(e) => setSelectedLeft(e.target.value as UUID)} input={<MUI.Input />}>
            {Object.values(cards).filter(card => card.type === 'Editor').map(card => (
              <MUI.MenuItem key={card.id} value={card.id}>
                {card.name} (uuid: ...{card.id.slice(-5)}, modified {DateTime.fromMillis(card.modified).toRelative()})
              </MUI.MenuItem>
            ))}
          </MUI.Select>
        </MUI.FormControl>
        <img className='diff_icon' />
        <MUI.FormControl id='form-control-right' aria-label='Right Form' style={{ gridArea: 'right', width: 100 }}>
          <MUI.InputLabel htmlFor='dif-card-select-right' id='diff-card-select-right-label'>Right</MUI.InputLabel>
          <MUI.Select labelId='diff-card-select-right' id='diff-card-select-right' value={selectedRight}
            autoWidth={true} onChange={(e) => setSelectedRight(e.target.value as UUID)} input={<MUI.Input />}>
            {Object.values(cards).filter(card => card.type === 'Editor').map(card => (
              <MUI.MenuItem key={card.id} value={card.id}>
                {card.name} (uuid: ...{card.id.slice(-5)}, modified {DateTime.fromMillis(card.modified).toRelative()})
              </MUI.MenuItem>
            ))}
          </MUI.Select>
        </MUI.FormControl>
        <MUI.Button style={{ gridArea: 'footer' }} id='diffpickerdialog-button' variant='contained' color='primary' onClick={() => {
          handleClose(false, [selectedLeft, selectedRight]);
        }}>Run Diff</MUI.Button>
      </div>
    </MUI.Dialog >
  );
}

export default DiffPickerDialog;