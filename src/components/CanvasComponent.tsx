import React from 'react';
import { useDrop } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';

import type { Canvas } from '../types';
import { RootState } from '../store/root';
import CardComponent from './CardComponent';
import StackComponent from './StackComponent';
import ModalComponent from './ModalComponent';
import { popCard, updateStack } from '../containers/stacks';
import { updateCard } from '../containers/cards';
import { NavMenu } from './NavMenu';
import { NavItemProps } from './NavItem';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { addModal } from '../containers/modals';
import { filePickerDialog } from '../containers/filepicker';
import { loadBranchVersions } from '../containers/branch-tracker';
import { GitGraphButton } from './GitGraphButton';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      backgroundColor: 'rgba(232, 233, 233, 1)',
      padding: theme.spacing(0.25),
    },
  })
);

const isMac = process.platform === 'darwin';

const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const metafiles = useSelector((state: RootState) => Object.values(state.metafiles));
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const modals = useSelector((state: RootState) => Object.values(state.modals));
  const dispatch = useDispatch();
  const classes = useStyles();

  // Enable CanvasComponent as a drop target (i.e. allow cards and stacks to be dropped on the canvas)
  const [, drop] = useDrop({
    accept: ['CARD', 'STACK'],
    canDrop: (_item, monitor) => {
      return !monitor.getItem().captured;
    },
    drop: (item, monitor) => {
      switch (item.type) {
        case 'CARD': {
          const card = cards[monitor.getItem().id];
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!delta) return; // no dragging is occurring, perhaps a card was picked up and dropped without dragging
          if (card.captured) {
            dispatch(popCard(stacks[card.captured], card, delta));
          } else {
            dispatch(updateCard({ ...card, left: Math.round(card.left + delta.x), top: Math.round(card.top + delta.y) }));
          }
          break;
        }
        case 'STACK': {
          const stack = stacks[monitor.getItem().id];
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!delta) return; // no dragging is occurring, perhaps a stack was picked up and dropped without dragging
          dispatch(updateStack({ ...stack, left: Math.round(stack.left + delta.x), top: Math.round(stack.top + delta.y) }));
          break;
        }
        default: {
          console.log('useDrop Error: default option, no item.type found');
          break;
        }
      }
    }
  });

  const showState = () => {
    const allCards = Object.values(cards);
    const allStacks = Object.values(stacks);
    console.log(`CARDS: ${allCards.length}`)
    console.log({ allCards });
    console.log(`STACKS: ${allStacks.length}`)
    console.log({ allStacks });
    console.log(`METAFILES: ${metafiles.length} `);
    console.log({ metafiles });
    console.log(`REPOS: ${repos.length} `);
    console.log({ repos });
    console.log(`FILETYPES: ${filetypes.length} `);
    console.log({ filetypes });
    console.log(`MODALS: ${modals.length} `);
    console.log({ modals });
  }

  const fileMenu: NavItemProps[] = [
    { label: 'New...', click: () => dispatch(addModal({ type: 'NewCardDialog' })) },
    ...(isMac ? [{ label: 'Open...', click: () => dispatch(filePickerDialog()) }] : [
      { label: 'Open File...', click: () => dispatch(filePickerDialog('openFile')) },
      { label: 'Open Directory...', click: () => dispatch(filePickerDialog('openDirectory')) }
    ])
  ];

  const actionMenu: NavItemProps[] = [
    { label: 'Diff...', click: () => dispatch(addModal({ type: 'DiffPicker' })), disabled: (Object.values(cards).length < 2) },
    { label: 'Merge...', click: () => dispatch(addModal({ type: 'MergeSelector' })), disabled: (Object.values(cards).length < 2) },
  ];

  const viewMenu: NavItemProps[] = [
    { label: 'Branches...', click: async () => dispatch(loadBranchVersions()) },
    { label: 'Show All...', click: () => showState() }
  ];

  return (
    <div className='canvas' ref={drop}>
      <div className={classes.root} >
        <NavMenu label='File' submenu={fileMenu} />
        <NavMenu label='Action' submenu={actionMenu} />
        <NavMenu label='View' submenu={viewMenu} />
      </div>
      <GitGraphButton />
      {Object.values(stacks).map(stack => <StackComponent key={stack.id} {...stack} />)}
      {Object.values(cards).filter(card => !card.captured).map(card => <CardComponent key={card.id} {...card} />)}
      {modals.map(modal => <ModalComponent key={modal.id} {...modal} />)}
      {props.children}
    </div >
  );
}

export default CanvasComponent;