import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Box, CircularProgress, LinearProgress, Typography } from '@material-ui/core';
import { green, red } from '@material-ui/core/colors';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';

const StyledCheckIcon = withStyles({
    root: {
        height: 22,
        width: 22,
        margin: 4,
        padding: 0,
        verticalAlign: 'middle',
        color: green[500]
    }
})(CheckIcon);

const StyledClearIcon = withStyles({
    root: {
        height: 22,
        width: 22,
        padding: 0,
        margin: 4,
        verticalAlign: 'middle',
        color: red[500]
    }
})(ClearIcon);

const StyledCircularProgress = withStyles({
    root: {
        margin: 4,
        padding: 2,
        verticalAlign: 'middle'
    }
})(CircularProgress);

export type Status =
    | 'Unchecked'
    | 'Running'
    | 'Passing'
    | 'Failing';

const StatusIcon = (props: { status: Status, progress?: number }) => {
    switch (props.status) {
        case 'Running':
            return props.progress ?
                <StyledCircularProgress size={18} variant='determinate' value={props.progress} /> :
                <StyledCircularProgress size={18} />;
        case 'Passing':
            return <StyledCheckIcon />;
        case 'Failing':
            return <StyledClearIcon />;
        default:
            return null;
    }
}

export const LinearProgressWithLabel = (props: { value: number, subtext?: string }) => {
    return (
        <>
            <Box display='flex' alignItems='center' ml={2} mr={1}>
                <Box width='100%' mr={1}>
                    <LinearProgress variant='determinate' {...props} />
                </Box>
                <Box minWidth={35}>
                    <Typography variant='body2' color='textSecondary'>{`${Math.round(props.value,)}%`}</Typography>
                </Box>
            </Box>
            {props.subtext ?
                <Box width='100%' ml={2} mr={1}>
                    <Typography variant='caption' color='textSecondary'>{props.subtext}</Typography>
                </Box>
                : undefined
            }
        </>
    );
}

export default StatusIcon;