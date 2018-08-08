import * as fio from './io';
import * as mapper from './mapper';
import * as path from 'path';
import { OpenDialogOptions, remote } from 'electron';
import { Card } from '../lib/Card';
import { TextView } from '../../app/textview/TextView';
import { Editor } from '../../app/editor/Editor';
import { EditSession } from 'brace';
import ace from 'brace';

export function openCardDialog(options: OpenDialogOptions): Card | null {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    filenames => {
      if (filenames === undefined) {
        throw Error("Filename cannot be loaded into a Card.");
      }
      filenames.map((filename) => {
        let filetype: string = fio.getFileType(filename);
        let handler: string = fio.getHandlerClass(filename);
        let card = mapper.stringToCard(handler);
        card.title.innerHTML = path.basename(filename);

        fio.asyncReadFile(filename).then((res: string | void) => {
          if (res !== undefined) {
            if (card instanceof Editor) {
              card.editor.setSession(new EditSession(res));
              let mode = 'ace/mode/' + filetype.toLowerCase();
              card.editor.getSession().setMode(mode);
            }
            else if (card instanceof TextView) {
              card.content.innerText = res;
            }
          }
        })
      })
    }
  );
  return null;
}

export function loadCardDialog(options: OpenDialogOptions): Card | null {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: string[]) => {
      if (filenames === undefined) return;
      filenames.map((filename) => {

        let modelist = ace.acequire("ace/ext/modelist");
        console.log(modelist);
        // let mode = modelist.getModeForPath(filename).mode;
        // console.log('mode: ' + mode);

        let fileExt: string | undefined = path.extname(filename).split('.').pop();
        console.log('file extension: ' + fileExt);
        console.log('type: ' + global.Synectic.filetypeMap.get(fileExt));

        switch(path.extname(filename)) {
          case '.txt':
            // global.Synectic.dispatcher.dispatchAll('open-file');
            console.log('creating new TextCard');
            let textCard = new TextView(global.Synectic.current);
            fio.asyncReadFile(filename).then((res: string | void) => {
              if (res === undefined) return;
              textCard.content.innerText = res;
            });
            return textCard;
          case '.js':
          console.log('creating new CodeEditor');
            let codeCard = new Editor(global.Synectic.current);
            fio.asyncReadFile(filename).then((res: string | void) => {
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
      fio.asyncReadFile(filenames[0]).then((res: string | void) => {
        if (res === undefined) return;
        target.innerText = res;
      });
    }
  );
}
