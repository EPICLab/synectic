/**
 * Checks whether or not a given file name and accompanying extension are valid. Checks for invalid
 * characters and invalid placement of characters. Also checks for an empty file name if the
 * extension is not a .config file.
 *
 * @param fileName A string file name with its accompanying .extension.
 * @param configExts An array of strings containing only valid .config extensions in the state.
 * @param exts An array of strings containing all valid extensions in the state.
 * @returns {boolean} A boolean value indicating whether or not the file name is valid.
 */

export const validateFileName = (
  fileName: string,
  configExts: string[],
  exts: string[]
): boolean => {
  const index = fileName.lastIndexOf('.'); // Get index of last '.' in the file name
  const ext = index !== -1 ? fileName.substring(fileName.lastIndexOf('.')) : ''; // grabs the extension plus the '.' before it
  const name = index !== -1 ? fileName.substr(0, index) : fileName; // grabs the file name w/o the extension and the '.' before it

  /**
   * Regex matches all occurences of invalid file name characters in the set: <, >, , /, |, ?, *,
   * and characters NULL to US (ASCII values 0 to 31)
   */
  /* eslint-disable no-control-regex */
  const flag =
    !/[<>:"\\/|?*\x00-\x1F]/g.test(name) && name.slice(-1) !== ' ' && name.slice(-1) !== '.';
  /* eslint-enable no-control-regex */
  /**
   * If ext is a .config extension, just check for invalid chars and that the final char is not '.'
   * or ' ' in file name Otherwise, check everything above AND that the file name is not empty and
   * that the extension is valid
   */
  return configExts.find(configExt => configExt === ext)
    ? flag
    : name !== '' && exts.includes(ext.substr(1)) && flag;
};
