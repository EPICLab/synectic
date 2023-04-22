import * as fs from 'fs-extra';
import * as path from 'path';
import { nodeEncoding } from './io-types';

export function readFileAsync(
  filepath: fs.PathLike,
  options: { flag: string } | { encoding: nodeEncoding; flag?: string }
): Promise<string | Buffer>;
export function readFileAsync(filepath: fs.PathLike): Promise<Buffer>;
/**
 * Asynchronously read file contents into a Buffer or string.
 *
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
 * @returns {Promise<string>} A Promise object containing a Buffer, if no flag or encoding was provided, or a string of the file contents.
 * Throws ENOENT error on non-existent filepath, and EISDIR error on a filepath pointing to a directory.
 */
export function readFileAsync(
  filepath: fs.PathLike,
  options?: { flag: string } | { encoding: nodeEncoding; flag?: string }
): Promise<string | Buffer> | Promise<Buffer> {
  const fullPath = path.resolve(filepath.toString());
  if (options) return fs.readFile(fullPath, options);
  else return fs.readFile(fullPath);
}
