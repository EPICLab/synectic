import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, InputLabel, TextField, Checkbox, FormControlLabel } from '@material-ui/core';

import { setConfig } from '../containers/git';

type GitInfoDialogProps = {
    open: boolean;
    onClose: () => void;
}

export const GitInfoDialog: React.FunctionComponent<GitInfoDialogProps> = props => {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [checked, setChecked] = React.useState(false);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value);
    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
    const handleCheck = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => setChecked(event.target.checked);

    const handleClose = () => {
        setName('');
        setEmail('');
        setChecked(false);
        props.onClose();
    };

    const handleClick = () => {
        const scope = checked ? "global" : "local";
        setConfig(scope, "user.name", name);
        setConfig(scope, "user.email", email);

        handleClose();
    };

    const validateEmail = (email: string): boolean => {
        const regExp = /\S+@\S+\.\S+/;
        return regExp.test(email);
    };

    return (
        <Dialog id="git-info-dialog" open={props.open} onClose={handleClose} aria-labelledby="git-info-dialog" >
            <div className="git-info-dialog-container">
                <DialogTitle id='git-info-dialog-title' style={{ gridArea: 'header' }}>Update .gitconfig file information</DialogTitle>
                <InputLabel id="enter-name-label" style={{ gridArea: 'upper-left' }}>Enter username:</InputLabel>
                <TextField id="git-info-dialog-name"
                    value={name}
                    error={!name}
                    onChange={handleNameChange}
                    style={{ gridArea: 'middle' }}
                />
                <InputLabel id="enter-email-label" style={{ gridArea: 'lower-left' }}>Enter email:</InputLabel>
                <TextField
                    id="git-info-dialog-email"
                    value={email} error={!validateEmail(email)}
                    onChange={handleEmailChange}
                    style={{ gridArea: 'footer' }}
                />
                <InputLabel id="state-label" style={{ gridArea: 'lowest-left' }}>
                    Overwrite global instead of local .gitconfig file?
                </InputLabel>
                <FormControlLabel
                    value="write-to-global-gitconfig"
                    control={<Checkbox checked={checked} color="primary" onChange={handleCheck} />}
                    label=""
                    style={{ gridArea: 'lowest-right' }}
                />
                <Button
                    id='submit-git-info-button'
                    variant='contained'
                    color={name && validateEmail(email) ? 'primary' : 'default'}
                    onClick={name && validateEmail(email) ? handleClick : () => alert("Please enter a valid name and email.")}
                    style={{ gridArea: 'subfooter' }}>Submit
                </Button>
            </div>
        </Dialog >
    );
};

const GitInfoButton: React.FunctionComponent = () => {
    const [open, setOpen] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    return (
        <>
            <Button id='git-info-button' variant='contained' color='primary' onClick={(e) => { handleClick(e) }}>Git Info...</Button>
            <GitInfoDialog open={open} onClose={handleClose} />
        </>
    );
};

export default GitInfoButton;