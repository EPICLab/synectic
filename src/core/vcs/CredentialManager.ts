// import { PathLike } from 'fs-extra';
import * as url from 'url';
import { Dialog } from '../lib/Dialog';
import { JsonValue, JsonObject } from 'type-fest';

interface GitCredentialManagerPlugin {
  fill ( url: string ): Promise<JsonValue>;
  approved ( url: string, auth: JsonValue ): Promise<void>;
  rejected ( url: string, auth: JsonValue ): Promise<void>;
}

export interface auth extends JsonObject {
  oauth2format: string,
  username: string,
  password: string,
  token: string
}

export class CredentialManager implements GitCredentialManagerPlugin {

  // Note: Key can be in SSH or HTTPS formats, but will return different auth results
  // depending on which format is provided.
  credentials: Map<string, auth> = new Map();

  credentialPrompt(url: string): Promise<auth> {
    let auth = this.getAuth(url);
    const siteDesc = document.createElement('span');
    siteDesc.className = 'form-control';
    siteDesc.innerText = 'Site:';
    const site = document.createElement('input');
    site.type = 'text';
    site.className = 'form-control';
    site.name = 'site';
    site.value = url;
    site.readOnly = true;

    const login2FADesc = document.createElement('span');
    login2FADesc.className = 'form-control';
    login2FADesc.innerText = 'Enable 2FA:';
    const login2FA = document.createElement('input');
    login2FA.type = 'checkbox';
    login2FA.name = 'login2FA';
    login2FA.value = '2FA';
    login2FA.id = 'id';
    login2FA.onclick = () => {
      if (login2FA.checked) {
        $(userDesc).hide();
        $(username).hide();
        $(passDesc).hide();
        $(password).hide();
        $(reveal).hide();
        $(oAuthDesc).show();
        oAuth.value = CredentialManager.parseOAuth2Format(url);
        $(oAuth).show();
        $(tokenDesc).show();
        $(token).show();
      } else {
        $(oAuthDesc).hide();
        $(oAuth).hide();
        $(tokenDesc).hide();
        $(token).hide();
        $(userDesc).show();
        $(username).show();
        $(passDesc).show();
        $(password).show();
      }
    };

    const userDesc = document.createElement('span');
    userDesc.className = 'form-control';
    userDesc.innerText = 'Username:';
    const username = document.createElement('input');
    username.type = 'text';
    username.className = 'form-control';
    username.name = 'username';
    username.value = auth.username;

    const passDesc = document.createElement('span');
    passDesc.setAttribute('class', 'form-control');
    passDesc.innerText = 'Password:';
    const password = document.createElement('input');
    password.type = 'password';
    password.className = 'form-control';
    password.name = 'password';
    password.value = auth.password;
    const reveal = document.createElement('span');
    reveal.classList.add('closed-eye', 'toggle-password');
    reveal.onclick = () => {
      $(reveal).toggleClass('closed-eye open-eye');
      if ($(password).attr('type') == 'password') {
        password.type = 'text';
      } else {
        password.type = 'password';
      }
    };

    const oAuthDesc = document.createElement('span');
    oAuthDesc.className = 'form-control';
    oAuthDesc.innerText = 'OAuth:';
    const oAuth = document.createElement('input');
    oAuth.type = 'text';
    oAuth.className = 'form-control';
    oAuth.name = 'oAuth';
    oAuth.value = auth.oauth2format;
    oAuth.readOnly = true;
    $(oAuthDesc).hide();
    $(oAuth).hide();

    const tokenDesc = document.createElement('span');
    tokenDesc.className = 'form-control';
    tokenDesc.innerText = 'Token:';
    const token = document.createElement('input');
    token.type = 'text';
    token.className = 'form-control';
    token.name = 'token';
    token.value = auth.token;
    $(tokenDesc).hide();
    $(token).hide();

    const login = document.createElement('button');
    login.innerText = 'Login';
    login.id = 'Login';
    const cancel = document.createElement('button');
    cancel.innerText = 'Cancel';
    cancel.id = 'Cancel';

    let dialog = new Dialog('dialog', 'Git Credential Manager');
    dialog.addContents([siteDesc, site, login2FADesc, login2FA, userDesc,
      username, passDesc, password, reveal, oAuthDesc, oAuth, tokenDesc, token]);
    dialog.addButtons([login, cancel]);

    const loginPromise = new Promise((resolve) => {
        const resolver = () => {
          if (login2FA.checked) {
            this.credentials.set(url, {
              oauth2format: oAuth.value,
              username: '',
              password: '',
              token: token.value
            });
          } else {
            this.credentials.set(url, {
              oauth2format: '',
              username: username.value,
              password: password.value,
              token: ''
            });
          }
          resolve();
          login.removeEventListener('click', resolver);
          console.log('loginPromise');
          dialog.destructor();
        }
        login.addEventListener('click', resolver);
    });
    const cancelPromise = new Promise((resolve) => {
        const resolver = () => {
            resolve();
            cancel.removeEventListener('click', resolver);
            console.log('cancelPromise');
            dialog.destructor();
        }
        cancel.addEventListener('click', resolver);
    });

    return Promise.race([
      loginPromise.then(() => {
        return this.getAuth(url);
      }),
      cancelPromise.then(() => {
        return this.getAuth(url);
      })
    ]);
  }

