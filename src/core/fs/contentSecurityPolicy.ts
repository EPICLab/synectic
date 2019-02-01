import { session, OnResponseStartedDetails, app } from 'electron';

export const setContentSecurityPolicy: () => void = () => {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived(
      (_listener: OnResponseStartedDetails, callback: Function) => {
        callback({ responseHeaders: `default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';` })
      },
    )
  }
}

export const setContentPermissionsHandler: () => void = () => {
  session.fromPartition('').setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'notifications') {
      // approves the permissions request
      callback(true);
    } else {
      // denies the permissions request
      callback(false);
    }
  })
}

export const setWebViewOptions: () => void = () => {
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (_event, webPreferences, _params) => {
      // Strip away preload scripts if unused or verify their location is legitimate
      delete webPreferences.preload
      delete webPreferences.preloadURL

      // Disable Node.js integration
      webPreferences.nodeIntegration = false
    })
  })
}
