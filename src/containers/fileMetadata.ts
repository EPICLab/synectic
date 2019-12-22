import { extractExtension } from './io';
import { findByExtension } from './filetypeHandler';
import { PathLike } from 'fs-extra';

export type FileMetadata = {
  readonly path: PathLike;
  readonly filetype: string | null;
  readonly handler: string | null;
}

/**
 * Asynchronously convert filepath to file metadata, if supported filetype.
 * @param filepath The relative or absolute path to convert.
 * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object for a FileMetadata corresponding to the extension found in filepath.
 */
export const pathToFileMetadata = async (filepath: PathLike, filetypesPath?: PathLike): Promise<FileMetadata> => {
  const extension = extractExtension(filepath);
  const filetypeHandler = await (filetypesPath ? findByExtension(extension, filetypesPath) : findByExtension(extension));
  if (filetypeHandler instanceof Error) return { path: filepath, filetype: null, handler: null };
  else return { path: filepath, filetype: filetypeHandler.filetype, handler: filetypeHandler.handler };
}

/**
 * Wrapper for mapping the pathToFileMetadata for each filepath in an array and awaiting all subsequent Promises.
 * @param filepaths The array of relative or absolute paths to convert.
 * @param filetypesPath Optional path to a JSON file containing filetype metadata.
 * @return A Promise object for an array of FileMetadata objects corresponding to the filepaths. 
 */
export const batchPathsToFileMetadata = async (filepaths: PathLike[], filetypesPath?: PathLike): Promise<FileMetadata[]> => {
  return Promise.all(filepaths.map(async filepath => await (filetypesPath ? pathToFileMetadata(filepath, filetypesPath) : pathToFileMetadata(filepath))));
}

/*

file supported ?   -----> return filemetadata
file unsupported ? -----> return undefined
filetypes file is incorrect, corrupted, or cannot be accessed ? ------> return Error

*/