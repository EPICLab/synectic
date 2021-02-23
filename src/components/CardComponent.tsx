import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import { makeStyles } from '@material-ui/core';

import type { Card } from '../types';
import { ActionKeys } from '../store/actions';
import Explorer, { ExplorerReverse } from './Explorer';
import Editor, { EditorReverse } from './Editor';
import Diff, { DiffReverse } from './Diff';
import Browser, { BrowserReverse } from './Browser';
import { VersionStatusComponent } from './RepoBranchList';
import { RootState } from '../store/root';
import { addStack, appendCards, removeCard } from '../containers/stacks';

export const useStyles = makeStyles({
  root: {
    color: 'rgba(171, 178, 191, 1.0)',
    fontSize: 'small',
    fontFamily: '\'Lato\', Georgia, Serif'
  }
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
  const cards = useSelector((state: RootState) => state.cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const dispatch = useDispatch();

  // Enable CardComponent as a drop source (i.e. allowing this card to be draggable)
  const [{ isDragging }, drag] = useDrag({
    item: { type: 'CARD', id: props.id },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Enable CardComponent as a drop target (i.e. allow other elements to be dropped on this card)
  const [{ isOver }, drop] = useDrop({
    accept: ['CARD', 'STACK'],
    canDrop: (item, monitor) => {
      const dropTarget = cards[props.id];
      const dropSource = item.type === 'CARD' ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      return dropTarget.id !== dropSource.id; // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
    },
    drop: (item, monitor) => {
      const dropTarget = cards[props.id];
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case 'CARD': {
          const dropSource = cards[monitor.getItem().id];
          if (dropSource.captured) {
            dispatch(removeCard(stacks[dropSource.captured], dropSource, delta));
          }
          if (dropTarget.captured) {
            const actions = appendCards(stacks[dropTarget.captured], [dropSource]);
            actions.map(action => dispatch(action));
          } else {
            const actions = addStack('test', [dropTarget, dropSource], 'go get some testing');
            actions.map(action => dispatch(action));
          }
          break;
        }
        case 'STACK': {
          if (!props.captured) {
            const dropSource = stacks[monitor.getItem().id];
            const actions = appendCards(dropSource, [dropTarget]);
            actions.map(action => dispatch(action));
          }
          break;
        }
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver() // return isOver prop to highlight drop sources that accept hovered item
    })
  })

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  const flip = () => setFlipped(!flipped);
  const close = () => dispatch({ type: ActionKeys.REMOVE_CARD, id: props.id });

  return (
    <div ref={dragAndDrop}
      className={`card ${(isOver && !props.captured) ? 'drop-source' : ''}`}
      style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}
    >
      <Header title={props.name}>
        <button className='flip' aria-label='button-flip' onClick={flip} />
        <button className='close' onClick={close} />
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