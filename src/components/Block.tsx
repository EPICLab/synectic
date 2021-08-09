import React from 'react';
import { selectAllCards } from '../store/selectors/cards';
import type { Card } from '../types';
import { useAppDispatch } from '../store/hooks';
import { DateTime } from 'luxon';
import { cardAdded } from '../store/slices/cards';
import store from '../store/store';

const Block: React.FunctionComponent = props => {
    const cards = selectAllCards.selectTotal(store.getState());
    const dispatch = useAppDispatch();

    const newCard: Card = {
        id: 't829w0351',
        name: 'card2',
        type: 'Editor',
        metafile: '84354571',
        created: DateTime.fromISO('2014-04-09T08:14:02.371-08:00', { setZone: true }).valueOf(),
        modified: DateTime.fromISO('2014-06-23T21:58:44.507-08:00', { setZone: true }).valueOf(),
        left: 100, top: 50
    }

    const handleClick = () => {
        console.log('adding a new card...');
        console.log(JSON.stringify(cards));
        dispatch(cardAdded(newCard));
    }

    return (
        <div >
            <button onClick={() => handleClick()}>Add Card</button>
            <div>CARDS:</div>
            {Object.values(cards).map(card => <span key={card.id}>{card.id}</span>)}
            {props.children}
        </div>
    );
}

export default Block;