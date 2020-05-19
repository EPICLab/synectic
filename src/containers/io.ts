import * as fs from 'fs-extra';
import * as path from 'path';
import { flatten } from './flatten';

/**
 * Extracts the file stats information from the filepath. Returns an `fs.Stats` class 
 * object as defined in the Node.js File System API (@link https://nodejs.org/api/fs.html#fs_class_fs_stats).
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object for a fs.Stats object containing information about a file, or undefined 
 * if filepath refers to a nonexistent file or directory (or read permissions are missing).
 */
export const extractStats = (filepath: fs.PathLike) => {
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
export const extractFilename = (filepath: fs.PathLike) => {
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
export const extractDirname = (filepath: fs.PathLike) => {
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
export const extractExtension = (filepath: fs.PathLike) => {
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
 * @return A Promise object containing a Buffer, if no flag or encoding was provided, or a string of the file contents.
 */
export function readFileAsync(filepath: fs.PathLike, options: { flag: string } | { encoding: string; flag?: string }): Promise<string>;
export function readFileAsync(filepath: fs.PathLike): Promise<Buffer>;
export function readFileAsync(filepath: fs.PathLike, options?: { flag: string } | { encoding: string; flag?: string }): Promise<string> | Promise<Buffer> {
  const fullPath = path.resolve(filepath.toString());
  if (options) return fs.readFile(fullPath, options);
  else return fs.readFile(fullPath);
}

/**
 * Asynchronously read filenames contained within a target directory.
 * @param filepath A valid directory path to read from.
 * @return A Promise object for an array of filenames.
 */
export const readDirAsync = (filepath: fs.PathLike) => {
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
 * @return A boolean indicating true if the filepath is a directory, or false otherwise.
 */
export const isDirectory = async (filepath: fs.PathLike) => (await fs.stat(filepath.toString())).isDirectory();

/**
 * Asynchronously and recursively descends from a root path directory to extract the contents of each
 * child directory. Returns filepaths of all child directories and files, including root path if `inclusive`
 * option is enabled (default).
 * @param filepath The relative or absolute path of the root directory to evaluate.
 * @param inclusive (Optional) Flag for including root directory and intermediate directories in output; defaults to true.
 * @return A Promise object for an array containing filepaths for all child directories and files.
 */
export const readDirAsyncDeep = async (filepath: fs.PathLike, inclusive = true): Promise<string[]> => {
  const files = await Promise.all((await fs.readdir(filepath.toString())).map(async f => {
    const fullPath = path.join(filepath.toString(), f);
    return (await isDirectory(fullPath)) ? await readDirAsyncDeep(fullPath) : fullPath;
  }));
  return inclusive ? [...flatten(files), filepath.toString()] : flatten(files);
};

/**
 * Asynchronously filter for either directories or files from an array of both. Returns filepaths
 * of all child directories (default), or all child files if `fileOnly` option is enabled.
 * @param filepaths Array containing filepaths for directories and files.
 * @param fileOnly (Optional) Flag for returning only filepaths for files; defaults to false.
 * @Return A Promise object for an array containing filepaths for either all child directories or all child files.
 */
export const filterReadArray = async (filepaths: fs.PathLike[], fileOnly = false) => {
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
 * @param options Options object for setting file encoding (default: `"utf8"`), file mode (default: `0o666`), and file system flags (default: `"w"`).
 * The possible option values are:
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
 * Mode adheres to the Unix/Linux permissions model. This model contain Read, Write, and Execute permissions that are combined into an octal value
 * representing the combined permissions for each of the Owner, Group, and Other (world) attributes. For embedding purposes the permissions are
 * stored with a umask; e.g. `0o753` represents the permission octal `7` for Owner, `5` for Group, and `3` for Other (world).
 * The absolute octal permissions are:
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
export const writeFileAsync = (filepath: fs.PathLike, data: string | Buffer, options?: { encoding?: string; flag?: string; mode?: number }): Promise<void> => {
  const fullPath = path.resolve(filepath.toString());
  if (options) return fs.writeFile(fullPath, data, options);
  else return fs.writeFile(fullPath, data);
};