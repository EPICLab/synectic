import { AppManagerInstance } from './lib/AppManager';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';
import '../asset/style/buttons.css';
import '../asset/style/notification.css';

import { openCardDialog, newCardDialog } from './fs/dialogs';
import * as git from './vcs/git';
import { Dialog } from './lib/Dialog';

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

const cDirTitle = document.createElement('span');
cDirTitle.innerText = 'Dir:';
const credentialDir = document.createElement('input');
credentialDir.value = '/Users/nelsonni/Workspace/synectic';

const cPathTitle = document.createElement('span');
cPathTitle.innerText = 'Path:';
const credentialPath = document.createElement('input');
credentialPath.value = 'user.name';

const snackbarButton = document.createElement('button');
snackbarButton.innerText = 'Snackbar';
snackbarButton.onclick = () => {
  new Dialog('snackbar', 'Snackbar Test', 'Testing...');
};

const bannerButton = document.createElement('button');
bannerButton.innerText = 'Banner';
bannerButton.onclick = () => {
  new Dialog('banner', 'Banner Test', 'Testing...');
};

const dialogButton = document.createElement('button');
dialogButton.innerText = 'Dialog';
dialogButton.onclick = () => {
  new Dialog('dialog', 'Dialog Test', 'Testing...');
};
c.element.appendChild(snackbarButton);
c.element.appendChild(bannerButton);
c.element.appendChild(dialogButton);

const testCredentials = document.createElement('button');
testCredentials.innerText = 'Test Credentials...';
testCredentials.onclick = async () => {
  // const cm: CredentialManager = global.Synectic.credentialManager;
  const repoRoot = await git.getRepoRoot('.');
  console.log('repo root: ' + repoRoot);
  // const dialog = cm.credentialPromptDialog();
};
c.element.appendChild(cDirTitle);
c.element.appendChild(credentialDir);
c.element.appendChild(cPathTitle);
c.element.appendChild(credentialPath);
c.element.appendChild(testCredentials);
