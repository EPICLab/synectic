import React, { useState } from 'react';
import { InputLabel, FormControl, Button, Dialog, Select, Input, MenuItem, DialogTitle } from '@material-ui/core';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { UUID } from '../types';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  }
};

export interface CardSelectProps {
  name: string;
  gridArea: string;
}

const CardSelect = (props: CardSelectProps) => {
  const cards = useSelector((state: RootState) => Object.values(state.cards));
  const [selectedCard, setSelectedCard] = useState('');

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedCard(event.target.value as UUID);
  };

  return (
    <FormControl style={{ gridArea: props.gridArea, width: 100 }}>
      <InputLabel id='diff-card-selection-name-label'>{props.name}</InputLabel>
      <Select labelId='diff-card-selection-name-label' id='diff-card-name' value={selectedCard} autoWidth={true} onChange={handleChange} input={<Input />} MenuProps={MenuProps}>
        {cards.map(card => (
          <MenuItem key={card.id} value={card.id}>
            {card.name} (modified {card.modified.toRelative()})
          </MenuItem>
        ))}
      </Select>
    </FormControl >
  );
}

export interface DiffDialogProps {
  open: boolean;
  onClose: (values: [string, string]) => void;
}

export const DiffDialog = (props: DiffDialogProps) => {
  const { onClose, open } = props;

  const handleClose = () => {
    onClose(['0', '0']);
  };

  const handleLaunch = () => {
    console.log();
    onClose(['1', '1']);
  }

  return (
    <Dialog onClose={handleClose} id='diffpicker-dialog' aria-labelledby='diff-dialog-title' open={open}>
      <div className='container'>
        <DialogTitle id="diff-dialog-title" style={{ gridArea: 'header' }}>Select cards to diff</DialogTitle>
        <CardSelect name='Version A' gridArea='left' />
        <img className='diff_icon' />
        <CardSelect name='Version B' gridArea='right' />
        <Button style={{ gridArea: 'footer' }} id='diffpicker-button' variant='contained' color='primary' onClick={handleLaunch}>Run Diff</Button>
      </div>
    </Dialog>
  );
}

const DiffPicker: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] = useState<[UUID, UUID]>(['', '']);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  }

  const handleClose = (values: [string, string]) => {
    setOpen(false);
    console.log(`handleClose: ${JSON.stringify(values)}`);
    setSelectedValues([values[0], values[1]]);
    console.log(`selectedValues: ${JSON.stringify(selectedValues)}`);
  };

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Diff Cards...</Button>
      <DiffDialog open={open} onClose={handleClose} />
    </>
  )
}

export default DiffPicker;