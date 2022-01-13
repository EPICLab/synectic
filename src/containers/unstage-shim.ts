import util from 'util';
import path from 'path';
import { exec } from 'child_process';
import { PathLike } from 'fs-extra';

const promiseExec = util.promisify(exec);

type ExecError = {
    killed: boolean,
    code: number,
    signal: string | null,
    cmd: string,
    stdout: string,
    stderr: string
}

export type UnstageResult = {
    fulfilled: boolean,
    stdout: string,
    stderr: string
}

export const unstage = async (filepath: PathLike, root: PathLike): Promise<void> => {
    let results: { stdout: string; stderr: string; } = { stdout: '', stderr: '' };
    const relativePath = path.relative(root.toString(), filepath.toString());

    try {
        results = await promiseExec(`git restore --staged ${relativePath}`, { cwd: root.toString() });
    } catch (error) {
        const outputError = error as ExecError;
        console.log({
            fulfilled: false,
            stdout: outputError.stdout,
            stderr: outputError.stderr
        });
        return;
    }
    console.log({
        fulfilled: true,
        stdout: results.stdout,
        stderr: results.stderr
    });
    return;
}