  /*
   * Attempt to add "username", "password", "token" to auth for the specified URL.
   * @param url The remote URL that auth information is being requested for.
   * @return Promise for JSON string containing Git auth information; auth can be blank if no information added.
   */
  async fill(url: string): Promise<JsonValue> {
    console.log('CredentialManager::fill called for: ' + url);
    // url = CredentialManager.toHTTPS(url); // temporary fix since SSH URLs need additional logic to handle tokens and fallback to HTTPS and user prompts (if needed)
    let auth = this.credentials.get(url);
    if (!auth) {
      auth = await this.credentialPrompt(url);
    }
    console.log('CredentialManager::fill returning: ');
    console.log('oauth2format: ' + auth.oauth2format);
    console.log('username: ' + auth.username);
    console.log('password: ' + auth.password);
    console.log('token: ' + auth.token);
    // return new Promise((resolve) => resolve(JSON.stringify(auth)));
    return new Promise((resolve) => resolve(auth));
  }

  /**
   * Inform the backend and any configured credential helpers that the
   * auth credentials have been accepted.
   * @param url The remote URL that auth information is being requested for.
   * @param auth The JSON string containing Git auth information.
   * @return Promise for indicating that the approved event handling has completed.
   */
  approved(url: string, auth: JsonValue): Promise<void> {
    return new Promise((resolve) => {
      console.log('approved:\n\turl: ' + url + '\n\tauth: ' + auth);
      resolve();
    });
  }

  /**
   * Inform the backend and any configured credential helpers that the
   * auth credentials have been rejected.
   * @param url The remote URL that auth information is being requested for.
   * @param auth The JSON string containing Git auth information.
   * @return Promise for indicating that the rejected event handling has completed.
   */
  rejected(url: string, auth: JsonValue): Promise<void> {
    const message = `Authentication with \'${url}\' failed using: ${auth}`;
    const dialog = new Dialog('banner', 'Git Credential Manager', message);

    const reAuth = document.createElement('button');
    reAuth.innerText = 'Reauthenticate';
    reAuth.setAttribute('id', 'Reauthenticate');
    dialog.addButtons([reAuth]);

    return new Promise<void>((resolve) => {
        const resolver = () => {
          resolve();
          reAuth.removeEventListener('click', resolver);
          dialog.destructor();
          this.credentialPrompt(url);
        }
        reAuth.addEventListener('click', resolver);
    });
    // const data = { statusCode: 401, statusMessage: 'HTTP Basic: Access Denied' };
    // const err = new Error(`HTTP Error: ${data.statusCode} ${data.statusMessage}`);
    // throw err;
  }

  /**
   * Split remote URL into host and path components for connection processing.
   * @param remoteUrl The remote URL; can accept SSH or HTTPS format.
   * @return Tuple containing the host and path values after string processing.
   */
  static parseRemoteUrl(remoteUrl: string): [string, string] {
    const _remoteUrl = remoteUrl.replace(/^git@/, 'ssh:git@');
    const parsedUrl = url.parse(_remoteUrl);
    const host = parsedUrl.host ? parsedUrl.host : '';
    const path = parsedUrl.path ? parsedUrl.path.replace(/^\/\:?/, '') : '';
    return [host, path];
  }

  /**
   * Convert remote URL from SSH to HTTPS format.
   * @param remoteUrl The remote URL in SSH format.
   * @return The remote URL in HTTPS format.
   */
  static toHTTPS (remoteUrl: string): string {
    const parsedRemote = this.parseRemoteUrl(remoteUrl);
    return `https://${parsedRemote[0]}/${parsedRemote[1]}`
  }

  /**
   * Convert remote URL from HTTPS to SSH format.
   * @param remoteUrl The remote URL in HTTPS format.
   * @return The remote URL in SSH format.
   */
  static toSSH (remoteUrl: string): string {
    const parsedRemote = this.parseRemoteUrl(remoteUrl);
    return `git@${parsedRemote[0]}:${parsedRemote[1]}`;
  }

  /**
   * Extract the OAuth2Format field for the specified URL.
   * @param remoteUrl The remote URL; can accept SSH or HTTPS format.
   * @return The oauth2format string indicating remote repository hosting site.
   */
  static parseOAuth2Format(remoteUrl: string): string {
    const parsedRemote = this.parseRemoteUrl(remoteUrl);
    if (parsedRemote[0].includes('github')) return 'github';
    if (parsedRemote[0].includes('bitbucket')) return 'bitbucket';
    if (parsedRemote[0].includes('gitlab')) return 'gitlab';
    return '';
  }

  /**
   * Evaluate for previous auth credentials, and return blank otherwise.
   * @param url The remote URL; can accept SSH or HTTPS format.
   * @return The auth credentials with relevant fields populated; blank auth if nots found.
   */
  private getAuth(url: string): auth {
    let auth = this.credentials.get(url);
    if (auth) {
      return auth;
    } else {
      return {
        oauth2format: '',
        username: '',
        password: '',
        token: ''
      };
    }
  }
}
