import './style.css';
import React, { useState, ReactNode } from 'react';
import Button from '@material-ui/core/Button';
import Card, { CardProps } from './Card';

export type CanvasProps = {
  children?: ReactNode;
}

const names = ['Bob', 'Sally', 'Billy', 'Jeanette', 'Ralph'];

const Canvas: React.FunctionComponent<CanvasProps> = (props: CanvasProps) => {
  const [cards, setCards] = useState<CardProps[]>([{ id: 1, name: 'Henry', offset: 0 }]);

  function createNewCard() {
    const newCards = [...cards];
    const newCard: CardProps = { id: cards.length + 1, name: names[cards.length], offset: (cards.length + 1) * 10 };
    newCards.push(newCard);
    setCards(newCards);
  }

  return (
    <div className='canvas' >
      <Button variant="contained" color="primary" onClick={() => createNewCard()}>New Card...</Button>
      <Button variant="contained" color="primary" onClick={() => console.log(cards)}>Display Cards...</Button>
      {cards.map(c => {
        return (<Card key={c.id} id={c.id} name={c.name} offset={c.offset} />);
      })}
      {props.children}
    </div>
  );
}

export default Canvas;







// // import React, { useState } from 'react';
// import React from 'react';

// interface Canvas {
//   timerID: NodeJS.Timeout | undefined;
//   date: Date;
//   counter: number;
// }


// export class CanvasComponent extends React.Component<Canvas, {}> {

//   constructor(props: Canvas) {
//     super(props);
//     this.state = { date: new Date(), counter: 0 };
//   }

//   componentDidMount() {
//     this.timerID = setInterval(() => this.tick(), 1000);
//   }

//   componentWillUnmount() {
//     if (this.timerID) clearInterval(this.timerID);
//   }

//   tick() {
//     this.setState({ date: new Date() });
//   }

//   click() {
//     this.setState((state: Readonly<{ date: Date; counter: number }>, props: Readonly<{ increment: number }>) => ({
//       counter: state.counter + props.increment
//     }));
//   }

//   render() {
//     return (
//       <div>
//         <h1>Hello, world!</h1>
//         <h2>It is {this.state.date.toLocaleTimeString()}.</h2>
//       </div>
//     );
//   }
// }




// // export function Canvas(): JSX.Element {
// //   const [count, setCount] = useState(0);

// //   return (
// //     <div>
// //       <p>You clicked {count} times</p>
// //       <button onClick={() => setCount(count + 1)}>
// //         Click me
// //       </button>
// //     </div>
// //   )
// // }