import { AppManagerInstance } from './AppManager';
import { Card } from './Card';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';
import { TextCard } from '../app/TextCard';

global.Synectic = AppManagerInstance;

const c = global.Synectic.newCanvas();

const newCardButton = document.createElement('button');
newCardButton.innerText = 'New Card';
newCardButton.onclick = () => new Card(c);
c.element.appendChild(newCardButton);

const newTextButton = document.createElement('button');
newTextButton.innerText = 'New Text Card';
newTextButton.onclick = () => new TextCard(c);
c.element.appendChild(newTextButton);
