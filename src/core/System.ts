import * as url from 'url';
import * as fs from 'fs-extra';

export function testLoad(path: string): string {
  let fullPath: string = __dirname + path;
  let fileUrl = url.parse(fullPath);

  console.log('process.cwd: ' + process.cwd());
  console.log(fileUrl);

  return fs.readFileSync(fullPath, 'utf8');
}

export function asyncLoad(path: string, target: HTMLDivElement): void {
  let fullPath: string = __dirname + path;
  fs.readFile(fullPath).then((res: Buffer) => {
    target.innerText = res.toString();
  });
}
