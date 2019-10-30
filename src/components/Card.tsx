import React from 'react';

export type CardProps = {
  id: number;
  name: string;
  offset: number;
}

export type CardState = {
  date: Date;
}

class Card extends React.Component<CardProps, CardState> {

  timerID: NodeJS.Timeout | undefined;

  constructor(props: CardProps) {
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
      <div className='card'>{this.props.id}: {this.props.name}\n
        It is {this.state.date.toLocaleTimeString()}
        {this.props.children}
      </div>);
  }
}

export default Card;