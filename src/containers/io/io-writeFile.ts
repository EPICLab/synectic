import * as fs from 'fs-extra';
import * as path from 'path';
import { nodeEncoding } from './io-types';

/**
 * Asynchronously write data to a file. Creates a new file if none exists; will destructively rewrite existing files.
 *
 * @param filepath - A valid filename or path to write data to.
 * @param data - A string or buffer containing data to be written.
 * @param options - Options object for setting file encoding (default: `"utf8"`), file mode (default: `0o666`), and file system flags
 * (default: `"w"`).
 * @param options.encoding - The possible option values are:
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
 * @param options.mode - Mode adheres to the Unix/Linux permissions model. This model contain Read, Write, and Execute permissions that are
 * combined into an octal value representing the combined permissions for each of the Owner, Group, and Other (world) attributes. For
 * embedding purposes the permissions are stored with a umask; e.g. `0o753` represents the permission octal `7` for Owner, `5` for Group,
 * and `3` for Other (world). The absolute octal permissions are:
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
 * @param options.flag - Flags adhere to the following:
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
 * @returns {Promise<void>} A Promise object for the file write operation; where errors cause a rejection.
 */

export const writeFileAsync = (
  filepath: fs.PathLike,
  data: string | Buffer,
  options?: { encoding?: nodeEncoding; flag?: string; mode?: number }
): Promise<void> => {
  const fullPath = path.resolve(filepath.toString());
  if (options) return fs.writeFile(fullPath, data, options);
  else return fs.writeFile(fullPath, data);
};
