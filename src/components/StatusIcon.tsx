import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { CircularProgress } from '@material-ui/core';
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

const StatusIcon: React.FunctionComponent<{ status: Status }> = props => {
    switch (props.status) {
        case 'Running':
            return <StyledCircularProgress size={18} />;
        case 'Passing':
            return <StyledCheckIcon />;
        case 'Failing':
            return <StyledClearIcon />;
        default:
            return null;
    }
}

export default StatusIcon;