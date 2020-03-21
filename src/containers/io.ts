import * as fs from 'fs-extra';
import * as path from 'path';
import { flatten } from './flatten';

/**
 * Converts a JavaScript Object Notation (JSON) string into a typed object.
 * @param json A valid JSON string.
 * @return A typed object (or nested array of objects).
 */
export const deserialize = <T>(json: string) => JSON.parse(json) as T;

/**
 * Filters an array and removes any undefined elements contained within it.
 * @param array The given array of elements that should be filtered for undefined.
 * @return The resulting array devoid of any undefined elements.
 */
export const removeUndefined = <T>(array: (T | undefined)[]): T[] => {
  return array.filter((item): item is T => typeof item !== 'undefined');
}

/**
 * Extracts the file stats information from the filepath. Returns an fs.Stats class 
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
 * Extract the file basename from the path. Returns the filename, including
 * extension, after the last platform-specific file separator 
 * (e.g. '/src/api/router.asp' is translated to 'router.asp').
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the file basename.
 */
export const extractFilename = (filepath: fs.PathLike) => {
  const filename = filepath.toString().split(/[\\/]/).pop();
  if (filename === undefined) return filepath.toString();
  else return filename;
}

/**
 * Extract the file extension from the path. Returns the extension after 
 * the last period character in the path, otherwise returns full path if 
 * first character is a period or no period exists.
 * @param filepath The relative or absolute path to evaluate.
 * @return A string containing the file extension.
 */
export const extractExtension = (filepath: fs.PathLike) => {
  const ext = filepath.toString().split('.').pop();
  if (ext === undefined) return filepath.toString();
  else return ext;
}

/**
 * Asynchronously read file contents into a string.
 * @param filepath A valid filename or path to read from.
 * @return A Promise object for a string containing the file contents.
 */
export const readFileAsync = (filepath: fs.PathLike): Promise<string> => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filepath.toString()), (error, result) => {
      if (error) reject(error);
      else resolve(result.toString());
    });
  });
}

/**
 * Asynchronously read filenames contained within a target directory.
 * @param filepath A valid directory path to read from.
 * @return A Promise object for an array of filenames.
 */
export const readDirAsync = (filepath: fs.PathLike): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readdir(path.resolve(filepath.toString()), (error, files) => {
      if (error) reject(error);
      else resolve(files);
    })
  });
};

const isDirectory = async (f: fs.PathLike) => (await fs.stat(f.toString())).isDirectory();

/**
 * Asynchronously and recursively descends from a root path directory to extract the contents of each
 * child directory. Returns filepaths of all child directories and files, including root path.
 * @param filepath The relative or absolute path of the root directory to evaluate.
 * @param inclusive Optional flag for including root directory and intermediate directories in output; default is true.
 * @return A Promise object for an array containing filepaths for all child directories and files.
 */
export const readDirAsyncDeep = async (filepath: fs.PathLike, inclusive = true): Promise<string[]> => {
  const files = await Promise.all((await fs.readdir(filepath.toString())).map(async f => {
    const fullPath = path.join(filepath.toString(), f);
    return (await isDirectory(fullPath)) ? await readDirAsyncDeep(fullPath) : fullPath;
  }));
  return inclusive ? [...flatten(files), filepath.toString()] : flatten(files);
}

/**
 * Asynchronously write data to a file. Creates a new file if none exists; will 
 * destructively rewrite existing files.
 * @param filepath A valid filename or path to write data to.
 * @param data A Promise object for the file write operation; where errors cause a rejection.
 */
export const writeFileAsync = (filepath: fs.PathLike, data: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filepath.toString()), data, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}