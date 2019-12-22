import * as io from './io';
import { PathLike } from 'fs-extra';

const FILETYPES_PATH = './src/containers/filetypes.json';

export type FiletypeHandler = {
  filetype: string;
  handler: string;
  extensions: string[];
}

/**
 * Asynchronously locate and extract supported filetype handler based on provided filetype name.
 * @param filetype A filetype name for a supported language.
 * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object that resolves to a FiletypeHandler corresponding to the filetype, or rejects with
 * an error if an unsupported filetype or an error occurs in reading the JSON file contaning filetype metadata.
 */
export const findByFiletype = (filetype: string, filetypesPath: PathLike = FILETYPES_PATH) => {
  return new Promise<FiletypeHandler | Error>((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<FiletypeHandler[]>(content))
      .then(filetypes => {
        const filetypeHandler = filetypes.find(f => f.filetype === filetype);
        if (filetypeHandler) resolve(filetypeHandler);
        else reject(new Error(`Unsupported filetype handler '${filetype}'`));
      })
      .catch(error => reject(new Error(error.message)));
  });
}

/**
 * Asynchronously locate and extract supported filetype handler based on provided handler name.
 * @param handler A filetype handler for a supported language.
 * @param filetypesPath Optional path to a JSON file containing filetype metadata.
* @return A Promise object that resolves to a FiletypeHandler corresponding to the handler, or rejects with
 * an error if an unsupported filetype or an error occurs in reading the JSON file contaning filetype metadata.
 */
export const findByHandler = (handler: string, filetypesPath: PathLike = FILETYPES_PATH) => {
  return new Promise<FiletypeHandler | Error>((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<FiletypeHandler[]>(content))
      .then(filetypes => {
        const filetypeHandler = filetypes.find(f => f.handler === handler);
        if (filetypeHandler) resolve(filetypeHandler);
        else reject(new Error(`Unsupported filetype handler '${handler}'`));
      })
      .catch(error => reject(new Error(error.message)));
  });
}

/**
 * Asynchronously locate and extract supported filetype handler based on provided file extension.
 * @param extension A file extension for a supported language.
 * @param filetypesPath Optional path to a JSON file containing filetype metadata.
* @return A Promise object that resolves to a FiletypeHandler corresponding to the extension, or rejects with
 * an error if an unsupported filetype or an error occurs in reading the JSON file contaning filetype metadata.
 */
export const findByExtension = (extension: string, filetypesPath: PathLike = FILETYPES_PATH) => {
  return new Promise<FiletypeHandler | Error>((resolve, reject) => {
    io.readFileAsync(filetypesPath)
      .then(content => io.deserialize<FiletypeHandler[]>(content))
      .then(filetypes => {
        const filetypeHandler = filetypes.find(f => f.extensions.some(ext => ext === extension));
        if (filetypeHandler) resolve(filetypeHandler);
        else reject(new Error(`Unsupported filetype extension '${extension}'`));
      })
      .catch(error => reject(new Error(error.message)));
  });
}