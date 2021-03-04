import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import * as MUI from '@material-ui/core';

import type { UUID, Modal } from '../types';
import { RootState } from '../store/root';
import { Action, ActionKeys } from '../store/actions';
import { getMetafile } from '../containers/metafiles';
import { loadCard } from '../containers/handlers';

const DiffPickerDialog: React.FunctionComponent<Modal> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const [selectedLeft, setSelectedLeft] = useState<UUID>('');
  const [selectedRight, setSelectedRight] = useState<UUID>('');

  const handleClose = async (canceled: boolean, selected: [UUID, UUID]) => {
    if (canceled || !selected[0] || !selected[1]) {
      dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id });
      return;
    }
    const [left, right] = [cards[selected[0]], cards[selected[1]]];
    if (!left || !right) {
      dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id });
      return;
    }

    const leftMetafile = metafiles[left.metafile];
    const rightMetafile = metafiles[right.metafile];
    const diffCardName = `DIFF<${left.name} on ${leftMetafile?.branch},${right.name} on ${rightMetafile?.branch}>`;
    const diffMetafile = await dispatch(getMetafile({ virtual: { name: diffCardName, handler: 'Diff', targets: [left.id, right.id] } }));
    if (diffMetafile && diffMetafile.handler && leftMetafile && rightMetafile) dispatch(loadCard({ metafile: diffMetafile }));
    dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id });
  };

  return (
    <MUI.Dialog id='picker-dialog' role='dialog' open={true} onClose={() => handleClose(true, ['', ''])}>
      <div className='diff-container'>
        <MUI.DialogTitle id='picker-dialog-title' style={{ gridArea: 'header' }}>Select cards to diff</MUI.DialogTitle>
        <MUI.FormControl id='form-control-left' aria-label='Left Form' style={{ gridArea: 'left', width: 100 }}>
          <MUI.InputLabel htmlFor='diff-card-select-left' id='diff-card-select-left-label'>Left</MUI.InputLabel>
          <MUI.Select id='diff-card-select-left' aria-labelledby='diff-card-select-left-label' value={selectedLeft}
            autoWidth={true} onChange={(e) => setSelectedLeft(e.target.value as UUID)} input={<MUI.Input />}>
            {Object.values(cards).filter(card => card.type === 'Editor').map(card => (
              <MUI.MenuItem key={card.id} value={card.id}>
                {card.name} (uuid: ...{card.id.slice(-5)}, modified {card.modified.toRelative()})
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
                {card.name} (uuid: ...{card.id.slice(-5)}, modified {card.modified.toRelative()})
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