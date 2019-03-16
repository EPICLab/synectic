import * as io from './io';
import * as filetypes from './filetypes';
import { OpenDialogOptions, remote } from 'electron';
import { basename } from 'path';
import { Card } from '../lib/Card';
import { handlerToCard } from './io-handler';
import '../../asset/style/dialogs.css';
import { Dialog } from '../lib/Dialog';
// import { CredentialManager } from '../vcs/CredentialManager';

export function openCardDialog(options: OpenDialogOptions): void {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    filenames => {
      filenames.map(filename => {
        filetypes.searchExt(io.extname(filename))
          .then(result => {
            if (result !== undefined) {
              const card: Card | null = handlerToCard(result.handler, filename);
              if (card !== null) card.title.innerHTML = basename(filename);
            }
          })
          .catch(error => new Dialog('snackbar', 'Open Card Dialog Error', error.message));
      });
    });
}

export function newCardDialog(): void {
  // TODO: Implement new card dialog for selecting filename, filetype, and filepath.
}
