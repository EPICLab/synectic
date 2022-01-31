import { dir } from 'tmp-promise';
import * as fs from 'fs-extra';
import * as path from 'path';
import { MockedRepository, mockGit, MockInstanceEnhanced } from './mock-git-promise';

type Encoding = 'ascii' | 'base64' | 'hex' | 'ucs2' | 'ucs-2' | 'utf16le' | 'utf-16le' | 'utf8' | 'utf-8' | 'binary' | 'latin1';
type Octal = 0o0 | 0o1 | 0o2 | 0o3 | 0o4 | 0o5 | 0o6 | 0o7;
type Mode = `${Octal}${Octal}${Octal}`;
type Flag = 'a' | 'ax' | 'a+' | 'ax+' | 'as' | 'as+' | 'r' | 'r+' | 'rs+' | 'w' | 'wx' | 'w+' | 'wx+';

export type MockInstance = {
    getRoot(): string;
    addItem(filename: string, item: DirectoryItem): Promise<void>;
    reset(): void;
}

export type DirectoryItem =
    | string
    | Buffer
    | File
    | Directory
    | SymbolicLink
    | DirectoryItems;

export type DirectoryItems = {
    [name: string]: DirectoryItem;
}

export type File = {
    content: string | Buffer;
    mode?: Mode | undefined;
    encoding?: Encoding | undefined;
    flag?: Flag | undefined;
    uid?: number | undefined;
    gid?: number | undefined;
    atime?: Date | undefined;
    mtime?: Date | undefined;
}

export type Directory = {
    items: DirectoryItems | undefined;
    mode?: Mode | undefined;
    encoding?: Encoding | undefined;
    flag?: Flag | undefined;
    uid?: number | undefined;
    gid?: number | undefined;
    atime?: Date | undefined;
    mtime?: Date | undefined;
    birthtime?: Date | undefined;
}

export type SymbolicLink = {
    path: string;
    mode?: Mode | undefined;
    encoding?: Encoding | undefined;
    flag?: Flag | undefined;
    uid?: number | undefined;
    gid?: number | undefined;
    atime?: Date | undefined;
    mtime?: Date | undefined;
    birthtime?: Date | undefined;
}

export async function mock(config: DirectoryItems, gitRepo: MockedRepository): Promise<MockInstanceEnhanced>;
export async function mock(config: DirectoryItems): Promise<MockInstance>;
export async function mock(config: DirectoryItems, gitRepo?: MockedRepository | undefined): Promise<MockInstance | MockInstanceEnhanced> {
    const root = await dir({ unsafeCleanup: true });
    const cwd = process.cwd();

    process.chdir(root.path);
    for (const entry of Object.entries(config)) await create(entry);

    const instance = {
        getRoot: () => root.path,
        addItem: (filename: string, item: DirectoryItem) => create([filename, item]),
        reset: () => {
            root.cleanup();
            process.chdir(cwd);
        }
    };
    if (gitRepo) return mockGit(instance, gitRepo);
    else return instance;
}

export const create = async ([filename, config]: [string, DirectoryItem]): Promise<void> => {
    if (isContent(config)) {
        await writeFile(filename, config);
    } else if (isFile(config)) {
        const options: fs.WriteFileOptions = {
            mode: config.mode ? parseInt(config.mode, 8) : undefined,
            encoding: config.encoding,
            flag: config.flag
        };
        await writeFile(filename, config.content, options);

        if (config.atime && config.mtime) await fs.utimes(filename, config.atime, config.mtime);
        if (config.atime && !config.mtime) await fs.utimes(filename, config.atime, new Date(1));
        if (!config.atime && config.mtime) await fs.utimes(filename, new Date(1), config.mtime);
    } else if (isDirectory(config)) {
        await writeDir(filename, config.mode ? parseInt(config.mode, 8) : undefined);
    } else if (isSymlink(config)) {
        await writeSymlink(filename, config.path);
    } else if (isDirectoryItems(config)) {
        const items = Object.entries(config);
        if (items.length > 0) {
            for (const [subfile, subconfig] of items) await create([path.join(filename, subfile), subconfig]);
        } else {
            await writeDir(filename);
        }
    }
}

const isContent = (config: DirectoryItem): config is string | Buffer => {
    return (typeof config === 'string' || config instanceof Buffer);
}

export const file = (config?: File): File => {
    return { content: config ? config.content : '', ...config }
}

const isFile = (config: DirectoryItem): config is File => {
    return (config as File).content !== undefined;
}

export const directory = (config?: Directory): Directory => {
    return { items: config ? config.items : undefined, ...config }
}

const isDirectory = (config: DirectoryItem): config is Directory => {
    return (config as Directory).items !== undefined;
}

export const symlink = (config?: SymbolicLink): SymbolicLink => {
    return { path: config ? config.path : '', ...config }
}

const isSymlink = (config: DirectoryItem): config is SymbolicLink => {
    return (config as SymbolicLink).path !== undefined;
}

const isDirectoryItems = (config: DirectoryItem): config is DirectoryItems => {
    return Object.keys(config).length !== undefined;
}


const writeFile = async (filepath: fs.PathLike, content: string | Buffer, options?: fs.WriteFileOptions) => {
    try {
        await fs.ensureFile(filepath.toString());
        await fs.outputFile(filepath.toString(), content, options);
    } catch (error) {
        console.error(error);
    }
}

const writeDir = async (dirpath: fs.PathLike, options?: number | { mode: number }) => {
    try {
        await fs.ensureDir(dirpath.toString(), options);
    } catch (error) {
        console.error(error);
    }
}

const writeSymlink = async (srcPath: fs.PathLike, destPath: fs.PathLike) => {
    try {
        await fs.ensureSymlink(srcPath.toString(), destPath.toString());
    } catch (error) {
        console.error(error);
    }
}