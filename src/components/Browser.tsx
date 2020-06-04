import React, { useState } from 'react';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';
import { Card } from '../types';
import { Actions, ActionKeys } from '../store/actions';
// import { WebviewTag } from 'electron';
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
        <KeyboardArrowLeftIcon onClick={() => backwards()} fontSize="default" color="primary" />
        <KeyboardArrowRightIcon onClick={() => forwards()} fontSize="default" color="primary" />
        <ReplayIcon onClick={reloadSite} fontSize="small" color="primary" />
        <input type="text" placeholder="URL" value={urlInput} onKeyDown={go} onChange={e => setUrlInput(e.target.value)} />
      </div>
      <div className='browser-content'>
        <webview src={browserState.current.toString()} style={{ height: '205px', width: '200px' }} ></webview>
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
