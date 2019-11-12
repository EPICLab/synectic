import React, { useState } from 'react';
import { v4 } from 'uuid';
// eslint-disable-next-line import/named
import { ConnectDragSource, DragSource } from 'react-dnd';

import ItemTypes from '../components/ItemTypes';
import Header from './Header';
import Editor from './Editor';

export type CardProps = {
  id: string;
  left: number;
  top: number;

  // Collected Props
  connectDragSource: ConnectDragSource;
  isDragging?: boolean;
}

const Card: React.FunctionComponent<CardProps> = props => {
  const [uuid] = useState<string>(v4());
  const [isHidden, setHiddenState] = useState(false);

  if (props.isDragging || isHidden) {
    return null;
  }

  return props.connectDragSource(
    <div className='card' style={{ left: props.left, top: props.top }}>
      <Header title='test.js'>
        <button className='close' onClick={() => setHiddenState(!isHidden)} />
      </Header>
      <Editor uuid={uuid} code={'// sample code goes here...'} />
      {props.children}
    </div>
  );
}

export default DragSource(
  ItemTypes.CARD,
  {
    beginDrag(props: CardProps) {
      const { id, left, top } = props;
      return { id, left, top };
    }
  },
  (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  })
)(Card);