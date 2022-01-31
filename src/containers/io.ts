import * as fs from 'fs-extra';
import * as path from 'path';
import pako from 'pako';
import { TextDecoder } from 'util';

/**
 * **WARNING**
 * If a method is not included here, please see [node-fs-extra](https://github.com/jprichardson/node-fs-extra) for possible
 * utility functions that improve upon the default filesystem functions in [Node.js FS module](https://nodejs.org/api/fs.html).
 * If there is no functions in `node-fs-extra` or `fs`, then a new method can be added here.
 */

import type { Filetype } from '../types';
import { flattenArray } from './flatten';

/**
 * Encoding formats that adhere to the name of 
 * [Node.js-supported encodings](https://stackoverflow.com/questions/14551608/list-of-encodings-that-node-js-supports#14551669).
 */
export type nodeEncoding = 'ascii' | 'base64' | 'hex' | 'ucs-2' | 'utf-16le' | 'utf-8' | 'binary' | 'latin1';

/**
 * Encoding formats that adhere to the name of decoding algorithms available for 
 * [TextDecoder.prototype.encoding](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder/encoding).
 * Except for `bytes`, which directly maps to the notion of a `byte-array` in other languages. This format
 * requires encoding in a `Uint8Array` within JavaScript/TypeScript.
 */
export type decoderEncoding = 'utf-8' | 'ibm866' | 'iso-8859-2' | 'iso-8859-3' | 'iso-8859-4' | 'iso-8859-5' |
  'iso-8859-6' | 'iso-8859-7' | 'iso-8859-8' | 'iso-8859-8i' | 'iso-8859-10' | 'iso-8859-13' | 'iso-8859-14' |
  'iso-8859-15' | 'iso-8859-16' | 'koi8-r' | 'koi8-u' | 'macintosh' | 'windows-874' | 'windows-1250' |
  'windows-1251' | 'windows-1252' | 'windows-1253' | 'windows-1254' | 'windows-1255' | 'windows-1256' |
  'windows-1257' | 'windows-1258' | 'x-mac-cyrillic' | 'gbk' | 'gb18030' | 'hz-gb-2312' | 'big5' | 'euc-jp' |
  'iso-2022-jp' | 'shift-jis' | 'euc-kr' | 'iso-2022-kr' | 'utf-16be' | 'utf-16le' | 'bytes';

/**
 * Extracts the file stats information from the filepath. Returns an `fs.Stats` class 
 * object as defined in the Node.js File System API (@link https://nodejs.org/api/fs.html#fs_class_fs_stats).
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object for a fs.Stats object containing information about a file, or undefined 
 * if filepath refers to a nonexistent file or directory (or read permissions are missing).
 */
export const extractStats = (filepath: fs.PathLike): Promise<fs.Stats | undefined> => {
  return new Promise<fs.Stats | undefined>(resolve => {
    fs.stat(filepath.toString())
      .then((stat) => resolve(stat))
      .catch(() => resolve(undefined));
  });
};

/**
 * Extract the file basename from the path. Returns the filename, including extension, after the last 
 * platform-agnostic file separator (e.g. '/src/api/router.asp' is translated to 'router.asp'). Exhibits different 
 * behavior from `path.basename` since that API uses `path.delimiter` in order to set the delimiter for path 
 * processing, and this function is instead able to process paths across platforms (e.g. processing Windows paths 
 * on a MacOS platform).
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the file basename.
 */
export const extractFilename = (filepath: fs.PathLike): string => {
  const filename = filepath.toString().split(/[\\/]/).pop() as string;
  // filename can safely be cast as string because although pop() has a return type of string | undefined, it
  // cannot actually return undefined because split() returns string[] that is at worst empty
  return filename;
};

/**
 * Extract the directory name from the path. Returns the nearest directory name, excluding file separators 
 * (e.g. '/src/api/router.asp' is translated to 'api'). Exhibits different behavior from `path.dirname` since
 * that API returns the full path of directories and includes '.' as a result for a single directory path, 
 * whereas this function always returns only one directory name (or '' if only a path to a file is provided).
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the directory name.
 */
