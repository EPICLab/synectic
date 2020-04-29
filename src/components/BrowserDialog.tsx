import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';

import { RootState } from '../store/root';
import { UUID, Card, Metafile } from '../types';
import { ActionKeys, Actions } from '../store/actions';

// const { BrowserView, BrowserWindow } = require('electron').remote

// const { app, screen } = require('electron').remote

const WebView = require('react-electron-web-view');

type DialogProps = {
    open: boolean;
    onClose: (canceled: boolean, selected: string) => void;
}

export const BrowserDialog: React.FunctionComponent<DialogProps> = () => {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState('');
    const dispatch = useDispatch()
    const metafiles = useSelector((state: RootState) => state.metafiles);

    let frmdetails = {
        'URL': url
    }

    const submitValue = (e: React.MouseEvent) => {
        e.preventDefault();
        frmdetails = {
            'URL': url
        }

        setOpen(!open);

        const metafile: Metafile = {
            id: v4(),
            name: metafiles[0]?.name,
            modified: DateTime.local(),
            handler: 'Browser'
        }
        const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
        dispatch(addMetafileAction);

        const card: Card = {
            id: v4(),
            name: frmdetails.URL,
            type: 'Browser',
            related: [],
            created: DateTime.local(),
            modified: DateTime.local(),
            captured: false,
            left: 50,
            top: 50
        }
        const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
        dispatch(addCardAction);
        window.open(frmdetails.URL, '_blank');

        // let win: Electron.BrowserWindow = new BrowserWindow({ width: 800, height: 600 });
        // let view = new BrowserView()
        // win.setBrowserView(view)
        // view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
        // view.webContents.loadURL(frmdetails.URL)

        // let win = new BrowserWindow({ width: 800, height: 1500 })
        // win.loadURL('http://github.com')
        // let contents = win.webContents
        // console.log(contents)

        // let win
        // app.on('ready', () => {
        //     const { width, height } = screen.getPrimaryDisplay().workAreaSize
        //     win = new BrowserWindow({ width, height })
        //     win.loadURL('https://github.com')
        // })
    }

    return (
        <>
            <input type="text" placeholder="URL" onChange={e => setUrl(e.target.value)} />
            <button onClick={submitValue}>Submit</button>
            {/* {open ? <BrowserView src={frmdetails.URL} /> : null} */}
            {open ? <WebView src={frmdetails.URL} width={300} height={300} /> : null}
        </>
    )
}

const BrowserButton: React.FunctionComponent = () => {
    const [open, setOpen] = useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        setOpen(!open);
    };

    const handleClose = (canceled: boolean, selected: UUID) => {
        if (canceled || !selected) {
            setOpen(!open);
            return;
        }
        setOpen(!open);
    };

    return (
        <>
            <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Open Browser...</Button>
            {open ? <BrowserDialog open={open} onClose={handleClose} /> : null}
        </>
    );
}

export default BrowserButton;