import React from 'react';
import { Button } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Status } from '../Status';
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
    start: () => Promise<void>
};

const TimelineButtons = ({ id, status, mergeable, start }: TimelineButtonsProp) => {
    const styles = useStyles();
    const dispatch = useAppDispatch();

    switch (status) {
        case 'Passing':
            return (
                <Button
                    variant='outlined'
                    color='primary'
                    className={styles.button}
                    onClick={() => dispatch(modalRemoved(id))}>
                    OK
                </Button>
            );
        case 'Failing':
            return (
                <Button
                    variant='outlined'
                    color='primary'
                    className={styles.button}
                    onClick={() => dispatch(modalRemoved(id))}>
                    Close
                </Button>
            );
        default:
            return (
                <Button
                    variant='outlined'
                    color='primary'
                    className={styles.button}
                    disabled={!mergeable}
                    onClick={start}>
                    Merge
                </Button>
            );
    }
}

export default TimelineButtons;