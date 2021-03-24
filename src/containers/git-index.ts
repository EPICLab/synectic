// TypeScript typed version of `parse-git-index`
// Reference: https://github.com/coderaiser/parse-git-index
// Developed by: coderaiser <https://github.com/coderaiser>
// Typed version by: Nicholas Nelson <https://github.com/nelsonni>

import * as binarnia from 'binarnia';

export type IndexEntry = {
  dev: number,
  ino: number,
  mode: number,
  nlink: number,
  uid: number,
  gid: number,
  rdev: number,
  size: number,
  blksize: number,
  blocks: number,
  atimeMs: number,
  mtimeMs: number,
  ctimeMs: number,
  birthtimeMs: number,
  atime: Date,
  mtime: Date,
  ctime: Date,
  birthtime: Date,
  fileSize: string,
  objectId: string,
  filePathSize: string,
  filePath: string
}
type IndexHeader = {
  signature: string,
  version: number,
  count: number
}
type Index = {
  header: IndexHeader,
  entries: IndexEntry[]
}

const endian = 'BE';
const headerSchema = [{
  'name': 'signature',
  'size': 4,
  'type': 'string'
}, {
  'name': 'version',
  'size': 4,
  'type': 'value'
}, {
  'name': 'count',
  'size': 4,
  'type': 'value'
}];
const entrySchema = [{
  'name': 'ctime',
  'size': 8,
  'type': 'value'
}, {
  'name': 'mtime',
  'size': 8,
  'type': 'value'
}, {
  'name': 'dev',
  'size': 4,
  'type': 'value'
}, {
  'name': 'ino',
  'size': 4,
  'type': 'value'
}, {
  'name': 'mode',
  'size': 4,
  'type': 'value'
}, {
  'name': 'uid',
  'size': 4,
  'type': 'value'
}, {
  'name': 'gid',
  'size': 4,
  'type': 'value'
}, {
  'name': 'fileSize',
  'size': 4,
  'type': 'value'
}, {
  'name': 'objectId',
  'size': 20,
  'type': 'value'
}, {
  'name': 'filePathSize',
  'size': 2,
  'type': 'value'
}, {
  'name': 'filePath',
  'size': '<filePathSize>',
  'type': 'string'
}];
const offset: number = binarnia.sizeof(headerSchema);
const entrySize: number = binarnia.sizeof(entrySchema);

/**
 * NUL byte(s) 1 NUL byte to pad the entry to a multiple of eight bytes while keeping the name NUL-terminated.
 * See: https://mincong-h.github.io/2018/04/28/git-index/
 */
const pad = (a: number): number => {
  const diff = a % 8;
  return a + (8 - diff);
}

const parseHeader = (buffer: Buffer): IndexHeader => {
  const schema = headerSchema;
  return binarnia({
    buffer,
    endian,
    schema,
  })
};

const parseEntries = (index: Buffer, count: number, offset: number): IndexEntry[] => {
  const entries: IndexEntry[] = [];

  for (let i = 0; i < count; i++) {
    const entry = parseEntry(index, offset);
    entries.push(entry);

    const filePathSize = parseInt(entry.filePathSize);
    offset += pad(entrySize + filePathSize);
  }

  return entries;
}

const parseEntry = (buffer: Buffer, offset: number): IndexEntry => {
  const schema = entrySchema;
  return binarnia({
    offset,
    schema,
    endian,
    buffer,
  })
}

export const parse = (index: Buffer): Index => {
  const header = parseHeader(index);
  const { count } = header;
  const entries = parseEntries(index, count, offset);

  return {
    header,
    entries,
  }
};

