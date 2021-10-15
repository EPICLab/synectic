import React, { useState } from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import SaveIcon from '@material-ui/icons/Save';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles, Typography } from '@material-ui/core';
import type { Card } from '../types';
import Editor, { EditorReverse } from './Editor';
import Diff, { DiffReverse } from './Diff';
import Explorer, { ExplorerReverse } from './Explorer';
import SourceControl, { SourceControlReverse } from './SourceControl';
import Browser, { BrowserReverse } from './Browser';
import { ReposOverview } from './ReposOverview';
import { RootState } from '../store/store';
import { createStack, pushCards, popCard } from '../containers/stacks';
import { StyledIconButton } from './StyledIconButton';
import { writeFileAsync } from '../containers/io';
import { updateGitInfo } from '../containers/metafiles';
import { fileSaveDialog } from '../containers/dialogs';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { cardSelectors } from '../store/selectors/cards';
import { stackSelectors } from '../store/selectors/stacks';
import { metafileUpdated } from '../store/slices/metafiles';
import { cardRemoved } from '../store/slices/cards';
import ConflictManager from './ConflictManager';

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
  return <div className='card-header'>
    <div className='title'><Typography>{props.title}</Typography></div>
    <div className='buttons'>{props.children}</div>
  </div>;
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
    case 'ReposTracker':
      return (<ReposOverview />);
    case 'ConflictManager':
      return (<ConflictManager rootId={props.metafile} />)
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
    case 'ReposTracker':
      return null;
    case 'ConflictManager':
      return null;
    default:
      return null;
  }
};

const CardComponent: React.FunctionComponent<Card> = props => {
  const [flipped, setFlipped] = useState(false);
  const cards = useAppSelector((state: RootState) => cardSelectors.selectAll(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectAll(state));
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
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
      const dropTarget = cards.find(c => c.id === props.id);
      const dropSource = item.type === DnDItemType.CARD ?
        cards.find(c => c.id === monitor.getItem().id) :
        stacks.find(s => s.id === monitor.getItem().id);
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards.find(c => c.id === props.id);
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropSource = cards.find(c => c.id === monitor.getItem().id);
          if (dropSource && dropSource.captured) {
            const captureStack = stacks.find(s => s.id === dropSource.captured);
            if (captureStack) dispatch(popCard({ stack: captureStack, card: dropSource, delta: delta }));
          }
          if (dropTarget && dropTarget.captured) {
            const capturingStack = stacks.find(s => s.id === dropTarget.captured);
            if (capturingStack && dropSource) dispatch(pushCards({ stack: capturingStack, cards: [dropSource] }))
          } else {
            if (dropTarget && dropSource)
              dispatch(createStack({ name: 'New Stack', cards: [dropTarget, dropSource], note: 'Contains a new stack of items.' }));
          }
          break;
        }
        case DnDItemType.STACK: {
          if (!props.captured) {
            const dropSource = stacks.find(s => s.id === monitor.getItem().id);
            if (dropTarget && dropSource) dispatch(pushCards({ stack: dropSource, cards: [dropTarget] }));
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
    if (metafile) {
      dispatch(metafileUpdated({ ...metafile, state: 'unmodified' }));
      if (metafile.path && metafile.content) {
        console.log(`saving ${props.name}...`);
        console.log({ metafile });
        await writeFileAsync(metafile.path, metafile.content);
        dispatch(updateGitInfo(metafile.id));
      } else {
        dispatch(fileSaveDialog(metafile));
      }
    }
  }
  const close = () => {
    const dropSource = cards.find(c => c.id === props.id);
    if (props.captured) {
      const captureStack = stacks.find(s => s.id === props.captured);
      if (captureStack && dropSource) dispatch(popCard({ stack: captureStack, card: dropSource }));
    }
    if (dropSource) dispatch(cardRemoved(props.id));
  }

  return (
    <div ref={dragAndDrop} data-testid='card-component' id={props.id}
      className={`card ${(isOver && !props.captured) ? 'drop-source' : ''}`}
      style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}
    >
      <Header title={props.name}>
        {(metafile && metafile.state) &&
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