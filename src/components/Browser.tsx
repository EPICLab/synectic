import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Metafile } from '../types';
import { Actions, ActionKeys } from '../store/actions';
import { loadCard } from '../containers/handlers';


type BrowserState = {
    history: URL[];
    current: URL;
    index: number;
}

export const BrowserComponent: React.FunctionComponent = () => {
    // this is related to the URL bar
    const [urlInput, setUrlInput] = useState('');
    const [browserState, setBrowserState] = useState<BrowserState>({ history: [], current: new URL('https://epiclab.github.io/'), index: 0 })

    const go = (e: React.KeyboardEvent) => {
        if (e.keyCode != 13) return;
        let history = browserState.history;
        if (browserState.index > 0) {
            history = history.slice(browserState.index);
            setBrowserState({ ...browserState, index: 0 });
        }
        setBrowserState({ ...browserState, current: new URL(urlInput), history: [new URL(urlInput), ...history] });
    }

    const backwards = () => {
        if (browserState.index < browserState.history.length - 1) {
            setBrowserState({ ...browserState, current: browserState.history[browserState.index + 1], index: browserState.index + 1 });
            setUrlInput(browserState.current.toString());
        }
    }

    const forwards = () => {
        if (browserState.index > 0) {
            setBrowserState({ ...browserState, current: browserState.history[browserState.index - 1], index: browserState.index - 1 });
            setUrlInput(browserState.current.toString());
        }
    }

    const reloadSite = () => {
        setBrowserState({ ...browserState, current: browserState.current });
    }

    return (
        <>
            <div className='browser-topbar'>
                <button className="arrow-left" onClick={() => backwards()} />
                <button className="arrow-right" onClick={() => forwards()} />
                <button className="refresh" onClick={reloadSite} />
                <input className="url-bar-style" type="text" placeholder="URL" value={urlInput} onKeyDown={go} onChange={e => setUrlInput(e.target.value)} />
            </div>
            <div className='browser-content'>
                <webview src={browserState.current.toString()} style={{ height: '226px', width: '200px' }}></webview>
            </div>
        </>
    )
}



export const BrowserButton: React.FunctionComponent = () => {
    const dispatch = useDispatch();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        const metafile: Metafile = {
            id: v4(),
            name: 'Browser',
            modified: DateTime.local(),
            handler: 'Browser'
        };
        const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
        dispatch(addMetafileAction);
        dispatch(loadCard(metafile));
    };

    return (
        <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Open Browser...</Button>
    );
}
