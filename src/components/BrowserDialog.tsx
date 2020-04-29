import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';

// import { RootState } from '../store/root';
import { Card } from '../types';
import { Actions, ActionKeys } from '../store/actions';
// import { ActionKeys, Actions } from '../store/actions';

// const { BrowserView, BrowserWindow } = require('electron').remote

// const { app, screen } = require('electron').remote
// const WebView = require('react-electron-web-view');

export const BrowserComponent: React.FunctionComponent = () => {
    const [urlBar, setUrlBar] = useState('');
    const [url, setUrl] = useState('');
    // const dispatch = useDispatch();
    // const metafiles = useSelector((state: RootState) => state.metafiles);

    // let frmdetails = {
    //     'URL': url
    // }

    // const submitValue = (e: React.MouseEvent) => {
    //     e.preventDefault();

    //     // const metafile: Metafile = {
    //     //     id: v4(),
    //     //     name: metafiles[0]?.name,
    //     //     modified: DateTime.local(),
    //     //     handler: 'Browser'
    //     // }
    //     // const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
    //     // dispatch(addMetafileAction);

    //     // const card: Card = {
    //     //     id: v4(),
    //     //     name: frmdetails.URL,
    //     //     type: 'Browser',
    //     //     related: [],
    //     //     created: DateTime.local(),
    //     //     modified: DateTime.local(),
    //     //     captured: false,
    //     //     left: 50,
    //     //     top: 50
    //     // }
    //     // const addCardAction: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
    //     // dispatch(addCardAction);
    //     // window.open(frmdetails.URL, '_blank');

    //     // let win: Electron.BrowserWindow = new BrowserWindow({ width: 800, height: 600 });
    //     // let view = new BrowserView()
    //     // win.setBrowserView(view)
    //     // view.setBounds({ x: 0, y: 0, width: 300, height: 300 })
    //     // view.webContents.loadURL(frmdetails.URL)

    //     // let win = new BrowserWindow({ width: 800, height: 1500 })
    //     // win.loadURL('http://github.com')
    //     // let contents = win.webContents
    //     // console.log(contents)

    //     // let win
    //     // app.on('ready', () => {
    //     //     const { width, height } = screen.getPrimaryDisplay().workAreaSize
    //     //     win = new BrowserWindow({ width, height })
    //     //     win.loadURL('https://github.com')
    //     // })
    // }

    return (
        <>
            <input type="text" placeholder="URL" onChange={e => setUrlBar(e.target.value)} />
            <button onClick={() => setUrl(urlBar)}>Submit</button>
            <div>
                <webview src={url} style={{ height: '100%', width: '100%' }}></webview>
            </div>
        </>
    )
}

export const BrowserButton: React.FunctionComponent = () => {
    const dispatch = useDispatch();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();

        const card: Card = {
            id: v4(),
            name: 'browser',
            created: DateTime.local(),
            modified: DateTime.local(),
            captured: false,
            left: 10,
            top: 25,
            type: 'Browser',
            related: []
        };
        const action: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
        dispatch(action);
    };

    return (
        <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Open Browser...</Button>
    );
}