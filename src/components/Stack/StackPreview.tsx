import React from 'react';
import { usePreview } from 'react-dnd-preview';
import { Card } from '../../store/slices/cards';
import { Stack } from '../../store/slices/stacks';
import CommitButton from '../Button/Commit';
import SaveButton from '../Button/Save';
import StageButton from '../Button/Stage';
import UnstageButton from '../Button/Unstage';
import { DnDItemType } from '../Canvas/Canvas';
import CardComponent from '../Card';

type StackPreviewProps = {
    stack: Stack;
    cards: Card[];
}

const StackPreview: React.FunctionComponent<StackPreviewProps> = props => {
    const { display, itemType, style } = usePreview();

    if (!display) {
        return null;
    }

    return (itemType === DnDItemType.STACK) ?
        <div className='stack' data-testid='stack-component' style={style}>
            <StageButton cardIds={[]} />
            <UnstageButton cardIds={[]} />
            <CommitButton cardIds={[]} />
            <SaveButton cardIds={[]} />
            {props.cards.map(card => <CardComponent key={card.id} {...card} />)}
            {props.children}
        </div> : null;
};

export default StackPreview;