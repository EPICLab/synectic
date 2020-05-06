import React, { useState, useEffect, useRef } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Card } from '../types';
import { Actions, ActionKeys } from '../store/actions';
import { WebviewTag } from 'electron';
// import { ActionKeys, Actions } from '../store/actions';


const usePrevious = <T extends {}>(value: T): T | undefined => {
    const ref = useRef<T>();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
};


export const BrowserComponent: React.FunctionComponent = () => {
    const [urlBar, setUrlBar] = useState('');
    const [url, setUrl] = useState('');
    const [urlList, setUrlHistory] = useState<any[]>([]);

    const addUrl = (url: string) => {
        setUrlHistory([
            ...urlList, {
                id: urlList.length,
                value: url
            }
        ]);
    };

    const prevSite: any = usePrevious(urlList);
    console.log(urlList); // keeps track of all sites that have been added
    console.log(prevSite); // keeps track of previous sites (before current site)

    let webview = document.querySelector('webview') as WebviewTag;

    const backwards = () => {
        webview.goBack();
        history.back();
    }

    const forwards = () => {
        webview.goForward();
        history.forward();
    }

    const reloadSite = () => {
        webview.reload();
    }


    console.log(history.length);

    return (
        <>
            <input type="text" placeholder="URL" onChange={e => setUrlBar(e.target.value)} />
            <button onClick={() => { setUrl(urlBar); addUrl(urlBar); }}>Submit</button>
            <button onClick={backwards}>Back</button>
            <button onClick={forwards}>Forward</button>
            <button onClick={reloadSite}>Reload</button>
            <div>
                <webview src={url} style={{ height: '100%', width: '100%' }} ></webview>
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