export const extractDirname = (filepath: fs.PathLike): string => {
  const trailingSeparator = filepath.toString().slice(-1)[0]?.match(/[\\/]/) !== null;
  const expandedPath = filepath.toString().split(/[\\/]/);
  if (expandedPath.length > 1) return expandedPath[expandedPath.length - 2];
  if (trailingSeparator) return expandedPath[expandedPath.length - 1];
  else return '';
};

/**
 * Extract the file extension from the path. Returns the extension after the last period character in the path, 
 * otherwise returns full path if first character is a period or no period exists. Exhibits different behavior 
 * from `path.extname` in order to allow config files (e.g. '.htaccess' returns 'htaccess', instead of '').
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the file extension.
 */
export const extractExtension = (filepath: fs.PathLike): string => {
  const ext = filepath.toString().split('.').pop() as string;
  // ext can safely be cast as string because although pop() has a return type of string | undefined, it
  // cannot actually return undefined because split() returns string[] that is at worst empty
  return ext;
};

/**
 * Asynchronously read file contents into a Buffer or string.
 * @param filepath A valid filename or path to read from.
 * @param options Options object for setting either file encoding (default: `null`) or file system flags (default: `"r"`).
 * The possible option values are:
 * 
 * | encoding              | description                                                                                                                                                   |
 * | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | `"ascii"`             | ASCII (also ISO-IR-006) is a character encoding standard used as the base for most modern character-encoding schemes, typical defaults to US-ASCII variant.   |
 * | `"base64"`            | Base64 is a binary-to-text coding scheme that represents data in an ASCII string format by translating into a radix-64 representation.                        |
 * | `"hex"`               | Hexidecimal (base16) is a binary-to-text coding scheme that represents data in an ASCII string format by translating into a radix-16 representation.          |
 * | `"ucs-2"`             | UCS-2 (also ISO-10646) is a 2-byte character set for encoding Unicode characters under the Universal Character Set standard. Superseded by UTF-8 and UTF-16.  |
 * | `"utf-16le"`          | UTF-16 (also ISO-10646) is a variable-length (either one or tow 16-bit code units) for representing any Unicode character.                                    |
 * | `"utf-8"`             | UTF-8 (also ISO-10646) can represent any character in the Unicode standard using 1 to 4 bytes (8-bit) code units. UTF-8 is backwards compatible with ASCII.   |
 * | `"binary"`/`"latin1"` | Latin-1 (also ISO-8859-1) is an 8-bit character set representing Western European languages.                                                                  |
 *
 * | flags   | description                                                                                                                |
 * | ------- | -------------------------------------------------------------------------------------------------------------------------- |
 * | `"a"`   | Open file for appending. The file is created if it does not exist.                                                         |
 * | `"ax"`  | Like `"a"` but fails if the path exists.                                                                                   |
 * | `"a+"`  | Open file for reading and appending. The file is created if it does not exist.                                             |
 * | `"ax+"` | Like `"a+"` but fails if the path exists.                                                                                  |
 * | `"as"`  | Open file for appending in synchronous mode. The file is created if it does not exist.                                     |
 * | `"as+"` | Open file for reading and appending in synchronous mode. The file is created if it does not exist.                         |
 * | `"r"`   | Open file for reading. An exception occurs if the file does not exist.                                                     |
 * | `"r+"`  | Open file for reading and writing. An exception occurs if the file does not exist.                                         |
 * | `"rs+"` | Open file for reading and writing in synchronous mode. Instructs the OS to bypass the local file system cache.             |
 * | `"w"`   | Open file for writing. The file is created (if it does not exist) or truncated (if it exists).                             |
 * | `"wx"`  | Like `"w"` but fails if the path exists.                                                                                   |
 * | `"w+"`  | Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).                 |
 * | `"wx+"` | Like `"w+"` but fails if the path exists.                                                                                  |
 * @return A Promise object containing a Buffer, if no flag or encoding was provided, or a string of the file contents. Throws ENOENT error
 * on non-existent filepath, and EISDIR error on a filepath pointing to a directory. 
 */
