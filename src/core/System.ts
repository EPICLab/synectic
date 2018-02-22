import * as fs from 'fs';
import * as url from 'url';

export function testLoad(): string {
  let path: string = __dirname + '/foo.txt';
  let fileUrl = url.parse(path);

  console.log('process.cwd: ' + process.cwd());
  console.log(fileUrl);

  let content: string = fs.readFileSync(path, 'utf8');
  return content;
}
