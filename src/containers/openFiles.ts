import { OpenDialogOptions, remote } from 'electron';
import { extractExtension } from './io';
import { findExtensionType } from './filetypes';

const openFileDialog = (options: OpenDialogOptions) => {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: string[]) => {
      filenames.map(async filename => {
        const ext = extractExtension(filename);
        const meta = await findExtensionType(ext);
        console.log(meta);
      });
    }
  );
}

export default openFileDialog;