// import { PathLike } from 'fs-extra';
import * as git from './git';
import { Dialog } from '../lib/Dialog';
import { JsonValue, JsonObject } from 'type-fest';

interface GitCredentialManagerPlugin {
  fill ({ url }: { url: string }): Promise<JsonValue>;
  approved ({ url, auth }: { url: string, auth: JsonValue }): Promise<void>;
  rejected ({ url, auth }: { url: string, auth: JsonValue }): Promise<void>;
}

export interface Auth extends JsonObject {
  oauth2format: string;
  username: string;
  password: string;
  token: string;
}

export class CredentialManager implements GitCredentialManagerPlugin {

  // Note: Key can be in SSH or HTTPS formats, but will return different auth results
  // depending on which format is provided.
  credentials: Map<string, Auth> = new Map();

  credentialPrompt(url: string): Promise<Auth> {
    url = git.toHTTPS(url);
    const auth = this.getAuth(url);
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
      if ($(password).attr('type') === 'password') {
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

    const dialog = new Dialog('dialog', 'Git Credential Manager');
    dialog.addContents([siteDesc, site, login2FADesc, login2FA, userDesc,
      username, passDesc, password, reveal, oAuthDesc, oAuth, tokenDesc, token]);
    dialog.addButtons([login, cancel]);

    const loginPromise = new Promise((resolve) => {
      const resolver = () => {
        if (login2FA.checked) {
          this.credentials.set(url, CredentialManager.buildAuth2FA(url, token.value));
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
      };
      login.addEventListener('click', resolver);
    });
    const cancelPromise = new Promise((resolve) => {
      const resolver = () => {
        resolve();
        cancel.removeEventListener('click', resolver);
        console.log('cancelPromise');
        dialog.destructor();
      };
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

  /**
   * Attempt to add "username", "password", "token" to auth for the specified URL.
   * @param url The remote URL that auth information is being requested for.
   * @return Promise for JSON string containing Git auth information; auth can be blank if no information added.
   */
  async fill({ url }: { url: string }): Promise<JsonValue> {
    url = git.toHTTPS(url);
    let auth = this.credentials.get(url);
    if (!auth) auth = await this.credentialPrompt(url);
    return new Promise((resolve) => resolve(auth));
  }

  /**
   * Inform the backend and any configured credential helpers that the
   * auth credentials have been accepted.
   * @param url The remote URL that auth information is being requested for.
   * @param auth The JSON string containing Git auth information.
   * @return Promise for indicating that the approved event handling has completed.
   */
  approved({ url, auth }: { url: string, auth: JsonValue }): Promise<void> {
    const oAuth = auth as Auth;
    const message = `Authentication with \'${url}\' approved using:\n
      oauth2format: ${oAuth.oauth2format}\n
      username: ${oAuth.username}\n
      password: ${oAuth.passwordtoken}\n
      token: ${oAuth.token}`;
    new Dialog('banner', 'Git Credential Manager', message);
    return new Promise((resolve) => {
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
  rejected({ url, auth }: { url: string, auth: JsonValue }): Promise<void> {
    const oAuth = auth as Auth;
    const message = `Authentication with \'${url}\' failed using:\n
      oauth2format: ${oAuth.oauth2format}\n
      username: ${oAuth.username}\n
      password: ${oAuth.passwordtoken}\n
      token: ${oAuth.token}`;
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
        async () => {
          await this.credentialPrompt(url);
        };
      };
      reAuth.addEventListener('click', resolver);
    });
  }

  /**
   * Extract the OAuth2Format field for the specified URL.
   * @param remoteUrl The remote URL; can accept SSH or HTTPS format.
   * @return The oauth2format string indicating remote repository hosting site.
   */
  static parseOAuth2Format(remoteUrl: string): string {
    const parsedRemote = git.parseRemoteUrl(remoteUrl);
    if (parsedRemote[0].includes('github')) return 'github';
    if (parsedRemote[0].includes('bitbucket')) return 'bitbucket';
    if (parsedRemote[0].includes('gitlab')) return 'gitlab';
    return '';
  }

  /**
   * Convert the remote URL and token into 2FA auth credentials.
   * @param remoteUrl The remote URL; can accept SSH or HTTPS formats.
   * @return The auth credentials with relevant 2FA field populated.
   */
  static buildAuth2FA(remoteUrl: string, token: string): Auth {
    const oauth: Auth = {
      oauth2format: CredentialManager.parseOAuth2Format(remoteUrl),
      username: '',
      password: '',
      token: token
    };
    switch (oauth.oauth2format) {
    case 'github':
      oauth.username = token;
      oauth.password = 'x-oauth-basic';
      break;
    case 'bitbucket':
      oauth.username = 'x-token-auth';
      oauth.password = token;
      break;
    case 'gitlab':
      oauth.username = 'oauth2';
      oauth.password = token;
      break;
    }
    return oauth;
  }

  /**
   * Evaluate for previous auth credentials, and return blank otherwise.
   * @param url The remote URL; can accept SSH or HTTPS format.
   * @return The auth credentials with relevant fields populated; blank auth if nots found.
   */
  private getAuth(url: string): Auth {
    const auth = this.credentials.get(url);
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