export function readFileAsync(
  filepath: fs.PathLike, options: { flag: string } | { encoding: nodeEncoding; flag?: string }
): Promise<string>;
export function readFileAsync(filepath: fs.PathLike): Promise<Buffer>;
export function readFileAsync(
  filepath: fs.PathLike, options?: { flag: string } | { encoding: nodeEncoding; flag?: string }
): Promise<string> | Promise<Buffer> {
  const fullPath = path.resolve(filepath.toString());
  if (options) return fs.readFile(fullPath, options);
  else return fs.readFile(fullPath);
}

/**
 * Decompress binary encoded content and return in the specified encoding; default is a `Utf8Array` for `bytes` binary data.
 * This method is particularly useful for reading *Git Object* files. Git stores *Git Object* files in the *.git/objects* 
 * directory, in a binary format that has been compressed using the `zlib` library. To read these files we use the `pako` 
 * package, which is a performant JavaScript port of the `zlib` library packaged as a Node.js module.
 * @param filepath A valid *Git Object* filename or path to read from.
 * @return A Promise object containing the decoded file contents in the specified encoding; binary bytes are stored in
 * a `Uint8Array`, and all others are returned as `string` types.
 */
export function decompressBinaryObject(filecontent: Buffer, format: 'bytes'): Uint8Array;
export function decompressBinaryObject(filecontent: Buffer, format?: Exclude<decoderEncoding, 'bytes'>): string;
export function decompressBinaryObject(filecontent: Buffer, format?: decoderEncoding): Uint8Array | string {
  let decompressed: Uint8Array;
  try {
    decompressed = pako.inflate(filecontent);
  } catch (error) {
    decompressed = pako.inflate(pako.deflate(filecontent, { level: 1 }));
  }
  if (!format || format == 'bytes') return decompressed;
  const decoder = new TextDecoder(format);
  return decoder.decode(decompressed);
}

/**
 * Asynchronously read filenames contained within a target directory.
 * @param filepath A valid directory path to read from.
 * @return A Promise object for an array of filenames. Throws ENOENT error on non-existent filepath, and ENOTDIR error on 
 * a filepath pointing to a file.
 */
export const readDirAsync = (filepath: fs.PathLike): Promise<string[]> => {
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(path.resolve(filepath.toString()), (error, files) => {
      if (error) reject(error);
      else resolve(files);
    })
  });
};

/**
 * Asynchronously checks for the existence of a directory at the path.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing a boolean indicating true if the filepath is a directory, or false otherwise. Throws 
 * ENOENT error on non-existent filepath.
 */
export const isDirectory = async (filepath: fs.PathLike): Promise<boolean> => (await fs.stat(filepath.toString())).isDirectory();

/**
 * Asynchronously and recursively descends from a root directory to read filenames and child directories. 
 * Descends to `depth` level, if specified, otherwise defaults to recursively visiting all sub-directories. 
 * @param filepath A valid directory path to read from.
 * @param depth Number of sub-directories to descend; defaults to infinity.
 * @return A Promise object for an array of filenames. Throws ENOENT error on non-existent filepath, and ENOTDIR error on
 * a filepath pointing to a file.
 */
export const readDirAsyncDepth = async (filepath: fs.PathLike, depth = Infinity): Promise<string[]> => {
  const files = await Promise.all((await fs.readdir(filepath.toString())).map(async f => {
    const fullPath = path.join(filepath.toString(), f);
    return depth > 1 && (await isDirectory(fullPath)) ? await readDirAsyncDepth(fullPath, depth - 1) : fullPath;
  }));
  return [...flattenArray(files), filepath.toString()];
}

/**
 * Asynchronously filter for either directories or files from an array of both. Returns filepaths
 * of all child directories (default), or all child files if `fileOnly` option is enabled.
 * @param filepaths Array containing filepaths for directories and files.
 * @param fileOnly Flag for returning only filepaths for files; defaults to false.
 * @Return A Promise object for an array containing filepaths for either all child directories or all child files.
 */
