import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Close } from '@material-ui/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { popCards } from '../../store/thunks/stacks';
import { cardRemoved } from '../../store/slices/cards';
import { UUID } from '../../store/types';
import { isDefined } from '../../containers/utils';

/**
 * Button for closing and removing card, or popping the card off of a stack if captured. The button is only enabled
 * when the card is defined and not captured.
 * 
 * @param props - A destructured object for named props.
 * @param props.cardId - The Card UUID that should be tracked by this button.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const CloseButton = ({ cardId, enabled = true, mode = 'light' }: { cardId: UUID, enabled?: boolean, mode?: Mode }) => {
    const card = useAppSelector(state => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const close = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to underlying components that might have click event handlers
        (card && card.captured) ? dispatch(popCards({ cards: [card.id] })) : dispatch(cardRemoved(cardId));
    }

    return (enabled && isDefined(card) && !card.captured) ? (
        <Tooltip title='Close'>
            <IconButton className={classes.root} aria-label='close' onClick={close}>
                <Close />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default CloseButton;