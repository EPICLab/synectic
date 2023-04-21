import { execute } from '../exec';

export const checkRefFormat = async ({
  refname,
  branch = false
}: {
  refname: string;
  branch?: boolean;
}): Promise<boolean> => {
  const output = await execute(`git check-ref-format ${branch ? '--branch' : ''} ${refname}`);
  if (output.stderr.length > 0) {
    console.error(output.stderr);
    return false;
  }
  console.log(output.stdout);
  return true;
};
