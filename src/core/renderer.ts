import { AppManagerInstance } from './AppManager';
import { Card } from './Card';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';
import { TextCard } from '../app/TextCard';
import { CodeEditor } from '../app/CodeEditor';
import { loadCardDialog } from './files';

global.Synectic = AppManagerInstance;

const c = global.Synectic.newCanvas();

const openButton = document.createElement('button');
openButton.innerText = 'Open...';
openButton.onclick = () => loadCardDialog({});
c.element.appendChild(openButton);

const newCardButton = document.createElement('button');
newCardButton.innerText = 'New Card';
newCardButton.onclick = () => new Card(c, ['']);
c.element.appendChild(newCardButton);

const newTextButton = document.createElement('button');
newTextButton.innerText = 'New Text Card';
newTextButton.onclick = () => new TextCard(c);
c.element.appendChild(newTextButton);

const newEditorButton = document.createElement('button');
newEditorButton.innerText = 'New Editor';
newEditorButton.onclick = () => new CodeEditor(c);
c.element.appendChild(newEditorButton);
