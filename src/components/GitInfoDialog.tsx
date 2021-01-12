import React, { useEffect, useState } from 'react';
import { Button, Dialog, DialogTitle, TextField, Checkbox, FormControlLabel } from '@material-ui/core';

import { getConfig, setConfig } from '../containers/git';

type GitInfoDialogProps = {
    open: boolean;
    onClose: () => void;
}

export const GitInfoDialog: React.FunctionComponent<GitInfoDialogProps> = props => {
    const [checked, setChecked] = React.useState(false);
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    
    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value);
    const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);
    const handleCheck = (event: { target: { checked: React.SetStateAction<boolean>; }; }) => setChecked(event.target.checked);
    const validateEmail = (email: string): boolean => /\S+@\S+\.\S+/.test(email);

    const checkGitConfig = async (isChecked: boolean, keyPath: string): Promise<string> => {
        const result = isChecked ? await getConfig(keyPath, true) : await getConfig(keyPath);

        if (!isChecked) return result.scope === "local" ? result.value : "[No value found]";
        else return result.scope !== "none" ? result.value : "[No value found]";
    };

    useEffect(() => {
        const getDefaults = async () => {
            const defaultName = await checkGitConfig(checked, 'user.name');
            const defualtEmail = await checkGitConfig(checked, 'user.email');
            setName(defaultName);
            setEmail(defualtEmail);
        }
        getDefaults();
    }, [checked]);

    const handleClose = async () => {
        setName(await checkGitConfig(false, "user.name"));
        setEmail(await checkGitConfig(false, "user.email"));
        setChecked(false);
        props.onClose();
    };

    const handleClick = async () => {
        const scope = checked ? "global" : "local";
        await setConfig(scope, "user.name", name);
        await setConfig(scope, "user.email", email);
        handleClose();
    };

    return (
        <Dialog id="git-info-dialog" open={props.open} onClose={handleClose} aria-labelledby="git-info-dialog" >
            <div className="git-info-dialog-container">
                <DialogTitle id='git-info-dialog-title' style={{ gridArea: 'header' }}>Update .gitconfig file information</DialogTitle>
                <FormControlLabel
                    value="write-to-global-gitconfig"
                    control={<Checkbox checked={checked} color="primary" onChange={handleCheck} />}
                    label="Overwrite global instead of local .gitconfig file"
                    labelPlacement="end"
                    style={{ gridArea: 'middle' }}
                />
                <TextField 
                    id="git-info-dialog-name"
                    value={name}
                    error={name === "[No value found]" || !name}
                    onChange={handleNameChange}
                    label={"Enter username"}
                    variant="outlined"
                    style={{ gridArea: 'lower-left' }}
                />
                <TextField
                    id="git-info-dialog-email"
                    value={email}
                    error={!validateEmail(email)}
                    onChange={handleEmailChange}
                    label={"Enter email"}
                    variant="outlined"
                    style={{ gridArea: 'lower-right' }}
                />
                <Button
                    id='submit-git-info-button'
                    variant='contained'
                    color={name && validateEmail(email) ? 'primary' : 'default'}
                    onClick={name && validateEmail(email) ? handleClick : () => alert("Please enter a valid name and email.")}
                    style={{ gridArea: 'footer' }}>
                    Submit
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