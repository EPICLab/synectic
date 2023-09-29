import { toHTTPS } from 'git-remote-protocol';
import parsePath from 'parse-path';
import parseUrl from 'parse-url';
import type { Repository } from 'types/repo';
import { ParseArgsConfig, parseArgs } from 'util';
import { isWebUri } from 'valid-url';
import { isDefined } from '../utils';

export const revParseArgs = (
  args: { [k: string]: boolean },
  options: ParseArgsConfig['options']
) => {
  const definedArgs: string[] = Object.entries(args)
    .filter(([, v]) => v === true)
    .map(([k]) => `--${k}`);
  return parseArgs({ args: definedArgs, options, tokens: true }).values;
};

export const errorLogger = (
  isError: boolean,
  error: string,
  fields: Map<string, string | undefined>
) => {
  if (isError) {
    console.groupCollapsed(
      `%c${error} :`,
      'background: aquamarine; color: #444; padding: 3px; border-radius: 5px;'
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
  url: URL | string
): { url: parsePath.ParsedPath; oauth: Repository['oauth'] } => {
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
  return { url: parsePath(resolveURL(parsedUrl.href)), oauth: oauth };
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
 * Checks for ssh or git protocols in use within a URL and converts to http/https. This is directly
 * needed in order to support **isomorphic-git** commands that require a URL, but do not currently
 * support ssh or git protocols. See
 * https://github.com/isomorphic-git/isomorphic-git/issues/665 or https://github.com/isomorphic-git/isomorphic-git/issues/231.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns {string} A string containing an https protocol URL that matches to the incoming URL
 * variant.
 */
export const resolveURL = (url: string): string => {
  const isSSH = /((git|ssh?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(url);
  return isSSH ? toHTTPS(url) : url;
};