export const filterReadArray = async (filepaths: fs.PathLike[], fileOnly = false): Promise<fs.PathLike[]> => {
  return await filepaths.reduce(async (previousPromise: Promise<fs.PathLike[]>, filepath: fs.PathLike) => {
    const collection = await previousPromise;
    const directory = await isDirectory(filepath);
    if (fileOnly && !directory) collection.push(filepath);
    if (!fileOnly && directory) collection.push(filepath);
    return collection;
  }, Promise.resolve([]));
};

/**
 * Asynchronously write data to a file. Creates a new file if none exists; will destructively rewrite existing files.
 * @param filepath A valid filename or path to write data to.
 * @param data A string or buffer containing data to be written.
 * @param options Options object for setting file encoding (default: `"utf8"`), file mode (default: `0o666`), and file system flags 
 * (default: `"w"`). The possible option values are:
 *
 * | encoding                 | description                                                                                                                                                   |
 * | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
 * | `"ascii"`                | ASCII (also ISO-IR-006) is a character encoding standard used as the base for most modern character-encoding schemes, typical defaults to US-ASCII variant.   |
 * | `"base64"`               | Base64 is a binary-to-text coding scheme that represents data in an ASCII string format by translating into a radix-64 representation.                        |
 * | `"hex"`                  | Hexidecimal (base16) is a binary-to-text coding scheme that represents data in an ASCII string format by translating into a radix-16 representation.          |
 * | `"ucs2"`/`"ucs-2"`       | UCS-2 (also ISO-10646) is a 2-byte character set for encoding Unicode characters under the Universal Character Set standard. Superseded by UTF-8 and UTF-16.  |
 * | `"utf16le"`/`"utf-16le"` | UTF-16 (also ISO-10646) is a variable-length (either one or tow 16-bit code units) for representing any Unicode character.                                    |
 * | `"utf8"`/`"utf-8"`       | UTF-8 (also ISO-10646) can represent any character in the Unicode standard using 1 to 4 bytes (8-bit) code units. UTF-8 is backwards compatible with ASCII.   |
 * | `"binary"`/`"latin1"`    | Latin-1 (also ISO-8859-1) is an 8-bit character set representing Western European languages.                                                                  |
 *
 * Mode adheres to the Unix/Linux permissions model. This model contain Read, Write, and Execute permissions that are combined into an 
 * octal value representing the combined permissions for each of the Owner, Group, and Other (world) attributes. For embedding purposes 
 * the permissions are stored with a umask; e.g. `0o753` represents the permission octal `7` for Owner, `5` for Group, and `3` for Other 
 * (world). The absolute octal permissions are:
 *
 * | octal | description                    |
 * | ----- | ------------------------------ |
 * | `0`   | No permission                  |
 * | `1`   | Execute permission             |
 * | `2`   | Write permission               |
 * | `3`   | Execute and write permission   |
 * | `4`   | Read permission                |
 * | `5`   | Read and execute permission    |
 * | `6`   | Read and write permission      |
 * | `7`   | All permissions                |
 *
 * | flags   | description                                                                                                                  |
 * | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
 * | `"a"`   | Open file for appending. The file is created if it does not exist.                                                           |
 * | `"ax"`  | Like `"a"` but fails if the path exists.                                                                                     |
 * | `"a+"`  | Open file for reading and appending. The file is created if it does not exist.                                               |
 * | `"ax+"` | Like `"a+"` but fails if the path exists.                                                                                    |
 * | `"as"`  | Open file for appending in synchronous mode. The file is created if it does not exist.                                       |
 * | `"as+"` | Open file for reading and appending in synchronous mode. The file is created if it does not exist.                           |
 * | `"r"`   | Open file for reading. An exception occurs if the file does not exist.                                                       |
 * | `"r+"`  | Open file for reading and writing. An exception occurs if the file does not exist.                                           |
 * | `"rs+"` | Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache. |
 * | `"w"`   | Open file for writing. The file is created (if it does not exist) or truncated (if it exists).                               |
 * | `"wx"`  | Like `"w"` but fails if the path exists.                                                                                     |
 * | `"w+"`  | Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).                   |
 * | `"wx+"` | Like `"w+"` but fails if the path exists.                                                                                    |
 * @return A Promise object for the file write operation; where errors cause a rejection.
 */
