import { Filetype } from '../../store/slices/filetypes';
import { PathLike } from 'fs';

/**
 * Extract the file extension from the path. Returns the extension after the last period character in the path,
 * otherwise returns full path if first character is a period or no period exists. Exhibits different behavior
 * from `path.extname` in order to allow config files (e.g. '.htaccess' returns 'htaccess', instead of '').
 *
 * @param filepath The relative or absolute path to evaluate.
 * @returns {string} A string containing the file extension.
 */

export const extractExtension = (filepath: PathLike): string => {
  const ext = filepath.toString().split('.').pop() as string;
  // ext can safely be cast as string because although pop() has a return type of string | undefined, it
  // cannot actually return undefined because split() returns string[] that is at worst empty
  return ext;
};

/**
 * Appends a new file type extension to a given file name. Handles file names both with and without valid extensions, as well as file
 * names with a trailing '.' from a partially deleted extension.
 *
 * @param fileName A string holding the current file name, with or without the extension.
 * @param newFiletype A Filetype that contains the new extension to be added to the file name.
 * @returns {string} A string with the new extension correctly appended to the original file name.
 */

export const replaceExt = (fileName: string, newFiletype: Filetype): string => {
  const currentExtension = fileName.indexOf('.') !== -1 ? extractExtension(fileName) : ''; // get current file extension
  const configExtension = newFiletype.extensions.find(extension => extension.includes('.')); // get config file extension, otherwise undefined

  let finalFileName = '';

  if (configExtension) {
    if (!currentExtension && fileName.slice(-1) !== '.') {
      finalFileName = fileName + configExtension; // add config file extension to filename when no extension exists and last character is not a '.'
    } else if (!currentExtension && fileName.slice(-1) === '.') {
      finalFileName = fileName.slice(0, -1) + configExtension; // add config file extension when filename has a trailing '.' character
    } else {
      finalFileName = fileName.slice(0, -currentExtension.length - 1) + configExtension; // replace the old file extension with the config file extension
    }
  } else {
    if (!currentExtension && fileName.slice(-1) !== '.') {
      finalFileName = fileName + '.' + newFiletype.extensions[0]; // add new file extension when no current extension exists and last character is not a '.'
    } else if (!currentExtension && fileName.slice(-1) === '.') {
      finalFileName = fileName + newFiletype.extensions[0]; // add new file extension when filename has a trailing '.' character
    } else {
      finalFileName = fileName.slice(0, -currentExtension.length) + newFiletype.extensions[0]; // replace the old file extension with the new file extension
    }
  }

  return finalFileName;
};
