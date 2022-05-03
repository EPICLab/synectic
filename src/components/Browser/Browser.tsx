import { IconButton, Tooltip } from '@material-ui/core';
import { ArrowBack, ArrowForward, Refresh } from '@material-ui/icons';
import React, { useState } from 'react';
import { Mode, useIconButtonStyle } from '../Button/useStyledIconButton';

type BrowserState = {
  history: URL[];
  current: URL;
  index: number;
}

const Browser = ({ mode = 'light' }: { mode?: Mode }) => {
  const [webviewKey, setWebviewKey] = useState(0);
  const classes = useIconButtonStyle({ mode: mode });
  const [urlInput, setUrlInput] = useState('https://epiclab.github.io/');
  const [browserState, setBrowserState] = useState<BrowserState>({
    history: [new URL('https://epiclab.github.io/')],
    current: new URL('https://epiclab.github.io/'), index: 0
  });

  const go = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      let history = browserState.history;
      if (browserState.index > 0) {
        history = history.slice(browserState.index);
        setBrowserState({ ...browserState, index: 0 });
      }
      setBrowserState({ ...browserState, current: new URL(urlInput), history: [new URL(urlInput), ...history] });
    }
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
        <Tooltip title='Go back'>
          <span>
            <IconButton
              className={classes.root}
              aria-label='back'
              disabled={browserState.index === browserState.history.length - 1}
              onClick={backwards}
            >
              <ArrowBack />
            </IconButton>
          </span>
        </Tooltip>
        <ArrowBack onClick={backwards} />
        <Tooltip title='Go forward'>
          <span>
            <IconButton
              className={classes.root}
              aria-label='forward'
              disabled={browserState.index == 0}
              onClick={forwards}
            >
              <ArrowForward />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title='Refresh'>
          <IconButton
            className={classes.root}
            aria-label='refresh'
            onClick={() => setWebviewKey(webviewKey + 1)}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
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

export default Browser;