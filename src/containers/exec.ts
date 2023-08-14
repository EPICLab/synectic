// This file utilitizes Node.js integration, and therefore cannot be used in Electron renderer processes.

import util from 'util';
import { exec } from 'child_process';
import { isWrappedQuote } from './utils';
const promiseExec = util.promisify(exec); // requires nodeIntegration: true

type ExecResult = {
  stdout: string | undefined;
  stderr: string | undefined;
};

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
 * @param obj - A destructured object for named parameters.
 * @param obj.command - The command to run, with space-separated arguments.
 * @param obj.args - List of string arguments.
 * @param obj.cwd - The current working directory that the command should be executed in.
 * @param obj.debug - A debug flag for printing the formatted command before execution; defaults to `false`.
 * @returns {Promise<{ stdout: string | undefined, stderr: string | undefined }>} A Promise object containing the `stdout` and `stderr` strings with content based on the output of the command.
 */
const execute = async ({
  command,
  args = [],
  cwd,
  debug = false
}: {
  command: string;
  args?: string[];
  cwd?: string | URL | undefined;
  debug?: boolean | undefined;
}): Promise<ExecResult> => {
  let execResult: ExecResult = { stdout: undefined, stderr: undefined };
  let execError: ExecError | undefined;

  const cmd = `${command}${args.length > 0 ? ' ' : ''}${args.join(' ')}`;
  if (debug) console.log(`execute: '${cmd}' in ${cwd ? cwd.toString() : process.cwd()}`);

  // Check for malformed commands
  if (!isWrappedQuote(command) && command.indexOf(' ') !== -1) {
    console.error(
      `execute: Malformed command (options and sub-commands should be in 'args', chained commands should be wrapped in quotes)`
    );
    return { stdout: undefined, stderr: undefined };
  }

  try {
    execResult = await promiseExec(cmd, { cwd });
  } catch (error) {
    execError = error as ExecError;
    execResult = {
      stdout: execError.stdout,
      stderr: execError.stderr
    };
  }

  return execResult;
};

export default execute;
