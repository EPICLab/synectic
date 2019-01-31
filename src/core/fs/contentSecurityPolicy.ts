import { session, OnResponseStartedDetails } from 'electron';

export const setContentSecurityPolicy: () => void = () => {
  if (session.defaultSession) {
    session.defaultSession.webRequest.onHeadersReceived(
      (_: OnResponseStartedDetails, callback: Function) => {
        callback({ responseHeaders: `default-src 'none'; script-src 'self'; connect-src 'self'; img-src 'self'; style-src 'self';` })
      },
    )
  }
}

export const setContentPermissionsHandler: () => void = () => {
  session.fromPartition('').setPermissionRequestHandler((_, permission, callback) => {
    if (permission === 'notifications') {
      // approves the permissions request
      callback(true);
    } else {
      // denies the permissions request
      callback(false);
    }
  })
}
