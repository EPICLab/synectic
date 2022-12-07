import { IconButton, Tooltip } from '@material-ui/core';
import { Info } from '@material-ui/icons';
import React from 'react';
import MetadataManual from '../Card/Metadata'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { Mode, useIconButtonStyle } from './useStyledIconButton';

type BranchesButtonProps = {
    onClickHandler?: React.MouseEventHandler<HTMLButtonElement> | undefined;
    enabled?: boolean;
    mode?: Mode;
}

/**
 * Button for switching to the {@link MetadataManual} view by calling the injected `onClickHandler` function.
 * 
 * @param props - A destructured object for named props.
 * @param props.onClickHandler - An injected handler for reacting to a button click event.
 * @param props.enabled - Optional flag for including logic that hides this button if false; defaults to true.
 * @param props.mode - Optional mode for switching between light and dark themes.
 * @returns {React.Component} A React function component.
 */
const MetadataViewButton = ({ onClickHandler, enabled = true, mode = 'light' }: BranchesButtonProps) => {
    const classes = useIconButtonStyle({ mode: mode });

    return enabled ? (
        <Tooltip title='View Metadata'>
            <IconButton
                className={classes.root}
                aria-label='metadata'
                onClick={onClickHandler}
            >
                <Info />
            </IconButton>
        </Tooltip>
    ) : null;
}

export default MetadataViewButton;