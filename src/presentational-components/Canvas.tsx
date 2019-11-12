import React from 'react';
// eslint-disable-next-line import/named
import { DropTarget, ConnectDropTarget, DropTargetMonitor, XYCoord } from 'react-dnd';
import Card from './Card';
import update from 'immutability-helper';
import ItemTypes from '../components/ItemTypes';
import Button from '@material-ui/core/Button';
import openFileDialog from '../container-components/FileOpen';

type CanvasProps = {
  connectDropTarget: ConnectDropTarget;
}

type CanvasState = {
  cards: { [key: string]: { top: number; left: number; title: string } };
}

class Canvas extends React.Component<CanvasProps, CanvasState> {

  public state: CanvasState = {
    cards: {
      a: { top: 20, left: 80, title: 'Drag me around' },
      b: { top: 180, left: 20, title: 'Drag me too' }
    }
  }

  public createNewCard() {
    this.setState((state) => {
      return { cards: { ...state.cards, ...{ c: { top: 300, left: 80, title: 'Extra card' } } } };
    });
  }

  public render() {
    const { connectDropTarget } = this.props;
    const { cards } = this.state;

    return connectDropTarget(
      <div className='canvas'>
        <Button variant="contained" color="primary" onClick={() => this.createNewCard}>New Card...</Button>
        <Button variant="contained" color="primary" onClick={() => openFileDialog({})}>Open...</Button>
        {Object.keys(cards).map(key => {
          const { left, top, title } = cards[key];
          console.log(`card: ${title}`);
          return (
            <Card key={key} id={key} left={left} top={top}>{title}</Card>
          );
        })}
        {this.props.children}
      </div>
    )
  }

  public moveCard(id: string, left: number, top: number) {
    this.setState(
      update(this.state, {
        cards: {
          [id]: {
            $merge: { left, top }
          }
        }
      })
    )
  }
}

export default DropTarget(
  ItemTypes.CARD,
  {
    drop(
      props: CanvasProps,
      monitor: DropTargetMonitor,
      component: Canvas | null
    ) {
      if (!component) {
        return;
      }
      const item = monitor.getItem();
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);

      if (props.connectDropTarget) console.log(`drop target found for: ${item.id}`);
      component.moveCard(item.id, left, top);
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (connect: any) => ({
    connectDropTarget: connect.dropTarget(),
  })
)(Canvas);