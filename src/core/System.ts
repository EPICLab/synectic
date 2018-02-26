import * as url from 'url';
import * as fs from 'fs-extra';
import { OpenDialogOptions, remote } from 'electron';

export function testLoad(path: string): string {
  let fullPath: string = __dirname + path;
  let fileUrl = url.parse(fullPath);

  console.log('process.cwd: ' + process.cwd());
  console.log(fileUrl);

  return fs.readFileSync(fullPath, 'utf8');
}

export function openDialog(options: OpenDialogOptions, target: HTMLDivElement) {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: string[]) => {
      if (filenames === undefined) return;
      return asyncLoad(filenames[0], target);
    }
  );
}

export function asyncLoad(path: string, target: HTMLDivElement): void {
  fs.readFile(path)
    .then((res: Buffer) => {
      target.innerText = res.toString();
    })
    .catch(err => console.log(err));
}
