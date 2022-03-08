import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Flip } from '@material-ui/icons';
import { useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { RootState } from '../../store/store';
import { Mode, useIconButtonStyle } from './useStyledIconButton';
import { UUID } from '../../store/types';

const FlipButton = ({ cardId, onClickHandler, mode = 'light' }: { cardId: UUID, onClickHandler: () => void, mode?: Mode }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });

    const isCaptured = card && card.captured !== undefined;

    return (
        <>
            {!isCaptured &&
                <Tooltip title='Flip'>
                    <IconButton className={classes.root} aria-label='flip' onClick={onClickHandler}>
                        <Flip />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default FlipButton;