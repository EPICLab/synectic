import * as fs from 'fs-extra';
import type { IndexEntry } from './git-index';

export const compareStats = (entry: IndexEntry, stats: fs.Stats): boolean => {
  // Comparison based on the description in Paragraph 4 of
  // https://www.kernel.org/pub/software/scm/git/docs/technical/racy-git.txt
  const e = normalizeStats(entry);
  const s = normalizeStats(stats);
  const staleness =
    e.mode !== s.mode ||
    e.mtimeSeconds !== s.mtimeSeconds ||
    e.ctimeSeconds !== s.ctimeSeconds ||
    e.uid !== s.uid ||
    e.gid !== s.gid ||
    e.ino !== s.ino ||
    e.size !== s.size
  return staleness;
};

const MAX_UINT32 = 2 ** 32;

const SecondsNanoseconds = (
  date: Date,
  givenSeconds?: number,
  givenNanoseconds?: number,
  milliseconds?: number,
) => {
  if (givenSeconds !== undefined && givenNanoseconds !== undefined) {
    return [givenSeconds, givenNanoseconds]
  }
  if (milliseconds === undefined) {
    milliseconds = date.valueOf()
  }
  const seconds = Math.floor(milliseconds / 1000)
  const nanoseconds = (milliseconds - seconds * 1000) * 1000000
  return [seconds, nanoseconds]
};

const normalizeStats = (e: IndexEntry | fs.Stats) => {
  const [ctimeSeconds, ctimeNanoseconds] = SecondsNanoseconds(e.ctime);
  const [mtimeSeconds, mtimeNanoseconds] = SecondsNanoseconds(e.mtime);

  return {
    ctimeSeconds: ctimeSeconds % MAX_UINT32,
    ctimeNanoseconds: ctimeNanoseconds % MAX_UINT32,
    mtimeSeconds: mtimeSeconds % MAX_UINT32,
    mtimeNanoseconds: mtimeNanoseconds % MAX_UINT32,
    dev: e.dev % MAX_UINT32,
    ino: e.ino % MAX_UINT32,
    mode: normalizeMode(e.mode % MAX_UINT32),
    uid: e.uid % MAX_UINT32,
    gid: e.gid % MAX_UINT32,
    // size of -1 happens over a BrowserFS HTTP Backend that doesn't serve Content-Length headers
    // (like the Karma webserver) because BrowserFS HTTP Backend uses HTTP HEAD requests to do fs.stat
    size: e.size > -1 ? e.size % MAX_UINT32 : 0,
  }
}

/**
 * From https://github.com/git/git/blob/master/Documentation/technical/index-format.txt
 *
 * 32-bit mode, split into (high to low bits)
 *
 *  4-bit object type
 *    valid values in binary are 1000 (regular file), 1010 (symbolic link)
 *    and 1110 (gitlink)
 *
 *  3-bit unused
 *
 *  9-bit unix permission. Only 0755 and 0644 are valid for regular files.
 *  Symbolic links and gitlinks have value 0 in this field.
 */
const normalizeMode = (mode: number): number => {
  // Note: BrowserFS will use -1 for "unknown"
  // I need to make it non-negative for these bitshifts to work.
  let type = mode > 0 ? mode >> 12 : 0
  // If it isn't valid, assume it as a "regular file"
  // 0100 = directory
  // 1000 = regular file
  // 1010 = symlink
  // 1110 = gitlink
  if (
    type !== 0b0100 &&
    type !== 0b1000 &&
    type !== 0b1010 &&
    type !== 0b1110
  ) {
    type = 0b1000
  }
  let permissions = mode & 0o777
  // Is the file executable? then 755. Else 644.
  if (permissions & 0b001001001) {
    permissions = 0o755
  } else {
    permissions = 0o644
  }
  // If it's not a regular file, scrub all permissions
  if (type !== 0b1000) permissions = 0
  return (type << 12) + permissions
}
