// This file utilitizes Node.js integration, and therefore cannot be used in Electron renderer processes.

import util from 'util';
import { exec } from 'child_process';
const promiseExec = util.promisify(exec); // requires nodeIntegration: true

type ExecError = {
  killed: boolean;
  code: number;
  signal: string | null;
  cmd: string;
  stdout: string;
  stderr: string;
};

/**
 * Spawns a shell then executes the command within that shell, buffering any generated output. The command string passed to the exec
 * function is processed directly by the shell and special characters (vary based on shell) need to be dealt with accordingly.
 *
 * WARNING: Never pass unsanitized user input to this function. Any input containing shell meta-characters may be used to trigger
 * arbitrary command execution.
 *
 * @param command The command to run, with space-separated arguments.
 * @param cwd The current working directory that the command should be executed in.
 * @returns {Promise<{ stdout: string, stderr: string }>} A Promise object containing the `stdout` and `stderr` strings with content based on the output of the command.
 */
export const execute = async (command: string, cwd?: string | URL | undefined) => {
  let execResult: { stdout: string; stderr: string } = { stdout: '', stderr: '' };
  let execError: ExecError | undefined;
  try {
    execResult = await promiseExec(command, { cwd });
  } catch (error) {
    execError = error as ExecError;
    execResult = {
      stdout: execError.stdout,
      stderr: execError.stderr
    };
  }
  return execResult;
};
