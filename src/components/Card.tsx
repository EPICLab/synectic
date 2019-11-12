import '../assets/style.css';
import React, { ReactNode } from 'react';
import { v4 } from 'uuid';
// eslint-disable-next-line import/named
import { DragSource, ConnectDragSource, DragSourceSpec, DragSourceMonitor, DragSourceConnector } from 'react-dnd';

const Types = {
  CARD: 'card',
}

type CardSourceProps = {
  uuid?: string;
  name: string;
  offset: number;
  children?: ReactNode;
  isDragging: boolean;
  connectDragSource: ConnectDragSource;
}

export type CardSourceState = {
  date: Date;
}

const cardSourceSpec: DragSourceSpec<CardSourceProps, { uuid: string | undefined }> = {
  beginDrag: (props: CardSourceProps) => ({ uuid: props.uuid }),
}

const cardSourceCollector = (connect: DragSourceConnector, monitor: DragSourceMonitor) => {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
};

class Card extends React.Component<CardSourceProps, CardSourceState> {

  uuid: string = v4();
  timerID: NodeJS.Timeout | undefined;

  constructor(props: CardSourceProps) {
    super(props);
    this.state = { date: new Date() };
  }

  componentDidMount() {
    this.timerID = setInterval(() => this.tick(), 1000);
  }

  componentWillUnmount() {
    if (this.timerID) {
      clearInterval(this.timerID);
    }
  }

  tick() {
    const dt = new Date();
    dt.setMinutes(dt.getMinutes() + this.props.offset);
    this.setState({ date: dt });
  }

  render() {
    return (
      <div className='card'>{this.props.name}<br />
        Current time:{this.state.date.toLocaleTimeString()}<br />
        {this.props.isDragging && '[Currently dragging]'}
        {this.props.children}
      </div>);
  }
}

export default DragSource(Types.CARD, cardSourceSpec, cardSourceCollector)(Card);