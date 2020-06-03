import React, { useState, useRef } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Card } from '../types';
import { Actions, ActionKeys } from '../store/actions';
import { WebviewTag } from 'electron';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import ReplayIcon from '@material-ui/icons/Replay';


type BrowserState = {
    history: URL[];
    current: URL;
    index: number;
}

export const BrowserComponent: React.FunctionComponent = () => {
    // this is related to the URL bar
    const [urlInput, setUrlInput] = useState('');
    // everything below this is related to the webview
    // const [currentUrl, setCurrentUrl] = useState('');
    // const [historyUrls, setHistoryUrls] = useState<string[]>([]);
    // const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [browserState, setBrowserState] = useState<BrowserState>({ history: [], current: new URL(''), index: 0 });


    const go = () => {
        // let history = historyUrls;

        // if (historyIndex > 0) {
        //     const newHistory = history.slice(historyIndex);
        //     history = newHistory;
        //     setHistoryIndex(0);
        // }
        // setCurrentUrl(urlInput);
        // setHistoryUrls([urlInput, ...history]);

        setBrowserState()
    }

    const backwards = () => {
        // if (historyIndex < historyUrls.length - 1) {
        //     setHistoryIndex(historyIndex + 1);
        //     const previousUrl = historyUrls[historyIndex + 1];
        //     setCurrentUrl(previousUrl);
        //     setUrlInput(previousUrl);
        // }
    }

    const forwards = () => {
        // if (historyIndex > 0) {
        //     setHistoryIndex(historyIndex - 1);
        //     const nextUrl = historyUrls[historyIndex - 1];
        //     setCurrentUrl(nextUrl);
        //     setUrlInput(nextUrl);
        // }
    }

    const reloadSite = () => {
        const webview = document.querySelector('webview') as WebviewTag;
        webview.reload();

    }

    const myRef = useRef(null);

    return (
        <>
            <KeyboardArrowLeftIcon onClick={() => backwards()} fontSize="default" color="primary" />
            <KeyboardArrowRightIcon onClick={() => forwards()} fontSize="default" color="primary" />
            <ReplayIcon onClick={reloadSite} fontSize="small" color="primary" />
            <input type="text" placeholder="URL" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
            <button onClick={() => go()}>Go</button>

            <div ref={myRef}>
                <webview src={currentUrl} style={{ height: '205px', width: '200px' }} ></webview>
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
            left: 50,
            top: 70,
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
