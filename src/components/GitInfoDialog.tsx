import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, InputLabel, TextField, Checkbox, FormControlLabel } from '@material-ui/core';

//import { setConfig, getRepoRoot } from '../containers/git';

const validateEmail = (email: string): boolean => {
    const regExp = /\S+@\S+\.\S+/;
    return regExp.test(email);
};

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
        console.log(`\nYour new name is: ${name}\n`);
        console.log(`\nYour new email is: ${email}`);
        console.log(`\nYour new information will be written to: ${checked ? "Global .gitconfig" : "Local .gitconfig"}\n`);

        // if (checked) {
        //     setConfig("user.name", name, "", "global");
        //     setConfig("user.email", email, "", "global");
        // } else {
        //     //TODO: how to get the local directory?
        //     // get the repo root with getreporoot, pass that to the setconfig call
        //     const repoRoot = getRepoRoot(); // ?
        //     setConfig("user.name", name, "local directory here", "local");
        //     setConfig("user.email", email, "local directory here", "local");
        // }

        handleClose();
    };

    return (
        <Dialog id="git-info-dialog" open={props.open} onClose={handleClose} aria-labelledby="git-info-dialog" >
            <DialogTitle id='git-info-dialog-title'>Update .gitconfig file information</DialogTitle>
            <InputLabel id="enter-name-label">Enter Username:</InputLabel>
            <TextField id="git-info-dialog-name" value={name} error={!name} onChange={handleNameChange} />
            <InputLabel id="enter-email-label">Enter Email:</InputLabel>
            <TextField id="git-info-dialog-email" value={email} error={!validateEmail(email)} onChange={handleEmailChange} />
            <FormControlLabel
                value="write-to-global-gitconfig"
                control={<Checkbox checked={checked} color="primary" onChange={handleCheck} />}
                label="Overwrite global instead of local .gitconfig file?"
                labelPlacement="top"
            />
            <Button
                id='submit-git-info-button'
                variant='contained'
                color={name && validateEmail(email) ? 'primary' : 'default'}
                onClick={name && validateEmail(email) ? handleClick : () => alert("Please enter a valid name and email.")}>Submit
            </Button>
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