import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Flip } from '@material-ui/icons';
import { useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { RootState } from '../../store/store';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { UUID } from '../../store/types';

/**
 * Button for flipping between the front and back content on a Card object.
 * 
 * @param props - Prop object for card with front and back content.
 * @param props.cardId - Card UUID that should be tracked by this button.
 * @param props.onClickHandler - An injected handler for resolving the flip motion.
 * @param props.mode - Optional mode for switching light and dark themes.
 * @returns {React.Component} A React function component.
 */
const FlipButton = ({ cardId, onClickHandler, mode = 'light' }: { cardId: UUID, onClickHandler: () => void, mode?: Mode }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });

    const isCaptured = card && card.captured !== undefined;

    const handleClick = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        onClickHandler();
    }

    return (
        <>
            {!isCaptured &&
                <Tooltip title='Flip'>
                    <IconButton className={classes.root} aria-label='flip' onClick={handleClick}>
                        <Flip />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default FlipButton;