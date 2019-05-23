import { AppManagerInstance } from './lib/AppManager';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';
import '../asset/style/buttons.css';
import '../asset/style/notification.css';

import { FileExplorer } from '../app/fileexplorer/FileExplorer';
import { openCardDialog, newCardDialog } from './fs/dialogs';
import * as git from './vcs/git';

global.Synectic = AppManagerInstance;
const c = global.Synectic.newCanvas();

const newEditorButton = document.createElement('button');
newEditorButton.innerText = 'New...';
newEditorButton.onclick = () => newCardDialog({});
c.element.appendChild(newEditorButton);

const loadCardButton = document.createElement('button');
loadCardButton.innerText = 'Open...';
loadCardButton.onclick = () => openCardDialog({});
c.element.appendChild(loadCardButton);

const newFileExplorerButton = document.createElement('button');
newFileExplorerButton.innerText = 'New FileExplorer';
newFileExplorerButton.onclick = () => new FileExplorer(c, null);
c.element.appendChild(newFileExplorerButton);

const testCredentials = document.createElement('button');
testCredentials.innerText = 'Test Credentials...';
testCredentials.onclick = async () => {
  // const cm: CredentialManager = global.Synectic.credentialManager;
  const repoRoot = await git.getRepoRoot('.');
  console.log('repo root: ' + repoRoot);
  // const dialog = cm.credentialPromptDialog();
};
c.element.appendChild(testCredentials);
