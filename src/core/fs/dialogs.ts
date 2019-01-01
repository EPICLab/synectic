import * as io from './io';
import * as filetypes from './filetypes';
import { OpenDialogOptions, remote} from 'electron';
import { basename } from 'path';
import { Card } from '../lib/Card';
import { snackbar } from './notifications';
import { handlerToCard } from './handler';

export function openCardDialog(options: OpenDialogOptions): void {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    filenames => {
      if (filenames !== undefined) {
        filenames.map(filename => {
          filetypes.searchExt(io.extname(filename))
            .then(result => {
              if (result !== undefined) {
                let card: Card | null = handlerToCard(result.handler, filename);
                if (card !== null) card.title.innerHTML = basename(filename);
              }
            })
            .catch(error => snackbar(global.Synectic.current, error.message, 'Open Card Dialog Error'));
        });
      }
    });
}

export function newCardDialog(): void {
  //TODO: Implement new card dialog for selecting filename, filetype, and filepath.
}
