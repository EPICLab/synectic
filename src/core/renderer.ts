import { AppManagerInstance } from './lib/AppManager';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';
import '../asset/style/buttons.css';
import '../asset/style/notification.css';

import { Editor } from '../app/editor/Editor';
import { FileExplorer } from '../app/fileexplorer/FileExplorer';
import { openCardDialog } from './fs/dialogs';

global.Synectic = AppManagerInstance;
const c = global.Synectic.newCanvas();

const newEditorButton = document.createElement('button');
newEditorButton.innerText = 'New Editor';
newEditorButton.onclick = () => new Editor(c, '');
c.element.appendChild(newEditorButton);

const loadCardButton = document.createElement('button');
loadCardButton.innerText = 'Open...';
loadCardButton.onclick = () => openCardDialog({});
c.element.appendChild(loadCardButton);

const newFileExplorerButton = document.createElement('button');
newFileExplorerButton.innerText = 'New FileExplorer';
newFileExplorerButton.onclick = () => new FileExplorer(c, null);
c.element.appendChild(newFileExplorerButton);
