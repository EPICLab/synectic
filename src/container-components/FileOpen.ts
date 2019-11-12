import { OpenDialogOptions, remote } from 'electron';

const openFileDialog = (options: OpenDialogOptions) => {
  remote.dialog.showOpenDialog(remote.getCurrentWindow(), options,
    (filenames: any) => console.log(`filenames: ${filenames}`)
  );
}

export default openFileDialog;