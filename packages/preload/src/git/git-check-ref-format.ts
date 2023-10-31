import {execute} from '../io';

export const checkRefFormat = async ({
  refname,
  branch = false,
}: {
  refname: string;
  branch?: boolean;
}): Promise<boolean> => {
  const output = await execute({
    command: 'git',
    args: ['check-ref-format', branch ? '--branch' : '', refname],
  });
  if (output.stderr) {
    console.error(output.stderr);
    return false;
  }
  console.log(output.stdout);
  return true;
};
