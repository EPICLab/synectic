import * as fs from 'fs-extra';
import * as path from 'path';
// import { statSync, mkdirp } from 'fs-extra';

/**
 * Return the extension of the path, after the last '.' to end of string in the last portion of the path.
 * If there is no '.' in the last portion of the path or the first character of it is '.',
 * then it returns the entire string.
 * @param filepath The path to evaluate.
 */
export function extname(filepath: fs.PathLike): string {
  const ext: string | undefined = filepath.toString().split('.').pop();
  if (ext !== undefined && ext !== filepath.toString()) return ext;
  else return '';
}

/**
 * Converts a JSON string into an object.
 * @param json A valid JSON string.
 * @return An object (can be an array of objects).
 */
export function deserialize<T>(json: string): T {
  return JSON.parse(json) as T;
}

/**
 * Asynchronously checks for the existence of a file or directory within the
 * local filesystem.
 * @param filepath A valid filename or path to check.
 * @return Boolean indicating file or directory exists within filesystem.
 */
export function exists(filepath: fs.PathLike): Promise<boolean> {
  return new Promise((resolve, _) => {
    fs.stat(filepath.toString())
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

/**
 * Asynchronously reads file content into a string.
 * @param filepath A valid filename or path to read from.
 * @return A string containing the file content.
 */
export function readFileAsync(filepath: fs.PathLike): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filepath.toString()), (error, result) => {
      if (error) reject(error);
      else resolve(result.toString());
    });
  });
}

/**
 * Asynchronously reads file and directory  names from a directory into an array.
 * @param filepath A valid path for a directory to read from.
 * @param dirsOnly An optional flag for restricting filenames to directories only.
 * @return An array of filenames found within the directory.
 */
export function readDirAsync(filepath: fs.PathLike, dirsOnly?: boolean): Promise<string[]> {
  if (dirsOnly) {
    return new Promise((resolve, reject) => {
      fs.readdir(path.resolve(filepath.toString())).then(files => {
        const dirs = files.filter(f => fs.statSync(path.join(filepath.toString(), f)).isDirectory());
        if (dirs) {
          resolve(dirs);
        } else {
          reject();
        }
      })
    });
  } else {
    return fs.readdir(path.resolve(filepath.toString()));
  }
}

/**
 * Synchronously read a dir without worry of perms
 * @param  path
 * @return the result from readdirSync or a falsy value
 */
export function safeReadDirSync(path: fs.PathLike): string[] | null {
  let dirData: string[];
  try {
    dirData = fs.readdirSync(path);
  } catch (ex) {
    if (ex.code == "EACCES") {
      //User does not have permissions, ignore directory
      return null;
    }
    else throw ex;
  }
  return dirData;
}


/**
 * Asynchronously writes to a file; creates a new file if none exists.
 * @param filepath A valid filename or path to write the data to.
 * @param data A string containing content.
 */
export function writeFileAsync(filepath: fs.PathLike, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filepath.toString()), data, (error) => {
      if (error) {
        console.log(`writeFileAsync: error for '${filepath}'`);
        reject(error);
      } else {
        console.info(`File '${path.resolve(filepath.toString())}' created.`);
        resolve();
      }
    });
  });
}

/**
 * Asynchronously creates a directory; recursively creates directory structure if necessary.
 * @param filepath A valid directory path ending in OS-appropriate path separator character.
 */
export function writeDirAsync(filepath: fs.PathLike): Promise<void> {
  return fs.mkdirp(filepath.toString());
}

/**
 * Asynchronously copies a file or directory, including content within directories.
 * @param orig A valid filename or path to read files/directories from.
 * @param dest A valid filename or path to write files/directories to.
 */
export function copyFiles(orig: fs.PathLike, dest: fs.PathLike): Promise<string> {
  return new Promise ((resolve, reject) => {
    fs.copy(orig.toString(), dest.toString())
      .then(() => resolve(`Copied: ${orig.toString()} => ${dest.toString()}`))
      .catch(error => reject(error));
  });
}
