import pako from 'pako';
import { TextDecoder } from 'util';
import type { DecoderEncoding } from './io';

export function decompressBinaryObject(filecontent: Buffer, format: 'bytes'): Uint8Array;
export function decompressBinaryObject(
  filecontent: Buffer,
  format?: Exclude<DecoderEncoding, 'bytes'>
): string;
/**
 * Decompress binary encoded content and return in the specified encoding; default is a `Utf8Array`
 * for `bytes` binary data. This method is particularly useful for reading _Git Object_ files. Git
 * stores _Git Object_ files in the _.git/objects_ directory, in a binary format that has been
 * compressed using the `zlib` library. To read these files we use the `pako` package, which is a
 * performant JavaScript port of the `zlib` library packaged as a Node.js module.
 *
 * @param filecontent - File content extracted into a _Buffer_ object.
 * @param format - The encoding format for the file content.
 * @returns {Uint8Array | string} A Promise object containing the decoded file contents in the
 *   specified encoding; binary bytes are stored in a `Uint8Array`, and all others are returned as
 *   `string` types.
 */
export function decompressBinaryObject(
  filecontent: Buffer,
  format?: DecoderEncoding
): Uint8Array | string {
  let decompressed: Uint8Array;
  try {
    decompressed = pako.inflate(filecontent);
  } catch (error) {
    decompressed = pako.inflate(pako.deflate(filecontent, { level: 1 }));
  }
  if (!format || format == 'bytes') return decompressed;
  const decoder = new TextDecoder(format);
  return decoder.decode(decompressed);
}
