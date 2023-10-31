import type {PathLike} from 'fs-extra';

/**
 * Extract the file basename from the path. Returns the filename, including extension, after the
 * last platform-agnostic file separator (e.g. '/src/api/router.asp' is translated to 'router.asp').
 * Exhibits different behavior from `path.basename` since that API uses `path.delimiter` in order to
 * set the delimiter for path processing, and this function is instead able to process paths across
 * platforms (e.g. processing Windows paths on a MacOS platform).
 *
 * @param filepath The relative or absolute path to evaluate.
 * @returns {string} A string containing the file basename.
 */
export const extractFilename = (filepath: PathLike): string => {
  const filename = filepath.toString().split(/[\\/]/).pop() as string;
  // filename can safely be cast as string because although pop() has a return type of string | undefined, it
  // cannot actually return undefined because split() returns string[] that is at worst empty
  return filename;
};

/**
 * Extract the directory name from the path. Returns the nearest directory name, excluding file
 * separators (e.g. '/src/api/router.asp' is translated to 'api'). Exhibits different behavior from
 * `path.dirname` since that API returns the full path of directories and includes '.' as a result
 * for a single directory path, whereas this function always returns only one directory name (or ''
 * if only a path to a file is provided).
 *
 * @param filepath The relative or absolute path to evaluate.
 * @returns {string} A string containing the directory name.
 */
export const extractDirname = (filepath: PathLike): string => {
  const trailingSeparator = filepath.toString().slice(-1)[0]?.match(/[\\/]/) !== null;
  const expandedPath = filepath.toString().split(/[\\/]/);
  if (expandedPath.length > 1) return expandedPath[expandedPath.length - 2] as string;
  if (trailingSeparator) return expandedPath[expandedPath.length - 1] as string;
  else return '';
};
