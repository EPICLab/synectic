import React, { useContext } from 'react';
import { shell } from 'electron';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { v4 } from 'uuid';
import type { Modal } from '../types';
import CardComponent from './Card/CardComponent';
import StackComponent from './Stack/StackComponent';
import ModalComponent from './ModalComponent';
import { popCard } from '../store/thunks/stacks';
import { stackUpdated } from '../store/slices/stacks';
import { NavMenu, NavItemProps } from './NavMenu';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { fileOpenDialog } from '../containers/dialogs';
import { loadBranchVersions } from '../containers/branch-tracker';
import { GitGraphSelect } from './GitGraph/GitGraphSelect';
import { cardUpdated } from '../store/slices/cards';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import cardSelectors from '../store/selectors/cards';
import redux, { RootState } from '../store/store';
import stackSelectors from '../store/selectors/stacks';
import metafileSelectors from '../store/selectors/metafiles';
import filetypeSelectors from '../store/selectors/filetypes';
import repoSelectors from '../store/selectors/repos';
import modalSelectors from '../store/selectors/modals';
import { modalAdded } from '../store/slices/modals';
import { FSCache } from './Cache/FSCache';

const DnDItemType = {
  CARD: 'CARD',
  STACK: 'STACK'
}
type DragObject = {
  id: string,
  type: string
}

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

const CanvasComponent: React.FunctionComponent = props => {
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const cardsArray = useAppSelector((state: RootState) => cardSelectors.selectAll(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
  const stacksArray = useAppSelector((state: RootState) => stackSelectors.selectAll(state));
  const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectAll(state));
  const filetypes = useAppSelector((state: RootState) => filetypeSelectors.selectAll(state));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const modals = useAppSelector((state: RootState) => modalSelectors.selectAll(state));
  const dispatch = useAppDispatch();
  const classes = useStyles();
  const { cache, reset } = useContext(FSCache);

  // Enable CanvasComponent as a drop target (i.e. allow cards and stacks to be dropped on the canvas)
  const [, drop] = useDrop({
    accept: [DnDItemType.CARD, DnDItemType.STACK],
    drop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      switch (item.type) {
        case DnDItemType.CARD: {
          const card = cards[monitor.getItem().id];
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!card || !delta) return; // no dragging is occurring, perhaps a card was picked up and dropped without dragging
          if (card.captured) {
            dispatch(popCard({ card: card, delta: delta }));
          } else {
            dispatch(cardUpdated({ ...card, left: Math.round(card.left + delta.x), top: Math.round(card.top + delta.y) }));
          }
          break;
        }
        case DnDItemType.STACK: {
          const stack = stacks[monitor.getItem().id];
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!delta) return; // no dragging is occurring, perhaps a stack was picked up and dropped without dragging
          if (stack) dispatch(stackUpdated({ ...stack, left: Math.round(stack.left + delta.x), top: Math.round(stack.top + delta.y) }));
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
    console.log(`CARDS: ${cardsArray.length}`)
    console.log({ cards });
    console.log(`STACKS: ${stacksArray.length}`)
    console.log({ stacks });
    console.log(`METAFILES: ${metafiles.length} `);
    console.log({ metafiles });
    console.log(`REPOS: ${repos.length} `);
    console.log({ repos });
    console.log(`FILETYPES: ${filetypes.length} `);
    console.log({ filetypes });
    console.log(`MODALS: ${modals.length} `);
    console.log({ modals });
  }

  const newCardDialogModal: Modal = {
    id: v4(),
    type: 'NewCardDialog'
  }
  const fileMenu: NavItemProps[] = [
    { label: 'New...', click: () => dispatch(modalAdded(newCardDialogModal)) },
    ...(isMac ? [{ label: 'Open...', click: () => dispatch(fileOpenDialog()) }] : [
      { label: 'Open File...', click: () => dispatch(fileOpenDialog('openFile')) },
      { label: 'Open Directory...', click: () => dispatch(fileOpenDialog('openDirectory')) }
    ])
  ];

  const diffPickerModal: Modal = {
    id: v4(),
    type: 'DiffPicker'
  }
  const mergeSelectorModal: Modal = {
    id: v4(),
    type: 'MergeSelector'
  }
  const sourcePickerModal: Modal = {
    id: v4(),
    type: 'SourcePicker'
  }
  const cloneSelectorModal: Modal = {
    id: v4(),
    type: 'CloneSelector'
  }
  const actionMenu: NavItemProps[] = [
    { label: 'Diff...', disabled: (Object.values(cards).length < 2), click: () => dispatch(modalAdded(diffPickerModal)) },
    { label: 'Merge...', disabled: (Object.values(repos).length == 0), click: () => dispatch(modalAdded(mergeSelectorModal)) },
    { label: 'Source Control...', disabled: (Object.values(repos).length == 0), click: () => dispatch(modalAdded(sourcePickerModal)) },
    { label: 'Clone...', click: () => dispatch(modalAdded(cloneSelectorModal)) },
  ];

  const viewMenu: NavItemProps[] = [
    { label: 'Branches...', click: async () => dispatch(loadBranchVersions()) },
    { label: 'Show All...', click: () => showState() },
  ];

  const sysMenu: NavItemProps[] = [
    { label: 'Clear Datastore...', click: async () => redux.persistor.purge() },
    { label: 'View Cache...', click: async () => console.log({ cache }) },
    { label: 'Clear Cache...', click: async () => await reset() },
  ];

  const helpMenu: NavItemProps[] = [
    {
      label: 'GitHub Repo...', click: async () => {
        shell.openExternal('https://github.com/EPICLab/synectic/');
      }
    },
  ];

  return (
    <div className='canvas' ref={drop} data-testid='canvas-component'>
      <div className={classes.root} >
        <NavMenu label='File' submenu={fileMenu} />
        <NavMenu label='Action' submenu={actionMenu} />
        <NavMenu label='View' submenu={viewMenu} />
        <NavMenu label='System' submenu={sysMenu} />
        <NavMenu label='Help' submenu={helpMenu} />
        <GitGraphSelect />
      </div>
      {stacksArray.map(stack => <StackComponent key={stack.id} {...stack} />)}
      {cardsArray.filter(card => !card.captured).map(card => <CardComponent key={card.id} {...card} />)}
      {modals.map(modal => <ModalComponent key={modal.id} {...modal} />)}
      {props.children}
    </div >
  );
}

export default CanvasComponent;