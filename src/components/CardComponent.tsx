import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDrag } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import { Card } from '../types';
import { ActionKeys } from '../store/actions';
import Explorer, { ExplorerReverse } from './Explorer';
import Editor, { EditorReverse } from './Editor';
import Diff, { DiffReverse } from './Diff';
import { BrowserComponent } from './Browser';
import { makeStyles } from '@material-ui/core';
import { VersionStatusComponent } from './RepoBranchList';

export const useStyles = makeStyles({
  root: {
    color: 'rgba(171, 178, 191, 1.0)',
    fontSize: 'small',
    fontFamily: `'Lato', Georgia, Serif`
  }
});

const Header: React.FunctionComponent<{ title: string }> = props => {
  return <div className='card-header'><span>{props.title}</span>{props.children}</div>;
};

const ContentFront: React.FunctionComponent<Card> = props => {
  switch (props.type) {
    case 'Editor':
      return (<Editor metafileId={props.related[0]} />);
    case 'Diff':
      return (<Diff left={props.related[0]} right={props.related[1]} />);
    case 'Explorer':
      return (<Explorer rootId={props.related[0]} />);
    case 'Browser':
      return (<BrowserComponent />);
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
      return null;
    case 'Tracker':
      return null;
    default:
      return null;
  }
};

/**
 * Backside works: Editor, Explorer,
 * Backside crashes: Diff, Browser, Tracker
 * Unknown (?): Merge
 */

const CardComponent: React.FunctionComponent<Card> = props => {
  const [flipped, setFlipped] = useState(false);
  const dispatch = useDispatch();

  const [{ isDragging }, drag] = useDrag({
    item: { type: 'CARD', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    }),
    canDrag: !props.captured
  });

  const flip = () => setFlipped(!flipped);

  return (
    <div className='card' ref={drag} style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
      <Header title={props.name}>
        <button className='flip' onClick={flip} />
        <button className='close' onClick={() => dispatch({ type: ActionKeys.REMOVE_CARD, id: props.id })} />
      </Header>
      <CSSTransition in={flipped} timeout={600} classNames='flip'>
        <>
          {flipped ? <div className='card-back'><ContentBack {...props} /></div> : <div className='card-front'><ContentFront {...props} /></div>}
        </>
      </CSSTransition>
    </div>
  );
};

export default CardComponent;