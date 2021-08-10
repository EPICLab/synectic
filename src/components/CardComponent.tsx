import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';

import SaveIcon from '@material-ui/icons/Save';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core';

import type { Card } from '../types';
import Editor, { EditorReverse } from './Editor';
import Diff, { DiffReverse } from './Diff';
import Explorer, { ExplorerReverse } from './Explorer';
import SourceControl, { SourceControlReverse } from './SourceControl';
import Browser, { BrowserReverse } from './Browser';
import { VersionStatusComponent } from './RepoBranchList';
import ActionKeys, { RootState } from '../store/store';
import { createStack, pushCards, popCard } from '../containers/stacks';
import { StyledIconButton } from './StyledIconButton';
import { writeFileAsync } from '../containers/io';
import { updateGitInfo } from '../containers/metafiles';
import { fileSaveDialog } from '../containers/dialogs';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllMetafiles } from '../store/selectors/metafiles';
import { selectAllCards } from '../store/selectors/cards';
import { selectAllStacks } from 'src/store/selectors/stacks';

const DnDItemType = {
  CARD: 'CARD',
  STACK: 'STACK'
}
type DragObject = {
  id: string,
  type: string
}

export const useStyles = makeStyles({
  root: {
    color: 'rgba(171, 178, 191, 1.0)',
    fontSize: 'small',
    fontFamily: '\'Lato\', Georgia, Serif'
  },
});

const Header: React.FunctionComponent<{ title: string }> = props => {
  return <div className='card-header'><span>{props.title}</span>{props.children}</div>;
};

const ContentFront: React.FunctionComponent<Card> = props => {
  switch (props.type) {
    case 'Editor':
      return (<Editor metafileId={props.metafile} />);
    case 'Diff':
      return (<Diff metafileId={props.metafile} />);
    case 'Explorer':
      return (<Explorer rootId={props.metafile} />);
    case 'SourceControl':
      return (<SourceControl rootId={props.metafile} />);
    case 'Browser':
      return (<Browser />);
    case 'Tracker':
      return (<VersionStatusComponent />);
    default:
      return null;
  }
};

const ContentBack: React.FunctionComponent<Card> = props => {
  switch (props.type) {
    case 'Editor':
      return (<EditorReverse {...props} />);
    case 'Diff':
      return (<DiffReverse {...props} />);
    case 'Explorer':
      return (<ExplorerReverse {...props} />);
    case 'SourceControl':
      return (<SourceControlReverse {...props} />);
    case 'Browser':
      return (<BrowserReverse {...props} />);
    case 'Tracker':
      return null;
    default:
      return null;
  }
};

const CardComponent: React.FunctionComponent<Card> = props => {
  const [flipped, setFlipped] = useState(false);
  const cards = useAppSelector((state: RootState) => selectAllCards.selectAll(state));
  const stacks = useAppSelector((state: RootState) => selectAllStacks.selectAll(state));
  const metafile = useAppSelector((state: RootState) => selectAllMetafiles.selectById(state, props.id));
  const dispatch = useAppDispatch();

  // Enable CardComponent as a drop source (i.e. allowing this card to be draggable)
  const [{ isDragging }, drag] = useDrag({
    type: DnDItemType.CARD,
    item: () => ({ id: props.id, type: DnDItemType.CARD }),
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }, [props.id]);

  // Enable CardComponent as a drop target (i.e. allow other elements to be dropped on this card)
  const [{ isOver }, drop] = useDrop({
    accept: [DnDItemType.CARD, DnDItemType.STACK],
    canDrop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[props.id];
      const dropSource = item.type === DnDItemType.CARD ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      return dropTarget.id !== dropSource.id; // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[props.id];
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropSource = cards[monitor.getItem().id];
          if (dropSource.captured) {
            dispatch(popCard(stacks[dropSource.captured], dropSource, delta));
          }
          if (dropTarget.captured) {
            const actions = pushCards(stacks[dropTarget.captured], [dropSource]);
            actions.map(action => dispatch(action));
          } else {
            const actions = createStack('New Stack', [dropTarget, dropSource], 'Contains a new stack of items.');
            actions.map(action => dispatch(action));
          }
          break;
        }
        case DnDItemType.STACK: {
          if (!props.captured) {
            const dropSource = stacks[monitor.getItem().id];
            const actions = pushCards(dropSource, [dropTarget]);
            actions.map(action => dispatch(action));
          }
          break;
        }
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver() // return isOver prop to highlight drop sources that accept hovered item
    })
  }, [cards, stacks, props.id]);

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  const flip = () => setFlipped(!flipped);
  const save = async () => {
    dispatch({
      type: ActionKeys.UPDATE_METAFILE,
      id: metafile.id,
      metafile: { ...metafile, state: 'unmodified' }
    });
    if (metafile.path && metafile.content) {
      console.log(`saving ${props.name}...`);
      console.log({ metafile });
      await writeFileAsync(metafile.path, metafile.content);
      dispatch(updateGitInfo(metafile.id));
    } else {
      dispatch(fileSaveDialog(metafile));
    }
  }
  const close = () => {
    if (props.captured) dispatch(popCard(stacks[props.captured], cards[props.id]));
    dispatch({ type: ActionKeys.REMOVE_CARD, id: props.id });
  }

  return (
    <div ref={dragAndDrop} data-testid='card-component' id={props.id}
      className={`card ${(isOver && !props.captured) ? 'drop-source' : ''}`}
      style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}
    >
      <Header title={props.name}>
        {metafile.state &&
          <StyledIconButton aria-label='save' disabled={metafile.state === 'unmodified'} onClick={save} ><SaveIcon /></StyledIconButton>
        }
        <StyledIconButton aria-label='flip' onClick={flip} ><AutorenewIcon /></StyledIconButton>
        <StyledIconButton aria-label='close' onClick={close} ><CloseIcon /></StyledIconButton>
      </Header>
      <CSSTransition in={flipped} timeout={600} classNames='flip'>
        <>
          {flipped ?
            <div className='card-back'><ContentBack {...props} /></div> :
            <div className='card-front'><ContentFront {...props} /></div>}
        </>
      </CSSTransition>
    </div>
  );
};

export default CardComponent;