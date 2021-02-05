import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, FormControlLabel, Switch, TextField, Typography } from '@material-ui/core';
import { getConfig, setConfig } from '../containers/git';
import isEmail from 'validator/lib/isEmail';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      flexWrap: 'wrap'
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 240,
      width: '25ch',
    },
    button: {
      float: 'right',
      margin: theme.spacing(1)
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      minWidth: 240,
      width: '25ch',
    }
  })
);

export const GitConfigForm: React.FunctionComponent<{ open: boolean }> = props => {
  const [globalCheck, setGlobalCheck] = useState(false);
  const [existingUsername, setExistingUsername] = useState('');
  const [existingEmail, setExistingEmail] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const classes = useStyles();

  useEffect(() => {
    const getConfigs = async () => {
      const retrievedUsername = globalCheck ? await getConfig('user.name', true) : await getConfig('user.name');
      const retrievedEmail = globalCheck ? await getConfig('user.email', true) : await getConfig('user.email');
      setExistingUsername(retrievedUsername.scope !== 'none' ? retrievedUsername.value : '');
      setExistingEmail(retrievedEmail.scope !== 'none' ? retrievedEmail.value : '');
      setUsername(retrievedUsername.scope !== 'none' ? retrievedUsername.value : '');
      setEmail(retrievedEmail.scope !== 'none' ? retrievedEmail.value : '');
    };
    getConfigs();
  }, [globalCheck]);

  const isUpdateReady = () => (isEmail(email) && (username != existingUsername || email != existingEmail));
  const usernameChange = (event: React.ChangeEvent<{ value: string }>) => setUsername(event.target.value);
  const emailChange = (event: React.ChangeEvent<{ value: string }>) => setEmail(event.target.value);

  const setConfigs = async () => {
    console.log(`updating git-config values: username => ${username}, email => ${email}`);
    const scope = globalCheck ? 'global' : 'local';
    await setConfig(scope, 'user.name', username);
    if (isEmail(email)) await setConfig(scope, 'user.email', email);
  }

  if (!props.open) return null;
  return (
    <>
      <FormControlLabel
        className={classes.formControl}
        value='write-to-global-gitconfig'
        control={
          <Switch
            checked={globalCheck}
            color='primary'
            onChange={(e) => setGlobalCheck(e.target.checked)}
            inputProps={{ 'aria-label': 'global-config-switch' }}
          />
        }
        label={<Typography color='textSecondary' variant='body2'>Global config only</Typography>}
        labelPlacement='end'
      />
      <Button
        className={classes.button}
        variant='outlined'
        color='primary'
        disabled={!isUpdateReady()}
        onClick={setConfigs}
      >Update Configs</Button>
      <TextField
        id='git-info-dialog-name'
        variant='outlined'
        size='small'
        className={classes.textField}
        label='Username'
        value={username}
        onChange={usernameChange}
      />
      <TextField
        id='git-info-dialog-email'
        variant='outlined'
        size='small'
        className={classes.textField}
        label='Email'
        value={email}
        onChange={emailChange}
        error={email.length > 0 && !isEmail(email)}
        helperText={(email.length > 0 && !isEmail(email)) ? 'Valid email address required.' : null}
      />
    </>
  );

}