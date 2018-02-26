import * as url from 'url';
import * as fs from 'fs-extra';
import * as path from 'path';
import { OpenDialogOptions, remote } from 'electron';
import { Card } from './Card';
import { TextCard } from '../app/TextCard';
import { CodeEditor } from '../app/CodeEditor';
import { EditSession } from 'brace';

export function testLoad(path: string): string {
  let fullPath: string = __dirname + path;
  let fileUrl = url.parse(fullPath);

  console.log('process.cwd: ' + process.cwd());
  console.log(fileUrl);

  return fs.readFileSync(fullPath, 'utf8');
}

export function loadCardDialog(options: OpenDialogOptions): Card | null {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: string[]) => {
      if (filenames === undefined) return;
      filenames.map((filename) => {
        switch(path.extname(filename)) {
          case '.txt':
            console.log('creating new TextCard');
            let textCard = new TextCard(global.Synectic.current);
            asyncLoad(filename).then((res: string | void) => {
              if (res === undefined) return;
              textCard.content.innerText = res;
            });
            return textCard;
          case '.js':
          console.log('creating new CodeEditor');
            let codeCard = new CodeEditor(global.Synectic.current);
            asyncLoad(filename).then((res: string | void) => {
              if (res === undefined) return;
              codeCard.title.innerHTML = path.basename(filename);
              codeCard.editor.setSession(new EditSession(res));
              codeCard.editor.getSession().setMode('ace/mode/javascript');
            });
            return codeCard;
          default:
            return null;
        }
      });
    }
  );
  return null;
}

export function openDialog(options: OpenDialogOptions, target: HTMLDivElement) {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: string[]) => {
      if (filenames === undefined) return;
      asyncLoad(filenames[0]).then((res: string | void) => {
        if (res === undefined) return;
        target.innerText = res;
      });
    }
  );
}

export function asyncLoad(path: string): Promise<string | void> {
  return fs.readFile(path)
    .then((res: Buffer) => {
      return res.toString();
    })
    .catch(err => console.log(err));
}
