import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Close } from '@material-ui/icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { RootState } from '../../store/store';
import type { UUID } from '../../types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { popCard } from '../../store/thunks/stacks';
import { cardRemoved } from '../../store/slices/cards';

type CloseButtonProps = {
    cardId: UUID,
    mode?: Mode
}

const CloseButton: React.FunctionComponent<CloseButtonProps> = ({ mode = 'light', cardId }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });
    const dispatch = useAppDispatch();

    const close = async () => (card && card.captured) ? dispatch(popCard({ card: card })) : dispatch(cardRemoved(cardId));

    return (
        <>
            {card && !card.captured &&
                <Tooltip title='Close'>
                    <IconButton className={classes.root} aria-label='close' onClick={close}>
                        <Close />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default CloseButton;