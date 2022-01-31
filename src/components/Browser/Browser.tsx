import React, { useState } from 'react';
import type { Card } from '../../types';
import DataField from '../Card/DataField';

type BrowserState = {
  history: URL[];
  current: URL;
  index: number;
}

const Browser: React.FunctionComponent = () => {
  const [webviewKey, setWebviewKey] = useState(0);
  const [urlInput, setUrlInput] = useState('https://epiclab.github.io/');
  const [browserState, setBrowserState] = useState<BrowserState>({
    history: [new URL('https://epiclab.github.io/')],
    current: new URL('https://epiclab.github.io/'), index: 0
  });

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
        <button className="arrow-left" disabled={browserState.index === browserState.history.length - 1} onClick={backwards} />
        <button className="arrow-right" disabled={browserState.index == 0} onClick={forwards} />
        <button className="refresh" onClick={() => setWebviewKey(webviewKey + 1)} />
        <input className="url-bar-style" type="text" placeholder="URL" value={urlInput}
          onKeyDown={go} onChange={e => setUrlInput(e.target.value)} />
      </div>
      <div className='browser-content'>
        <webview key={webviewKey} src={browserState.current.toString()}
          style={{ height: '100%', width: '100%', borderRadius: '10px!important' }}></webview>
      </div>
    </>
  )
}

export const BrowserReverse: React.FunctionComponent<Card> = props => {
  return (
    <>
      <div className='buttons'>
      </div>
      <DataField title='Update' textField field={props.modified.toLocaleString()} />
    </>
  );
};

export default Browser;