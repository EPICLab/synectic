import { Theme, createStyles, makeStyles } from '@material-ui/core/styles';
import { shell } from 'electron';
import { DateTime } from 'luxon';
import React, { useContext } from 'react';
import { DropTargetMonitor, useDrop } from 'react-dnd';
import { v4 } from 'uuid';
import version from '../../../version';
import { fileOpenDialog } from '../../containers/dialogs';
import { FSCacheContext } from '../../store/cache/FSCache';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cacheSelectors from '../../store/selectors/cache';
import cardSelectors from '../../store/selectors/cards';
import filetypeSelectors from '../../store/selectors/filetypes';
import metafileSelectors from '../../store/selectors/metafiles';
import modalSelectors from '../../store/selectors/modals';
import repoSelectors from '../../store/selectors/repos';
import stackSelectors from '../../store/selectors/stacks';
import { cardUpdated } from '../../store/slices/cards';
import { Modal, modalAdded } from '../../store/slices/modals';
import { stackUpdated } from '../../store/slices/stacks';
import redux from '../../store/store';
import { addBranchCard } from '../../store/thunks/cards';
import { popCards } from '../../store/thunks/stacks';
import CardComponent from '../Card';
import GitGraphSelect from '../GitGraph/GitGraphSelect';
import ModalComponent from '../Modal';
import { NavItemProps } from '../NavItem/NavItem';
import NavMenu from '../NavMenu';
import Stack from '../Stack';

export enum DnDItemType {
  CARD = 'CARD',
  STACK = 'STACK',
  BRANCH = 'BRANCH'
}

type DragObject = {
  id: string,
  type: string
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    navBar: {
      display: 'flex',
      backgroundColor: 'rgba(232, 233, 233, 1)',
      padding: theme.spacing(0.25),
    },
  })
);

const isMac = process.platform === 'darwin';

const Canvas = () => {
  const cardsArray = useAppSelector(state => cardSelectors.selectAll(state));
  const stacksArray = useAppSelector(state => stackSelectors.selectAll(state));
  const stacks = useAppSelector(state => stackSelectors.selectEntities(state));
  const cards = useAppSelector(state => cardSelectors.selectEntities(state));
  const filetypes = useAppSelector(state => filetypeSelectors.selectAll(state));
  const metafiles = useAppSelector(state => metafileSelectors.selectAll(state));
  const cache = useAppSelector(state => cacheSelectors.selectAll(state));
  const repos = useAppSelector(state => repoSelectors.selectAll(state));
  const branches = useAppSelector(state => branchSelectors.selectAll(state));
  const modals = useAppSelector(state => modalSelectors.selectAll(state));
  const [watchers] = useContext(FSCacheContext);
  const dispatch = useAppDispatch();
  const styles = useStyles();

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
            dispatch(popCards({ cards: [card.id], delta: delta }));
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

  const showStore = () => {
    console.group(`Redux Store : ${DateTime.local().toHTTP()}`);
    console.log(`STACKS [${Object.keys(stacks).length}]`, stacks);
    console.log(`CARDS [${Object.keys(cards).length}]`, cards);
    console.log(`FILETYPES [${filetypes.length}]`);
    console.log(`METAFILES [${metafiles.length}]`, metafiles);
    console.log(`CACHE [${cache.length}]`, cache);
    console.log(`REPOS [${repos.length}]`, repos);
    console.log(`BRANCHES [${branches.length}]`, branches);
    console.log(`MODALS [${modals.length}]`, modals);
    console.groupEnd();
  }

  const showCache = () => {
    console.group(`FS Cache : ${DateTime.local().toHTTP()}`);
    console.log(`CACHE [${cache.length}]`, cache);
    const watchersArray = Array.from(watchers.keys()).map(k => ({ path: k.toString() }));
    console.log(`WATCHERS [${watchersArray.length}]`, watchersArray);
    console.groupEnd();
  }

  const newCardDialogModal: Modal = {
    id: v4(),
    type: 'NewCardDialog'
  }
  const fileMenu: NavItemProps[] = [
    { label: 'New...', click: () => dispatch(modalAdded(newCardDialogModal)) },
    ...(isMac ? [{ label: 'Open...', click: () => dispatch(fileOpenDialog()) }] : [
      { label: 'Open File...', click: () => dispatch(fileOpenDialog('openFile')) },
      { label: 'Open Directory...', click: () => dispatch(fileOpenDialog('openDirectory')) },
    ]),
    { label: 'Clone...', click: () => dispatch(modalAdded({ id: v4(), type: 'CloneSelector' })) },
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
  const gitExplorerModal: Modal = {
    id: v4(),
    type: 'GitExplorer'
  }
  const actionMenu: NavItemProps[] = [
    { label: 'Diff...', disabled: (Object.values(cards).length < 2), click: () => dispatch(modalAdded(diffPickerModal)) },
    { label: 'Merge...', disabled: (Object.values(repos).length == 0), click: () => dispatch(modalAdded(mergeSelectorModal)) },
    { label: 'Run...', click: () => dispatch(modalAdded(gitExplorerModal)) },
  ];

  const viewMenu: NavItemProps[] = [
    { label: 'Source Control...', disabled: (Object.values(repos).length == 0), click: () => dispatch(modalAdded(sourcePickerModal)) },
    { label: 'Branches...', click: async () => dispatch(addBranchCard()) },
  ];

  const sysMenu: NavItemProps[] = [
    { label: 'View Datastore...', click: () => showStore() },
    { label: 'View Cache...', click: () => showCache() },
    { label: 'Clear Datastore...', click: async () => redux.persistor.purge() },
  ];

  const helpMenu: NavItemProps[] = [
    { label: 'Website...', click: async () => { shell.openExternal('https://nomatic.dev/synectic'); } },
    { label: 'Repository...', click: async () => { shell.openExternal('https://github.com/EPICLab/synectic/'); } },
    { label: 'Release Notes...', click: async () => { shell.openExternal('https://github.com/EPICLab/synectic/releases'); } },
    { label: 'View License...', click: async () => { shell.openExternal('https://github.com/EPICLab/synectic/blob/5ec51f6dc9dc857cae58c5253c3334c8f33a63c4/LICENSE'); } },
    {
      label: 'Version', click: () => dispatch(modalAdded({
        id: v4(), type: 'Notification',
        options: { 'message': `Synectic v${version}` }
      }))
    }
  ];

  return (
    <div className='canvas' ref={drop} data-testid='canvas-component'>
      <div className={styles.navBar} >
        <NavMenu label='File' submenu={fileMenu} />
        <NavMenu label='Action' submenu={actionMenu} />
        <NavMenu label='View' submenu={viewMenu} />
        <NavMenu label='System' submenu={sysMenu} />
        <NavMenu label='Help' submenu={helpMenu} />
        <GitGraphSelect />
      </div>
      {stacksArray.map(stack => <Stack key={stack.id} {...stack} />)}
      {cardsArray.filter(card => !card.captured).map(card => <CardComponent key={card.id} {...card} />)}
      {modals.map(modal => <ModalComponent key={modal.id} {...modal} />)}
    </div >
  );
}

export default Canvas;