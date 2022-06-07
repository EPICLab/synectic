import React, { useState } from 'react';
import { Box, IconButton, InputAdornment, makeStyles, Paper, TextField } from '@material-ui/core';
import { ArrowBackIos, ArrowForwardIos, Refresh } from '@material-ui/icons';
import clsx from 'clsx';

type Mode = 'light' | 'dark';

const useStyles = makeStyles((theme) => ({
    topbar: {
        height: 39,
        position: 'relative',
        padding: '0px 0px 3px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-evenly',
        overflow: 'hidden'
    },
    adornedEnd: {
        background: (props: { mode: Mode }) => props.mode === 'dark' ? theme.palette.background.paper : 'rgba(40, 44, 52, 1)',
        color: (props: { mode: Mode }) => props.mode === 'dark' ? theme.palette.text.primary : 'rgba(171, 178, 191, 1)',
        borderWidth: (props: { mode: Mode }) => props.mode === 'dark' ? 0 : 1,
        borderStyle: (props: { mode: Mode }) => props.mode === 'dark' ? 'none' : 'solid',
        borderColor: (props: { mode: Mode }) => props.mode === 'dark' ? theme.palette.primary.dark : 'rgba(171, 178, 191, 1)',
    },
    adornedInput: {
        marginLeft: 0,
        paddingRight: 10
    },
    iconButton: {
        padding: 5,
        color: 'transparent',
        background: 'transparent',
        '&:hover': {
            color: (props: { mode: Mode }) => props.mode === 'dark' ? '#59575a' : '#ffffff',
        },
        '&:disabled': {
            color: 'transparent'
        }
    },
    leftPad: {
        position: 'absolute',
        alignSelf: 'center',

        background: 'transparent',
        boxShadow: 'none',
        width: 25,
        height: '100%',
        '&:hover': {
            background: 'rgba(40, 44, 52, 0.1)'
        },
        '&:disabled': {
            background: 'transparent'
        },
    },
    hoverPad: {
        position: 'absolute',
        alignSelf: 'center',
        background: 'transparent',
        boxShadow: 'none',
        width: 25,
        height: '100%',
    },
    hoverPadLeft: {
        left: 0,
        borderRadius: '4px 14px 14px 4px',
    },
    hoverPadRight: {
        right: 0,
        borderRadius: '14px 4px 4px 14px',
    },
    backButton: {
        position: 'absolute',
        top: 5,
        left: -3,
    },
    forwardButton: {
        position: 'absolute',
        top: 5,
        right: -8,
    }
}));

type UrlBarProps = {
    url: URL,
    go: (url: URL) => void,
    refresh: () => void,
    canGoBack: boolean,
    back: () => void,
    canGoForward: boolean,
    forward: () => void,
    mode?: Mode
}

const UrlBar = ({ url, go, refresh, canGoBack, back, canGoForward, forward, mode = 'dark' }: UrlBarProps) => {
    const styles = useStyles({ mode: mode });
    const [input, setInput] = useState(url);

    const enter = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            go(input);
        }
    }

    return (
        <Box className={styles.topbar}>
            <TextField
                fullWidth
                id={`browserUrl`}
                variant='outlined'
                size='small'
                placeholder='URL'
                value={input}
                InputProps={{
                    endAdornment: <InputAdornment position='end' classes={{ root: styles.adornedInput }}>
                        <IconButton className={styles.iconButton} aria-label='refresh' edge='end' onClick={refresh}>
                            <Refresh fontSize='small' />
                        </IconButton>
                    </InputAdornment>,
                    classes: {
                        adornedEnd: styles.adornedEnd
                    }
                }}
                onKeyDown={enter}
                onChange={e => setInput(new URL(e.target.value))}
            />
            <Paper elevation={4} className={clsx(styles.hoverPad, styles.hoverPadLeft)} />
            <IconButton
                className={clsx(styles.iconButton, styles.backButton)}
                aria-label='back'
                onClick={back}
                disabled={!canGoBack}
            >
                <ArrowBackIos fontSize='small' />
            </IconButton>
            <Paper elevation={4} className={clsx(styles.hoverPad, styles.hoverPadRight)} />
            <IconButton
                className={clsx(styles.iconButton, styles.forwardButton)}
                aria-label='forward'
                onClick={forward}
                disabled={!canGoForward}
            >
                <ArrowForwardIos fontSize='small' />
            </IconButton>
        </Box>
    );
}

export default UrlBar;