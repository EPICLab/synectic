import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';

export function asyncWriteFile(filepath: string, data: string): Promise<void> {
  return fs.writeFile(path.resolve(filepath), data)
    .then(() => console.info('File created: ' + path.resolve(filepath)))
    .catch(err => console.error(err));
}

export function asyncReadFile(filepath: string): Promise<string | void> {
  return fs.readFile(path.resolve(filepath))
    .then((res: Buffer) => { return res.toString(); })
    .catch(err => console.error(err));
}

export function getFileType(filename: string): string {
  let extension: string | undefined = path.extname(filename).split('.').pop();
  return global.Synectic.filetypeMap.get(extension);
}

export function getHandlerClass(filename: string): string {
  let filetype: string = getFileType(filename);
  return global.Synectic.handlerMap.get(filetype);
}

export function testLoad(path: string): string {
  let fullPath = __dirname + path;
  let fileUrl = url.parse(fullPath);

  console.log('process.cwd: ' + process.cwd());
  console.log(fileUrl);

  return fs.readFileSync(fullPath, 'utf8');
}
