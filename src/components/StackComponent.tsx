import React from 'react';
import { useSelector } from 'react-redux';
import { useDrag } from 'react-dnd';

import { Stack } from '../types';
import { RootState } from '../store/root';
import CardComponent from './CardComponent';
import Editor from './Editor';

const StackComponent: React.FunctionComponent<Stack> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const metafiles = useSelector((state: RootState) => state.metafiles);

  const [{ isDragging }, drag] = useDrag({
    item: { type: 'STACK', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  });

  return <div className='stack' ref={drag} style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
    {props.cards.map(cardId => {
      const card = cards[cardId];
      const metafile = metafiles[card.metafile];
      return (
        <CardComponent key={card.id} {...card}>
          {metafile && <Editor uuid={card.id + '-editor'} mode={'javascript'} code={metafile.content ? metafile.content : ''} />}
        </CardComponent>
      );
    })}
    {props.children}
  </div>
}

export default StackComponent;