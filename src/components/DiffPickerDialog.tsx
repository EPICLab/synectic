import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { InputLabel, FormControl, Button, Dialog, Select, Input, MenuItem, DialogTitle } from '@material-ui/core';

import { RootState } from '../store/root';
import { UUID, Card } from '../types';
import { Action } from '../store/actions';
import { getMetafile } from '../containers/metafiles';
import { loadCard } from '../containers/handlers';

type DialogProps = {
  open: boolean;
  options: Card[];
  onClose: (canceled: boolean, selected: [UUID, UUID]) => void;
}

export const DiffPickerDialog: React.FunctionComponent<DialogProps> = props => {
  const [selectedLeft, setSelectedLeft] = useState<UUID>('');
  const [selectedRight, setSelectedRight] = useState<UUID>('');

  return (
    <Dialog id='picker-dialog' role='dialog' open={props.open} onClose={() => props.onClose(false, ['', ''])}>
      <div className='diff-container'>
        <DialogTitle id='picker-dialog-title' style={{ gridArea: 'header' }}>Select cards to diff</DialogTitle>
        <FormControl id='form-control-left' aria-label='Left Form' style={{ gridArea: 'left', width: 100 }}>
          <InputLabel htmlFor='diff-card-select-left' id='diff-card-select-left-label'>Left</InputLabel>
          <Select id='diff-card-select-left' aria-labelledby='diff-card-select-left-label' value={selectedLeft}
            autoWidth={true} onChange={(e) => setSelectedLeft(e.target.value as UUID)} input={<Input />}>
            {props.options.filter(card => card.type === 'Editor').map(card => (
              <MenuItem key={card.id} value={card.id}>
                {card.name} (modified {card.modified.toRelative()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <img className='diff_icon' />
        <FormControl id='form-control-right' style={{ gridArea: 'right', width: 100 }}>
          <InputLabel htmlFor='dif-card-select-right' id='diff-card-select-right-label'>Right</InputLabel>
          <Select labelId='diff-card-select-right' id='diff-card-select-right' value={selectedRight}
            autoWidth={true} onChange={(e) => setSelectedRight(e.target.value as UUID)} input={<Input />}>
            {props.options.filter(card => card.type === 'Editor').map(card => (
              <MenuItem key={card.id} value={card.id}>
                {card.name} (modified {card.modified.toRelative()})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button style={{ gridArea: 'footer' }} id='diffpickerdialog-button' variant='contained' color='primary' onClick={() => {
          props.onClose(false, [selectedLeft, selectedRight]);
        }}>Run Diff</Button>
      </div>
    </Dialog >
  );
}


const DiffPickerButton: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const cards = useSelector((state: RootState) => state.cards);
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

  const handleClose = async (canceled: boolean, selected: [UUID, UUID]) => {
    if (canceled || !selected[0] || !selected[1]) {
      setOpen(!open);
      return;
    }
    const [left, right] = [cards[selected[0]], cards[selected[1]]];
    if (!left || !right) {
      setOpen(!open);
      return;
    }

    const leftMetafile = await dispatch(getMetafile({ id: left.related[0] }));
    const rightMetafile = await dispatch(getMetafile({ id: right.related[0] }));
    const diffCardName = `DIFF<${left.name} on ${leftMetafile?.branch},${right.name} on ${rightMetafile?.branch}>`;
    const diffMetafile = await dispatch(getMetafile({ virtual: { name: diffCardName, handler: 'Diff' } }));
    if (diffMetafile && diffMetafile.handler && leftMetafile && rightMetafile) dispatch(loadCard({ metafiles: [diffMetafile, leftMetafile, rightMetafile] }));
    setOpen(!open);
  };

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' disabled={Object.values(cards).length < 2} onClick={() => setOpen(!open)}>Diff...</Button>
      <DiffPickerDialog open={open} options={Object.values(cards)} onClose={() => handleClose} />
    </>
  );
}

export default DiffPickerButton;