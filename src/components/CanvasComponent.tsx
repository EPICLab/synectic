import React, { useEffect } from 'react';
// eslint-disable-next-line import/named
// import { useDrop, XYCoord } from 'react-dnd';
import { useSelector } from 'react-redux';

import { RootState } from '../store/root';
// import { Canvas } from '../types';
// import { ActionKeys } from '../store/actions';
// import CardComponent from './CardComponent';
// import Editor from './Editor';
// import NewCardComponent from './NewCardDialog';
// import FilePickerDialog from './FilePickerDialog';
// import DiffPicker from './DiffPicker';
// import { Button } from '@material-ui/core';
// import StackComponent from './StackComponent';
// import Diff from './Diff';
// import { loadStack } from '../containers/handlers';

const CanvasComponent: React.FunctionComponent<{ id: string }> = props => {
  const cards = useSelector((state: RootState) => state.cards);

  useEffect(() => {
    Object.values(cards).map(card => console.log(JSON.stringify(card)));
  }, [cards]);

  return (
    <div className='canvas'>
      {props.children}
    </div>
  );
};


// const CanvasComponent: React.FunctionComponent<Canvas> = props => {
//   const cards = useSelector((state: RootState) => state.cards);
//   const cardsList = Object.values(cards);
//   const stacks = useSelector((state: RootState) => state.stacks);
//   const stacksList = Object.values(stacks);
//   const dispatch = useDispatch();

//   const [{ isOver, canDrop }, drop] = useDrop({
//     accept: ['CARD', 'STACK'],
//     collect: monitor => ({
//       isOver: !!monitor.isOver(),
//       canDrop: !!monitor.canDrop()
//     }),
//     drop: (item, monitor) => {
//       const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;

//       console.log(`drop item.type: ${String(item.type)}\nisOver: ${isOver}, canDrop: ${canDrop}`);

//       switch (item.type) {
//         case 'CARD': {
//           const card = cards[monitor.getItem().id];
//           console.log(`card.id: ${card.id}`);
//           dispatch({
//             type: ActionKeys.UPDATE_CARD,
//             id: card.id,
//             card: { ...card, left: Math.round(card.left + delta.x), top: Math.round(card.top + delta.y) }
//           });
//           break;
//         }
//         case 'STACK': {
//           const stack = stacks[monitor.getItem().id];
//           console.log(`stack.id : ${stack.id}s`);
//           dispatch({
//             type: ActionKeys.UPDATE_STACK,
//             id: stack.id,
//             stack: { ...stack, left: Math.round(stack.left + delta.x), top: Math.round(stack.top + delta.y) }
//           });
//           break;
//         }
//         default: {
//           console.log(`default option, no item.type`);
//           break;
//         }
//       }
//     }
//   });

//   const createStack = () => {
//     const actions = loadStack('test', [cardsList[0], cardsList[1]], 'go get some testing');
//     actions.map(action => dispatch(action));
//   }

//   return (
//     <div className='canvas' ref={drop}>
//       <NewCardComponent />
//       <FilePickerDialog />
//       <DiffPicker />
//       <Button id='stack-button' variant='contained' color='primary' onClick={createStack}>Create Stack</Button>
//       {stacksList.map(stack => {
//         return (
//           <StackComponent key={stack.id} {...stack} />
//         );
//       })}
//       {cardsList.map(card => {
//         if (card.captured) return null;

//         switch (card.type) {
//           case CardType.Editor:
//             return (
//               <CardComponent key={card.id} {...card} >
//                 <Editor metafileId={card.related[0]} />
//               </CardComponent>
//             );
//           case CardType.Diff:
//             return (
//               <CardComponent key={card.id} {...card} >
//                 <Diff left={card.related[0]} right={card.related[1]} />
//               </CardComponent>
//             );
//           case CardType.Explorer:
//             return (
//               <CardComponent key={card.id} {...card} >
//                 Empty for now, will hold Explorer pane
//               </CardComponent>
//             );
//           default:
//             return null;
//         }
//       })}
//       {props.children}
//     </div>
//   );
// }

export default CanvasComponent;