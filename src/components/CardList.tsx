import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/root';
import { ActionKeys } from '../store/actions';
import { generateCard } from '../containers/genFakedCards';

const CardListComponent: React.FunctionComponent = () => {
  const cards = (state: RootState) => Object.values(state.cards);
  const listCards = useSelector(cards).map(card => <li key={card.id}>{card.name}</li>);
  const count = useSelector(cards).length;
  const dispatch = useDispatch();

  return <div>
    <div>Count: {count}</div>
    <ul>{listCards}</ul>
    <button onClick={() => {
      const newCard = generateCard(count + 1);
      dispatch({ type: ActionKeys.ADD_CARD, id: newCard.id, card: newCard });
    }}>Add a new card</button>
  </div>
}

export default CardListComponent;