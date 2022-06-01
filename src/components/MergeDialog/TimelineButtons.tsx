import React from 'react';
import { Button } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Status } from '../StatusIcon';
import { useAppDispatch } from '../../store/hooks';
import { modalRemoved } from '../../store/slices/modals';
import { UUID } from '../../store/types';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        button: {
            margin: theme.spacing(1),
        },
    }),
);

type TimelineButtonsProp = {
    id: UUID,
    status: Status,
    mergeable: boolean,
    check: () => Promise<void>
};

const TimelineButtons = ({ id, status, mergeable, check }: TimelineButtonsProp) => {
    const classes = useStyles();
    const dispatch = useAppDispatch();

    switch (status) {
        case 'Passing':
            return (
                <Button
                    variant='outlined'
                    color='primary'
                    className={classes.button}
                    onClick={() => dispatch(modalRemoved(id))}>
                    OK
                </Button>
            );
        case 'Failing':
            return (
                <Button
                    variant='outlined'
                    color='primary'
                    className={classes.button}
                    onClick={() => dispatch(modalRemoved(id))}>
                    Close
                </Button>
            );
        default:
            return (
                <Button
                    variant='outlined'
                    color='primary'
                    className={classes.button}
                    disabled={!mergeable}
                    onClick={check}>
                    Merge
                </Button>
            );
    }
}

export default TimelineButtons;