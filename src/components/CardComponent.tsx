import React from 'react';
import { useDispatch } from 'react-redux';
import { useDrag } from 'react-dnd';
import { Card } from '../types';
import { ActionKeys } from '../store/actions';
import FileExplorerComponent from './FileExplorer';
import Editor from './Editor';
import Diff from './Diff';

const Header: React.FunctionComponent<{ title: string }> = props => {
  return <div className='card-header'><span>{props.title}</span>{props.children}</div>;
};

const Content: React.FunctionComponent<Card> = props => {
  switch (props.type) {
    case 'Editor':
      return (<Editor metafileId={props.related[0]} />);
    case 'Diff':
      return (<Diff left={props.related[0]} right={props.related[1]} />);
    case 'Explorer':
      return (<FileExplorerComponent metaDirId={props.related[0]} />);
    default:
      return null;
  }
};

const CardComponent: React.FunctionComponent<Card> = props => {
  const dispatch = useDispatch();

  const [{ isDragging }, drag] = useDrag({
    item: { type: 'CARD', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    }),
    canDrag: !props.captured
  });

  return (
    <div className='card' ref={drag} style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
      <Header title={props.name}>
        <button className='close' onClick={() => dispatch({ type: ActionKeys.REMOVE_CARD, id: props.id })} />
      </Header>
      <Content {...props} />
    </div>
  );
};

export default CardComponent;