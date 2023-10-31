import type {Repository} from '@syn-types/repo';
import parsePath from 'parse-path';
import parseUrl from 'parse-url';
import {parseArgs, type ParseArgsConfig} from 'util';
import {isWebUri} from 'valid-url';
import {isDefined} from '../utils';
import url from 'node:url';

export const revParseArgs = (args: {[k: string]: boolean}, options: ParseArgsConfig['options']) => {
  const definedArgs: string[] = Object.entries(args)
    .filter(([, v]) => v === true)
    .map(([k]) => `--${k}`);
  return parseArgs({args: definedArgs, options, tokens: true}).values;
};

export const errorLogger = (
  isError: boolean,
  error: string,
  fields: Map<string, string | undefined>,
) => {
  if (isError) {
    console.groupCollapsed(
      `%c${error} :`,
      'background: aquamarine; color: #444; padding: 3px; border-radius: 5px;',
    );
    console.log(fields);
    console.groupEnd();
  }
};

/**
 * Parse a URL to extract Git repository name, typically based on the remote origin URL.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns {string} The repository name (e.g. 'username/repo').
 */
export const extractRepoName = (url: URL | string): string => {
  const parsedPath = typeof url === 'string' ? parseUrl(url, false) : parseUrl(url.href, false);
  return parsedPath.pathname.replace(/^(\/*)(?:snippets\/)?/, '').replace(/\.git$/, '');
};

/**
 * Parse a URL to extract components and protocols, along with the OAuth resource authority
 * (GitHub, BitBucket, or GitLab) for processing with the isomorphic-git library module.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns {{ url: parsePath.ParsedPath; oauth: Repository['oauth'] }} A JavaScript object
 * (key-value) with the parsePath.ParsedPath object and OAuth resource name.
 */
export const extractFromURL = (
  url: URL | string,
): {url: parsePath.ParsedPath; oauth: Repository['oauth']} => {
  const parsedUrl = typeof url === 'string' ? parseUrl(url) : parseUrl(url.href);
  let oauth: Repository['oauth'] = 'github';
  switch (parsedUrl.resource) {
    case parsedUrl.resource.match(/github\.com/) ? parsedUrl.resource : undefined:
      oauth = 'github';
      break;
    case parsedUrl.resource.match(/bitbucket\.org/) ? parsedUrl.resource : undefined:
      oauth = 'bitbucket';
      break;
    case parsedUrl.resource.match(/gitlab.*\.com/) ? parsedUrl.resource : undefined:
      oauth = 'gitlab';
      break;
  }
  return {url: parsePath(resolveURL(parsedUrl.href)), oauth: oauth};
};

/**
 * Examines a Repository object to determine if it is well-formed. The `id` field is validated to
 * be compliant with UUID version 4 (RFC4122), the `corsProxy` and `url` fields are validated to be
 * well-formed HTTP or HTTPS URI (RFC3986), or valid SSH URI (Provisional IANA format standard) in
 * the case of the `url` field.
 * @param repo A Repository object.
 * @returns {boolean} A boolean indicating a well-formed Repository on true, and false otherwise.
 */
export const isValidRepository = (repo: Repository): boolean =>
  isDefined(repo.id) &&
  repo.name.length > 0 &&
  (isWebUri(repo.corsProxy) ? true : false) &&
  isValidRepositoryURL(repo.url);

/**
 * Checks for valid URL that is a well-formed HTTP or HTTPS URI (RFC3986), or valid SSH URI
 * (Provisional IANA format standard).
 * @param url A repository URL string.
 * @returns {boolean} A boolean indicating a well-formed repository URL on true, and false
 * otherwise.
 */
export const isValidRepositoryURL = (url: string): boolean =>
  (isWebUri(url) ? true : false) ||
  /((git|ssh?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(url);

/**
 * Internal helper function for parsing a Git remote URL into its host and path components.
 * Inspired by: https://github.com/alefteris/git-remote-protocol
 * @param remoteUrl A Git remote URL.
 * @returns {{host: string | null; path: string}} A JavaScript object (key-value) with the host and path components.
 */
const parseRemote = (remoteUrl: string): {host: string | null; path: string} => {
  const _remoteUrl = remoteUrl.replace(/^git@/, 'ssh://git@');
  const parsedUrl = url.parse(_remoteUrl);
  const host = parsedUrl.host;
  const path = parsedUrl.path?.replace(/^\/:?/, '') ?? '';
  return {host, path};
};

/**
 * Convert a Git remote URL to HTTPS protocol.
 * Inspired by: https://github.com/alefteris/git-remote-protocol
 * @param remoteUrl A Git remote URL.
 * @returns {string} The Git remote URL using the HTTPS protocol.
 */
export const toHTTPS = (remoteUrl: string): string => {
  const parsedRemote = parseRemote(remoteUrl);
  return `https://${parsedRemote.host}/${parsedRemote.path}`;
};

/**
 * Convert a Git remote URL to SSH protocol.
 * Inspired by: https://github.com/alefteris/git-remote-protocol
 * @param remoteUrl A Git remote URL.
 * @returns {string} The Git remote URL using the SSH protocol.
 */
export const toSSH = (remoteUrl: string): string => {
  const parsedRemote = parseRemote(remoteUrl);
  return `git@${parsedRemote.host}:${parsedRemote.path}`;
};

/**
 * Checks for ssh or git protocols in use within a URL and converts to HTTP/HTTPS. This is required
 * in order to handle GitHub SSH URL formats that would normally cause git protocols that rely on
 * valid HTTP/HTTPS URLs to fail.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns {string} A string containing an HTTPS protocol URL that matches to the incoming URL
 * variant.
 */
export const resolveURL = (url: string): string => {
  const isSSH = /((git|ssh?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(url);
  return isSSH ? toHTTPS(url) : url;
};
