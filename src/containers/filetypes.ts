import * as io from './io';
import { PathLike } from 'fs-extra';

const FILETYPES_PATH = './src/containers/filetypes.json';

export type Filetype = {
  name: string;
  handler: string;
  extensions: string[];
}

/**
 * Asynchronously locate and extract supported filetype metadata based on file extension.
 * @param extension A file extension for a supported language.
 * * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object for a Filetype corresponding to the extension, or undefined if extension is unsupported.
 */
export const findExtensionType = (extension: string, filetypesPath: PathLike = FILETYPES_PATH): Promise<Filetype | undefined> => {
  return new Promise((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<Filetype[]>(content))
      .then(filetypes => resolve(filetypes.find(f => f.extensions.some(e => e === extension))))
      .catch(error => reject(error.message));
  });
}