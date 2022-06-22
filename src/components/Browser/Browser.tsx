
import React, { useCallback, useEffect } from 'react';
import { makeStyles } from '@material-ui/core';
import { useHistory } from '../../containers/hooks/useHistory';
import UrlBar from './UrlBar';

const useStyles = makeStyles((theme) => ({
  webviewContent: {
    background: (props: { mode: Mode }) => props.mode === 'dark' ? theme.palette.background.paper : 'rgba(40, 44, 52, 1)',
    borderRadius: '0px 0px 10px 10px',
    height: 'calc(100% - 42px)',
    width: '100%',
    overflow: 'hidden'
  }
}));

type Mode = 'light' | 'dark';

const Browser = ({ card, mode = 'dark' }: { card: string, mode?: Mode }) => {
  const styles = useStyles({ mode: mode });
  const { state, set, goBack, goForward, canGoBack, canGoForward } = useHistory(new URL('https://epiclab.github.io/'));

  const refresh = () => {
    const webview: Electron.WebviewTag | null = document.querySelector(`[id="${card}-webview"]`);
    webview?.reload();
  }

  const go = (url: URL) => {
    if (state.present.href !== url.href) {
      const webview: Electron.WebviewTag | null = document.querySelector(`[id="${card}-webview"]`);
      webview?.loadURL(url.href);
      set(url);
    }
  }

  const back = () => {
    if (canGoBack) {
      const url = state.past[state.past.length - 1] as URL;
      goBack();
      const webview: Electron.WebviewTag | null = document.querySelector(`[id="${card}-webview"]`);
      webview?.loadURL(url.href);
    }
  }

  const forward = () => {
    if (canGoForward) {
      const url = state.future[0] as URL;
      goForward();
      const webview: Electron.WebviewTag | null = document.querySelector(`[id="${card}-webview"]`);
      webview?.loadURL(url.href);
    }
  }

  const handleNavigationEvent = useCallback((event: Event & { url: string }) => {
    if (state.present.href !== event.url) set(new URL(event.url));
  }, [set, state.present.href]);

  useEffect(() => {
    const webview: Electron.WebviewTag | null = document.querySelector(`[id="${card}-webview"]`);
    webview?.addEventListener('did-navigate', handleNavigationEvent);
    return () => {
      webview?.removeEventListener('did-navigate', handleNavigationEvent);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  return (
    <>
      <UrlBar url={state.present} go={go} refresh={refresh} mode={mode}
        canGoBack={canGoBack} back={back}
        canGoForward={canGoForward} forward={forward}
      />
      <div className={styles.webviewContent}>
        <webview id={`${card}-webview`} src={'https://epiclab.github.io/'}
          style={{ height: '100%', width: '100%', borderRadius: '10px!important' }} />
      </div>
    </>
  );
}

export default Browser;