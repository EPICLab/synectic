import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Return the extension of the path, after the last '.' to end of string in the last portion of the path.
 * If there is no '.' in the last portion of the path or the first character of it is '.',
 * then it returns the entire string.
 * @param filepath The path to evaluate.
 */
export function extname(filepath: string): string {
  const ext: string | undefined = filepath.split('.').pop();
  if (ext !== undefined) return ext;
  else return filepath;
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
export function exists(filepath: string): Promise<boolean> {
  return new Promise((resolve, _) => {
    fs.stat(filepath)
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
export function readFileAsync(filepath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filepath), (error, result) => {
      if (error) reject(error);
      else resolve(result.toString());
    });
  });
}

/**
 * Asynchronously writes to a file; creates a new file if none exists.
 * @param filepath A valid filename or path to write the data to.
 * @param data A string containing content.
 */
export function writeFileAsync(filepath: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filepath), data, (error) => {
      if (error) {
        reject(error);
      } else {
        console.info('File `' + path.resolve(filepath) + '` created.');
        resolve();
      }
    });
  });
}
