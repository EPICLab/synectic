import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Metafile } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { loadCard } from '../containers/handlers';

type BrowserState = {
  history: URL[];
  current: URL;
  index: number;
}

export const BrowserComponent: React.FunctionComponent = () => {
  const [webviewKey, setWebviewKey] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [browserState, setBrowserState] = useState<BrowserState>({ history: [new URL('https://epiclab.github.io/')], current: new URL('https://epiclab.github.io/'), index: 0 });

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
      const newCurrent = browserState.history[browserState.index + 1];
      setBrowserState({ ...browserState, current: newCurrent, index: browserState.index + 1 });
      setUrlInput(newCurrent.toString());
    }
  }

  const forwards = () => {
    if (browserState.index > 0) {
      const newCurrent = browserState.history[browserState.index - 1];
      setBrowserState({ ...browserState, current: newCurrent, index: browserState.index - 1 });
      setUrlInput(newCurrent.toString());
    }
  }

  return (
    <>
      <div className='browser-topbar'>
        <button className="arrow-left" onClick={() => backwards()} />
        <button className="arrow-right" onClick={() => forwards()} />
        <button className="refresh" onClick={() => setWebviewKey(webviewKey + 1)} />
        <input className="url-bar-style" type="text" placeholder="URL" value={urlInput} onKeyDown={go} onChange={e => setUrlInput(e.target.value)} />
      </div>
      <div className='browser-content'>
        <webview key={webviewKey} src={browserState.current.toString()} style={{ height: '226px', width: '200px', borderRadius: '10px!important' }}></webview>
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
    const addMetafileAction: Action = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
    dispatch(addMetafileAction);
    dispatch(loadCard({ metafile: metafile }));
  };

  return (
    <Button id='diffpicker-button' variant='contained' color='primary' onClick={e => handleClick(e)}>Open Browser...</Button>
  );
}
