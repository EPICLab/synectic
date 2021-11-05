import React, { useState } from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import SaveIcon from '@material-ui/icons/Save';
import AutorenewIcon from '@material-ui/icons/Autorenew';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles, Typography } from '@material-ui/core';
import type { Card } from '../../types';
import { RootState } from '../../store/store';
import { createStack, pushCards, popCard } from '../../store/thunks/stacks';
import { StyledIconButton } from '../StyledIconButton';
import { writeFileAsync } from '../../containers/io';
import { fileSaveDialog } from '../../containers/dialogs';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import { metafileUpdated } from '../../store/slices/metafiles';
import { cardRemoved } from '../../store/slices/cards';
import { GitCommitIcon } from '../GitIcons';
import { modalAdded } from '../../store/slices/modals';
import { v4 } from 'uuid';
import { fetchVersionControl, isFileMetafile } from '../../store/thunks/metafiles';
import { ContentBack } from './ContentBack';
import { ContentFront } from './ContentFront';

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

const CardComponent: React.FunctionComponent<Card> = props => {
  const [flipped, setFlipped] = useState(false);
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
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
      const dropTarget = cards[props.id];
      const dropSource = item.type === DnDItemType.CARD ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[props.id];
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropSource = cards[monitor.getItem().id];
          if (dropSource && dropSource.captured) {
            const captureStack = stacks[dropSource.captured];
            if (captureStack) dispatch(popCard({ stack: captureStack, card: dropSource, delta: delta }));
          }
          if (dropTarget && dropTarget.captured) {
            const capturingStack = stacks[dropTarget.captured];
            if (capturingStack && dropSource) dispatch(pushCards({ stack: capturingStack, cards: [dropSource] }))
          } else {
            if (dropTarget && dropSource)
              dispatch(createStack({ name: 'New Stack', cards: [dropTarget, dropSource], note: 'Contains a new stack of items.' }));
          }
          break;
        }
        case DnDItemType.STACK: {
          if (!props.captured) {
            const dropSource = stacks[monitor.getItem().id];
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

  const changes = metafile && metafile.status && ['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(metafile.status);

  const flip = () => setFlipped(!flipped);
  const commit = () => {
    if (metafile && metafile.status) {
      console.log(`${metafile.name} metafile is capable of committing: ${changes}`);
      dispatch(modalAdded({ id: v4(), type: 'CommitDialog', target: metafile.id }));
    }
  }
  const save = async () => {
    if (metafile) {
      dispatch(metafileUpdated({ ...metafile, state: 'unmodified' }));
      if (isFileMetafile(metafile)) {
        console.log(`saving ${props.name}...`);
        console.log({ metafile });
        await writeFileAsync(metafile.path, metafile.content);
        const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
        dispatch(metafileUpdated({ ...metafile, ...vcs }));
      } else {
        dispatch(fileSaveDialog(metafile));
      }
    }
  }
  const close = () => {
    const dropSource = cards[props.id];
    if (props.captured) {
      const captureStack = stacks[props.captured];
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
        {(metafile && metafile.status) &&
          <StyledIconButton aria-label='commit' disabled={!changes} onClick={commit} ><GitCommitIcon /></StyledIconButton>
        }
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