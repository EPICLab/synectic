import { AppManagerInstance } from './AppManager';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';
import { CodeEditor } from '../app/CodeEditor';
import { loadCardDialog } from './files';

global.Synectic = AppManagerInstance;

const c = global.Synectic.newCanvas();

const loadCardButton = document.createElement('button');
loadCardButton.innerText = 'Open...';
loadCardButton.onclick = () => loadCardDialog({});
c.element.appendChild(loadCardButton);

const newEditorButton = document.createElement('button');
newEditorButton.innerText = 'New Editor';
newEditorButton.onclick = () => new CodeEditor(c);
c.element.appendChild(newEditorButton);
