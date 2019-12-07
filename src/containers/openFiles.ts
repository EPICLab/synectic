import { OpenDialogOptions, remote } from 'electron';

import { extractExtension } from './io';
import { findByExtension } from './filetypeHandler';
import { PathLike } from 'fs-extra';

export type FileMetadata = {
  readonly path: PathLike;
  readonly filetype: string;
  readonly handler: string;
}

/**
 * Asynchronously extract file extension from filepath and locate supported filetype metadata, if supported.
 * Otherwise, throws runtime error on unsupported extensions.
 * @param filepath The relative or absolute path to convert.
 * @return A Promise object for a FileMetadata corresponding to the extension found in filepath.
 */
const pathToFileMetadata = (filepath: PathLike): Promise<FileMetadata> => {
  const extension = extractExtension(filepath);
  return new Promise<FileMetadata>((resolve, reject) => {
    findByExtension(extension)
      .then(filetypeHandler => filetypeHandler ?
        resolve({ path: filepath, filetype: filetypeHandler.filetype, handler: filetypeHandler.handler })
        : new Error(`Unsupported extension '${extension}' from '${filepath.toString()}'`))
      .catch(error => reject(error.message));
  });
}

/**
 * Wrapper for mapping the pathToFileMetadata for each filepath in an array and awaiting all Promises inquired.
 * @param filepaths The array of relative or absolute paths to convert.
 * @return A Promise object for an array of FileMetadata objects corresponding to the filepaths. 
 */
const pathsToFileMetadatas = (filepaths: PathLike[]): Promise<FileMetadata[]> => {
  return Promise.all(filepaths.map(async filepath => await pathToFileMetadata(filepath)));
}

/**
 * Displays the built-in Electron OpenDialog for selecting file(s) for opening within Synectic.
 * @param options Options corresponding to Electron.OpenDialogOptions 
 * (https://electronjs.org/docs/api/dialog#dialogshowopendialogbrowserwindow-options).
 * @return Array of filetype metadata corresponding to the extension of the selected file.
 */
const openFileDialog = (options: OpenDialogOptions) => {
  const dialog = remote.dialog.showOpenDialog(remote.getCurrentWindow(), options);
  return new Promise<FileMetadata[]>((resolve) => {
    dialog
      .then(openDialogReturnValue => {
        if (openDialogReturnValue.canceled) resolve([]);
        if (openDialogReturnValue.filePaths) resolve(pathsToFileMetadatas(openDialogReturnValue.filePaths));
      })
      .catch(error => console.log(error.message));
  });
}

export default openFileDialog;