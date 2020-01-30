import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useSelector, useDispatch } from 'react-redux';
import { InputLabel, FormControl, Button, Dialog, Select, Input, MenuItem, DialogTitle } from '@material-ui/core';

import { RootState } from '../store/root';
import { UUID, Metafile, Card } from '../types';

import { ActionKeys, Actions } from '../store/actions';

type PickerDialogProps = {
  open: boolean;
  options: Card[];
  onClose: (canceled: boolean, selected: [UUID, UUID]) => void;
}

const PickerDialog: React.FunctionComponent<PickerDialogProps> = props => {
  const [selectedLeft, setSelectedLeft] = useState(props.options[0].id);
  const [selectedRight, setSelectedRight] = useState(props.options[0].id);

  // const handleChange = (e: React.ChangeEvent<{ value: UUID }>) => {
  //   console.log(JSON.stringify(e));
  //   setSelectedLeft(e.target.value);
  //   setSelectedRight(e.target.value);
  // }

  // TODO: Update handleChange to discern whether the update comes from left or right, and update values accordingly
  const handleChange = (value: UUID) => {
    setSelectedLeft(value);
    setSelectedRight(value);
  }

  return (
    <Dialog id='picker-dialog' open={props.open} onClose={() => props.onClose(false, ['', ''])}>
      <div className='container'>
        <DialogTitle id='picker-dialog-title' style={{ gridArea: 'header' }}>Select cards to diff</DialogTitle>
        <FormControl style={{ gridArea: 'left', width: 100 }}>
          <InputLabel id='diff-card-selection-name-label'>Left</InputLabel>
          <Select labelId='diff-card-selection-name-label' id='diff-card-name' value={selectedLeft} autoWidth={true} onChange={(e) => handleChange(e.target.value as UUID)} input={<Input />}>
            {props.options.map(card => (
              <MenuItem key={card.id} value={card.id}>
                {card.name} (modified {card.modified.toRelative()})
          </MenuItem>
            ))}
          </Select>
        </FormControl >
        <img className='diff_icon' />
        <FormControl style={{ gridArea: 'right', width: 100 }}>
          <InputLabel id='diff-card-selection-name-label'>Right</InputLabel>
          <Select labelId='diff-card-selection-name-label' id='diff-card-name' value={selectedRight} autoWidth={true} onChange={(e) => handleChange(e.target.value as UUID)} input={<Input />}>
            {props.options.map(card => (
              <MenuItem key={card.id} value={card.id}>
                {card.name} (modified {card.modified.toRelative()})
          </MenuItem>
            ))}
          </Select>
        </FormControl >
        <Button style={{ gridArea: 'footer' }} id='diffpicker-button' variant='contained' color='primary' onClick={() => props.onClose(false, [selectedLeft, selectedRight])}>Run Diff</Button>
      </div>
    </Dialog >
  );
}

const DiffPickerDialog: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  // const [selected, setSelected] = useState<[UUID, UUID]>(['', '']);
  const cards = useSelector((state: RootState) => state.cards);
  const cardsList = Object.values(cards);
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(!open);
  };

  const handleClose = (canceled: boolean, selected: [UUID, UUID]) => {
    if (!canceled) {
      const left = cards[selected[0]];
      const right = cards[selected[1]];
      const filetype = metafiles[left.related[0]].filetype;
      const metafile: Metafile = {
        id: v4(),
        name: `diff:${left.name}<>${right.name}`,
        path: '',
        filetype: filetype,
        handler: 'Diff',
        modified: DateTime.local()
      };
      const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
      dispatch(addMetafileAction);

      if (metafile.handler) {
        const card: Card = {
          id: v4(),
          name: metafile.name,
          type: metafile.handler,
          related: [metafile.id],
          created: DateTime.local(),
          modified: metafile.modified,
          captured: false,
          left: 10,
          top: 25
        };
        const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
        dispatch(addCardAction);
      }
    }
  };

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Diff Cards...</Button>
      <PickerDialog open={open} options={cardsList} onClose={handleClose} />
    </>
  );
}

export default DiffPickerDialog;