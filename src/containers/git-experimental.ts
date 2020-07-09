import * as fs from 'fs-extra';
import * as path from 'path';
import pako from 'pako';
import sha1 from 'sha1';
import * as io from './io';
export * from 'isomorphic-git';

/**
 * @experimental
 * Read and return the decompressed representation of file content which has been stored by git in
 * a compressed binary format (i.e. a *Git Object* file).
 * @param filepath The relative or absolute path of a file compressed and prepended with git head and tail.
 * @return A string of uncompressed file content.
 */
export const extractGitCompressed = async (filepath: fs.PathLike): Promise<string> => {
  const rawBuffer = await io.readFileAsync(path.resolve(filepath.toString()));
  const compressed = pako.deflate(rawBuffer, { level: 1 });
  const decompressed = pako.inflate(compressed, { to: 'string' });
  return decompressed;
};

/**
 * @experimental
 * Convert string input from base64 encoded binary to Uint8Array representation.
 * @param input A base64-encoded string capable of being converted to a binary array.
 * @return A Uint8Array representation of binary data.
 */
export const base64ToUint8Array = (input: string): Uint8Array => {
  const raw = atob(input);
  const array = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

/**
 * @experimental
 * Read and return the Uint8Array representation of the file contents, which translates into an array of numbers representing
 * the binary content of the file. Good for inserting into Buffer.from() in order to mock up these *Git Object* files.
 * @param filepath A valid *Git Object* filename or path to read from.
 * @return A Promise object containing a Uint8Array of the binary file content.
 */
export const readGitObjectToUint8Array = async (filepath: fs.PathLike): Promise<Uint8Array> => {
  const compressed = await io.readFileAsync(filepath);
  let decompressed: Uint8Array;
  try {
    decompressed = pako.inflate(compressed);
  } catch (error) {
    decompressed = pako.inflate(pako.deflate(compressed, { level: 1 }));
  }
  return decompressed;
}

/**
 * @experimental
 * @param filepath 
 */
export const explodeHash = async (filepath: fs.PathLike): Promise<string> => {
  const decoded = io.decompressBinaryObject(await io.readFileAsync(filepath))
  const hash = sha1(decoded);
  return hash;
}

/**
 * @experimental
 * @param filepath 
 */
export const explodeGitFile = async (filepath: fs.PathLike): Promise<{
  file: string;
  targetHash: string;
  binary: Uint8Array;
  decoded: string;
  hash: string;
}> => {
  const targetHash = io.extractDirname(filepath) + io.extractFilename(filepath);
  const binary = await readGitObjectToUint8Array(filepath);
  const decoded = io.decompressBinaryObject(await io.readFileAsync(filepath))
  const hash = sha1(decoded);
  return { file: filepath.toString(), targetHash: targetHash, binary: binary, decoded: decoded, hash: hash };
}

/**
 * @experimental
 * @param files 
 */
export const explodeGitFiles = async (files: fs.PathLike[]): Promise<{
  file: string;
  targetHash: string;
  binary: Uint8Array;
  decoded: string;
  hash: string;
}[]> => {
  return await Promise.all(files.map(file => explodeGitFile(file)));
};

/**
 * @experimental
 * @param dirPath 
 */
export const pipelinePathToExploded = async (dirPath: fs.PathLike): Promise<{
  file: string;
  targetHash: string;
  binary: Uint8Array;
  decoded: string;
  hash: string;
}[]> => {
  const fsObjects = await io.readDirAsyncDepth(dirPath);
  const files = await io.filterReadArray(fsObjects, true);
  const gitFiles = await explodeGitFiles(files);
  return gitFiles;
}