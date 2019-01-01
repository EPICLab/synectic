import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Return the extension of the path, from the last '.' to end of string in the last portion of the path.
 * If there is no '.' in the last portion of the path or the first character of it is '.', then it returns the entire string.
 * @param p The path to evaluate.
 */
export function extname(p: string): string {
  let ext: string | undefined = p.split('.').pop();
  if (ext !== undefined) return ext;
  else return p;
}

/**
 * Converts a JSON string into an object.
 * @param json A valid JSON string.
 * @return An object (can be an array of objects).
 */
export function deserialize<T>(json: string): T {
  return <T> JSON.parse(json);
}

/**
 * Asynchronously reads file content into a string.
 * @param filename A valid filename or path to read from.
 * @return A string containing the file content.
 */
export function readFileAsync(filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(filename), (error, result) => {
      if (error) reject(error);
      else resolve(result.toString());
    });
  });
}

/**
 * Asynchronously writes to a file; creates a new file if none exists.
 * @param filename A valid filename or path to write the data to.
 * @param data A string containing content.
 */
export function writeFileAsync(filename: string, data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(path.resolve(filename), data, path.extname(filename), (error) => {
      if (error) reject(error);
      else {
        console.info('File `' + path.resolve(filename) + '` created.');
        resolve();
      };
    });
  });
}