export const writeFileAsync = (
  filepath: fs.PathLike, data: string | Buffer, options?: { encoding?: nodeEncoding; flag?: string; mode?: number }
): Promise<void> => {
  const fullPath = path.resolve(filepath.toString());
  if (options) return fs.writeFile(fullPath, data, options);
  else return fs.writeFile(fullPath, data);
};

/**
 * Checks whether or not a given file name and accompanying extension are valid. Checks for invalid characters and invalid placement of 
 * characters. Also checks for an empty file name if the extension is not a .config file. 
 * @param fileName A string file name with its accompanying .extension.
 * @param configExts An array of strings containing only valid .config extensions in the state.
 * @param exts An array of strings containing all valid extensions in the state.
 * @return A boolean value indicating whether or not the file name is valid. 
 */
export const validateFileName = (fileName: string, configExts: string[], exts: string[]): boolean => {
  const index = fileName.lastIndexOf('.'); // Get index of last '.' in the file name
  const ext = index !== -1 ? fileName.substring(fileName.lastIndexOf('.')) : ''; // grabs the extension plus the '.' before it
  const name = index !== -1 ? fileName.substr(0, index) : fileName; // grabs the file name w/o the extension and the '.' before it

  /* Regex matches all occurences of invalid file name characters in the set: <, >, \, /, |, ?, *, and 
  characters NULL to US (ASCII values 0 to 31) */
  // eslint-disable-next-line no-control-regex
  const flag = !(/[<>:"\\/|?*\x00-\x1F]/g).test(name) && name.slice(-1) !== ' ' && name.slice(-1) !== '.';

  /* If ext is a .config extension, just check for invalid chars and that the final char is not '.' or ' ' in file name
  Otherwise, check everything above AND that the file name is not empty and that the extension is valid */
  return (configExts.find(configExt => configExt === ext)) ? flag : name !== '' && exts.includes(ext.substr(1)) && flag;
}

/**
 * Appends a new file type extension to a given file name. Handles file names both with and without valid extensions, as well as file 
 * names with a trailing '.' from a partially deleted extension.
 * @param fileName A string holding the current file name, with or without the extension.
 * @param newFiletype A Filetype that contains the new extension to be added to the file name.
 * @return A string with the new extension correctly appended to the original file name.
 */
export const replaceExt = (fileName: string, newFiletype: Filetype): string => {
  const currentExtension = fileName.indexOf('.') !== -1 ? extractExtension(fileName) : ''; // get current file extension
  const configExtension = newFiletype.extensions.find(extension => extension.includes('.')); // get config file extension, otherwise undefined

  let finalFileName = '';

  if (configExtension) {
    if (!currentExtension && fileName.slice(-1) !== '.') {
      finalFileName = fileName + configExtension; // add config file extension to filename when no extension exists and last character is not a '.'
    } else if (!currentExtension && fileName.slice(-1) === '.') {
      finalFileName = fileName.slice(0, -1) + configExtension; // add config file extension when filename has a trailing '.' character
    } else {
      finalFileName = fileName.slice(0, -currentExtension.length - 1) + configExtension; // replace the old file extension with the config file extension
    }
  } else {
    if (!currentExtension && fileName.slice(-1) !== '.') {
      finalFileName = fileName + '.' + newFiletype.extensions[0]; // add new file extension when no current extension exists and last character is not a '.'
    } else if (!currentExtension && fileName.slice(-1) === '.') {
      finalFileName = fileName + newFiletype.extensions[0]; // add new file extension when filename has a trailing '.' character
    } else {
      finalFileName = fileName.slice(0, -currentExtension.length) + newFiletype.extensions[0]; // replace the old file extension with the new file extension
    }
  }

  return finalFileName;
}