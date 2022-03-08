import React from 'react';
import { IconButton, Snackbar } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { useAppDispatch } from '../../store/hooks';
import { Modal, modalRemoved } from '../../store/slices/modals';

const Notification = (props: Modal) => {
    const message = props.options && props.options['message'] as string;
    const dispatch = useAppDispatch();

    const handleClose = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        dispatch(modalRemoved(props.id));
    };

    const action = (
        <React.Fragment>
            <IconButton
                size='small'
                aria-label='close'
                color='inherit'
                onClick={handleClose}
            >
                <Close fontSize='small' />
            </IconButton>
        </React.Fragment>
    );

    return (
        <div>
            <Snackbar
                open={true}
                autoHideDuration={6000}
                onClose={handleClose}
                message={message}
                action={action}
            />
        </div>
    );
}

export default Notification;