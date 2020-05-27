import React, { useState, useRef } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Card } from '../types';
import { Actions, ActionKeys } from '../store/actions';
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
    const [bookmarkList, setBookmark] = useState<string[]>([]);
    // const [selectedStatus, setSelected] = useState(false);


    // adds url as a bookmark
    const addBookmark = (url: string) => {
        if (bookmarkList.includes(url) == false) {
            setBookmark([url, ...bookmarkList]);
        }

        if (bookmarkList.includes(url) == true) {
            let bmarks = bookmarkList;
            bmarks.splice(historyIndex);
            setBookmark([...bmarks]);

            // let bmarks = bookmarkList;
            // const newBookmarkList = bmarks.splice(historyIndex);
            // bmarks = newBookmarkList;
            // setBookmark([...bmarks]);
        }
    }

    // selects the bookmark star
    let isSelected = (curUrl: string) => {
        if (bookmarkList.length > 0) {
            if (bookmarkList.includes(curUrl)) {
                // setSelected(true);
                return true;
            }
        }

        // setSelected(false);
        return false;
    }

    // const getBookmarkList = () => {
    //     console.log(`bookmark list: ${JSON.stringify(bookmarkList)}`);
    // }

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
    // const getUrlHistory = () => {
    //     console.log(`historyUrls: ${JSON.stringify(historyUrls)}`);
    //     console.log(`historyIndex: ${historyIndex}`);
    //     // webview.scrollTop = 20;
    //     // console.log(webview.scrollTop);
    //     console.log(`bookmark list: ${JSON.stringify(bookmarkList)}`);
    // }

    return (
        <>
            <KeyboardArrowLeftIcon onClick={() => backwards()} fontSize="default" color="primary" />
            <KeyboardArrowRightIcon onClick={() => forwards()} fontSize="default" color="primary" />
            <ReplayIcon onClick={reloadSite} fontSize="small" color="primary" />
            <StarIcon onClick={() => { addBookmark(urlInput); }} fontSize="small" color={isSelected(currentUrl) ? "error" : "primary"} />
            <input type="text" placeholder="URL" value={urlInput} onChange={e => setUrlInput(e.target.value)} />
            <button onClick={() => go()}>Go</button>

            <div ref={myRef}>
                <webview src={currentUrl} style={{ height: '212px', width: '200px' }} ></webview>
            </div>

            {/* <button onClick={getUrlHistory}>URL History</button>
            <button onClick={getBookmarkList}>Bookmarks</button> */}
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
