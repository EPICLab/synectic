import React, { useState, useRef } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Card } from '../types';
import { Actions, ActionKeys } from '../store/actions';
// import { WebviewTag } from 'electron';
import KeyboardArrowLeftIcon from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import StarIcon from '@material-ui/icons/Star';
import ReplayIcon from '@material-ui/icons/Replay';


export const BrowserComponent: React.FunctionComponent = () => {
    // this is related to the URL bar
    const [urlInput, setUrlInput] = useState('');
    // everything below this is related to the webview
    const [currentUrl, setCurrentUrl] = useState('');
    const [historyUrls, setHistoryUrls] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(0);
    const [bookmarkList, setBookmark] = useState<any[]>([]);
    // const [selected, setSelected] = useState(false);

    const addBookmark = (url: string) => {
        // isSelected(true);
        setBookmark([
            ...bookmarkList, {
                id: bookmarkList.length,
                value: url,
                // selectStatus: selected
            }
        ]);

    }

    // let isSelected = (sel: boolean) => {
    //     setSelected(sel);
    // }


    // console.log(historyUrls);               // keeps track of all sites that have been added
    // console.log(bookmarkList);          // keeps track of bookmarks
    // console.log(history.length);

    const go = () => {
        let history = historyUrls;

        if (historyIndex > 0) {
            const newHistory = history.slice(historyIndex);
            history = newHistory;
            setHistoryIndex(0);
        }
        setCurrentUrl(urlInput);
        setHistoryUrls([urlInput, ...history]);
    }

    const backwards = () => {
        if (historyIndex < historyUrls.length - 1) {
            setHistoryIndex(historyIndex + 1);
            const previousUrl = historyUrls[historyIndex + 1];
            setCurrentUrl(previousUrl);
            setUrlInput(previousUrl);
        }
    }

    const forwards = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            const nextUrl = historyUrls[historyIndex - 1];
            setCurrentUrl(nextUrl);
            setUrlInput(nextUrl);
        }
    }

    const reloadSite = () => {
        // webview.reload();
    }

    const myRef = useRef(null);
    const scrollClick = () => {
        console.log(`historyUrls: ${JSON.stringify(historyUrls)}`);
        console.log(`historyIndex: ${historyIndex}`);
        // webview.scrollTop = 20;
        // console.log(webview.scrollTop);
    }

    return (
        <>
            <KeyboardArrowLeftIcon onClick={() => backwards()} fontSize="default" color="primary" />
            <KeyboardArrowRightIcon onClick={() => forwards()} fontSize="default" color="primary" />
            <ReplayIcon onClick={reloadSite} fontSize="small" color="primary" />
            <StarIcon onClick={() => { addBookmark(urlInput); /*isSelected(true);*/ }} fontSize="small" /*color={selected ? "error" : "primary"}*/ />
            <input type="text" placeholder="URL" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
            <button onClick={() => go()}>Go</button>

            <div ref={myRef}>
                <webview src={currentUrl} style={{ height: '100%', width: '100%' }} ></webview>
            </div>

            <button onClick={scrollClick}>Top</button>
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