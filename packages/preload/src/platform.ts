import {type BinaryLike, createHash, randomUUID} from 'node:crypto';
import {shell} from 'electron';

export {cwd, platform} from 'node:process';
export {dirname, join, relative, normalize, sep} from 'node:path';
export {clipboard} from 'electron';

export const sha256sum = (data: BinaryLike) => {
  return createHash('sha256').update(data).digest('hex');
};

export const uuid = () => randomUUID();

export const openExternal = (url: string) => shell.openExternal(url);
