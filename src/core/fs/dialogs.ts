import * as io from './io';
import * as fs from 'fs-extra';
import * as filetypes from './filetypes';
import { remote, OpenDialogOptions, SaveDialogOptions } from 'electron';
import { handlerToCard } from './io-handler';
import '../../asset/style/dialogs.css';
import { Dialog } from '../lib/Dialog';

export function openCardDialog(options: OpenDialogOptions): void {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: string[] | undefined) => {
      if (filenames === undefined) return;
      filenames.map(filename => {
        if (fs.statSync(filename).isDirectory()) {
          handlerToCard('FileExplorer', filename);
        }
        else {
          filetypes.searchExt(io.extname(filename))
            .then(result => {
              if (result !== undefined) {
                handlerToCard(result.handler, filename);
              }
            })
            .catch(error => new Dialog('snackbar', 'Open Card Dialog Error', error.message));
        }
      });
    });
}

export function newCardDialog(options: SaveDialogOptions): void {
  remote.dialog.showSaveDialog(remote.getCurrentWindow(), options,
    (filename: string | undefined) => {
      if (filename === undefined) return;
      filetypes.searchExt(io.extname(filename))
        .then(filetype => {
          if (!filetype) return;
          handlerToCard(filetype.handler, filename);
        })
        .catch(error => new Dialog('snackbar', 'New Card Dialog Error', error.message));
    }
  );
}
