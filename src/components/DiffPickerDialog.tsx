import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useSelector, useDispatch } from 'react-redux';
import { InputLabel, FormControl, Button, Dialog, Select, Input, MenuItem, DialogTitle } from '@material-ui/core';

import { RootState } from '../store/root';
import { UUID, Card, Metafile } from '../types';
import { ActionKeys, Actions } from '../store/actions';

type PickerDialogProps = {
  open: boolean;
  options: Card[];
  onClose: (canceled: boolean, selected: [UUID, UUID]) => void;
}

const PickerDialog: React.FunctionComponent<PickerDialogProps> = props => {
  const [selectedLeft, setSelectedLeft] = useState('');
  const [selectedRight, setSelectedRight] = useState('');

  return (
    <Dialog id='picker-dialog' open={props.open} onClose={() => props.onClose(false, ['', ''])}>
      <div className='container'>
        <DialogTitle id='picker-dialog-title' style={{ gridArea: 'header' }}>Select cards to diff</DialogTitle>
        <FormControl style={{ gridArea: 'left', width: 100 }}>
          <InputLabel id='diff-card-selection-name-label'>Left</InputLabel>
          <Select labelId='diff-card-selection-name-label' id='diff-card-name' value={selectedLeft} autoWidth={true} onChange={(e) => setSelectedLeft(e.target.value as UUID)} input={<Input />}>
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
          <Select labelId='diff-card-selection-name-label' id='diff-card-name' value={selectedRight} autoWidth={true} onChange={(e) => setSelectedRight(e.target.value as UUID)} input={<Input />}>
            {props.options.map(card => (
              <MenuItem key={card.id} value={card.id}>
                {card.name} (modified {card.modified.toRelative()})
          </MenuItem>
            ))}
          </Select>
        </FormControl >
        <Button style={{ gridArea: 'footer' }} id='diffpicker-button' variant='contained' color='primary' onClick={() => {
          console.log(`PickerDialog (Button.onClick): selectedLeft: ${selectedLeft}, selectedRight: ${selectedRight}`); // PickerDialog (Button.onClick): selectedLeft: 1e5fe65f-2661-4271-8035-1dd3be7bdaf3, selectedRight: 5178999f-b1f2-464c-b51c-c35046f39e2f
          props.onClose(false, [selectedLeft, selectedRight]);
        }}>Run Diff</Button>
      </div>
    </Dialog >
  );
}

const DiffPickerDialog: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const cards = useSelector((state: RootState) => state.cards);
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(!open);
  };

  const handleClose = (canceled: boolean, selected: [UUID, UUID]) => {
    if (canceled || !selected[0] || !selected[1]) {
      if (canceled) console.log(`DiffPickerDialog: Canceled`);
      if (!selected[0]) console.log(`DiffPickerDialog: Nothing selected for left`);
      if (!selected[1]) console.log(`DiffPickerDialog: Nothing selected for right`);
      setOpen(!open);
      return;
    }
    const [left, right] = [cards[selected[0]], cards[selected[1]]];
    if (!left || !right) {
      setOpen(!open);
      return;
    }

    const metafile: Metafile = {
      id: v4(),
      name: `${left.name}<>${right.name}`,
      modified: DateTime.local(),
      filetype: metafiles[left.related[0]].filetype,
      handler: 'Diff'
    }
    const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
    dispatch(addMetafileAction);

    const card: Card = {
      id: v4(),
      name: metafile.name,
      type: 'Diff',
      related: [left.id, right.id],
      created: DateTime.local(),
      modified: DateTime.local(),
      captured: false,
      left: 50,
      top: 50
    }
    const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
    dispatch(addCardAction);

    console.log(`DiffPickerDialog: addMetafileAction => ${JSON.stringify(addMetafileAction)}`);
    console.log(`DiffPickerDialog: addCardAction => ${JSON.stringify(addCardAction)}`);
    console.log(`DiffPickerDialog: addMetafileAction and addCardAction should be dispatched...`);

    // if (!canceled && selected[0] && selected[1]) {
    //   const left = cards[selected[0]];
    //   const right = cards[selected[1]];
    //   if (!left || !right) {
    //     console.log(`ERROR: Card not defined, left: ${left}, right: ${right}`);
    //   } else {
    //     const filetype = metafiles[left.related[0]].filetype;
    //     const metafile: Metafile = {
    //       id: v4(),
    //       name: `${left.name}<>${right.name}`,
    //       path: '',
    //       filetype: filetype,
    //       handler: 'Diff',
    //       modified: DateTime.local()
    //     };
    //     const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
    //     dispatch(addMetafileAction);

    //     if (metafile.handler) {
    //       const card: Card = {
    //         id: v4(),
    //         name: metafile.name,
    //         type: metafile.handler,
    //         related: [left.id, right.id],
    //         created: DateTime.local(),
    //         modified: metafile.modified,
    //         captured: false,
    //         left: 10,
    //         top: 25
    //       };
    //       const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
    //       dispatch(addCardAction);
    //     }
    //   }
    // }
    setOpen(!open);
  };

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Diff Cards...</Button>
      <PickerDialog open={open} options={Object.values(cards)} onClose={handleClose} />
    </>
  );
}

export default DiffPickerDialog;