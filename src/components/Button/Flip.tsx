import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Flip } from '@material-ui/icons';
import { useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { UUID } from '../../store/types';

type FlipButtonProps = {
    cardId: UUID,
    onClickHandler: () => void,
    enabled?: boolean,
    mode?: Mode
}

/**
 * Button for flipping between the front and back content on a Card object.
 * 
 * @param props - Prop object for card with front and back content.
 * @param props.cardId - Card UUID that should be tracked by this button.
 * @param props.onClickHandler - An injected handler for resolving the flip motion.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching light and dark themes.
 * @returns {React.Component} A React function component.
 */
const FlipButton = ({ cardId, onClickHandler, enabled = true, mode = 'light' }: FlipButtonProps) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });

    const isCaptured = card && card.captured !== undefined;

    const handleClick = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        onClickHandler();
    }

    return (enabled && !isCaptured) ? (
        <Tooltip title='Flip'>
            <IconButton className={classes.root} aria-label='flip' onClick={handleClick}>
                <Flip />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default FlipButton;