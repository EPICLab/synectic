import { IconButton, Tooltip } from '@material-ui/core';
import React from 'react';
import { Autorenew as Flip } from '@material-ui/icons';
import { useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import { RootState } from '../../store/store';
import type { UUID } from '../../types';
import { Mode, useIconButtonStyle } from './useStyledIconButton';

type FlipButtonProps = {
    cardId: UUID,
    onClickHandler: () => void,
    mode?: Mode
}

const FlipButton: React.FunctionComponent<FlipButtonProps> = ({ mode = 'light', cardId, onClickHandler }) => {
    const card = useAppSelector((state: RootState) => cardSelectors.selectById(state, cardId));
    const classes = useIconButtonStyle({ mode: mode });

    return (
        <>
            {card && !card.captured &&
                <Tooltip title='Flip'>
                    <IconButton className={classes.root} aria-label='flip' onClick={onClickHandler}>
                        <Flip />
                    </IconButton>
                </Tooltip>}
        </>
    );
}

export default FlipButton;