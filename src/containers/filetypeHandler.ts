import * as io from './io';
import { PathLike } from 'fs-extra';

const FILETYPES_PATH = './src/containers/filetypes.json';

export type FiletypeHandler = {
  filetype: string;
  handler: string;
  extensions: string[];
}

/**
 * Asynchronously locate and extract supported filetype metadata based on filetype name.
 * @param filetype A filetype name for a supported language.
 * * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object for a FiletypeHandler corresponding to the filetype, or undefined if filetype is unsupported.
 */
export const findByFiletype = (filetype: string, filetypesPath: PathLike = FILETYPES_PATH): Promise<FiletypeHandler | undefined> => {
  return new Promise((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<FiletypeHandler[]>(content))
      .then(filetypes => resolve(filetypes.find(f => f.filetype === filetype)))
      .catch(error => reject(error.message));
  });
}

/**
 * Asynchronously locate and extract supported filetype metadata based on filetype handler.
 * @param handler A filetype handler for a supported language.
 * * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object for a FiletypeHandler corresponding to the handler, or undefined if handler is unsupported.
 */
export const findByHandler = (handler: string, filetypesPath: PathLike = FILETYPES_PATH): Promise<FiletypeHandler | undefined> => {
  return new Promise((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<FiletypeHandler[]>(content))
      .then(filetypes => resolve(filetypes.find(f => f.handler === handler)))
      .catch(error => reject(error.message));
  });
}

/**
 * Asynchronously locate and extract supported filetype metadata based on file extension.
 * @param extension A file extension for a supported language.
 * * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object for a FiletypeHandler corresponding to the extension, or undefined if extension is unsupported.
 */
export const findByExtension = (extension: string, filetypesPath: PathLike = FILETYPES_PATH): Promise<FiletypeHandler | undefined> => {
  return new Promise((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<FiletypeHandler[]>(content))
      .then(filetypes => resolve(filetypes.find(f => f.extensions.some(e => e === extension))))
      .catch(error => reject(error.message));
  });
}