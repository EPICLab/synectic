import * as io from './io';
import { snackbar } from './notifications';

export interface Filetype {
  name: string;
  handler: string;
  extensions: string[];
}

/**
 * Asynchronous search for defined filetype corresponding to a filetype name.
 * @param name The file format name to search for within filetypes.
 * @return Filetype instance corresponding to name, or undefined if no matches found.
 */
export function searchName(name: string): Promise<Filetype | undefined> {
  return new Promise((resolve, reject) => {
    io.readFileAsync('src/core/fs/filetypes.json')
      .then(content => io.deserialize<Filetype[]>(content))
      .then(filetypes => resolve(filetypes.find(f => f.name.indexOf(name) != -1)))
      .catch(error => reject(snackbar(global.Synectic.current, error.message, 'Filetype Search Error: Names')));
  });
}

/**
 * Asynchronous search for defined filetype corresponding to a file extension.
 * @param extension The file extension to search for within filetypes.
 * @return Filetype instance corresponding to extension, or undefined if no matches found.
 */
export function searchExt(extension: string): Promise<Filetype | undefined> {
  return new Promise((resolve, reject) => {
    io.readFileAsync('src/core/fs/filetypes.json')
      .then(content => io.deserialize<Filetype[]>(content))
      .then(filetypes => resolve(filetypes.find(f => f.extensions.some(e => e === extension))))
      .catch(error => reject(snackbar(global.Synectic.current, error.message, 'Filetype Search Error: Extensions')));
    });
}
