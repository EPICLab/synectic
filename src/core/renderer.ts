import { AppManagerInstance } from './AppManager';
import { Card } from './Card';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';

global.SynecticManager = AppManagerInstance;

let c = global.SynecticManager.newCanvas();

let newCardButton = document.createElement('button');
newCardButton.innerText = 'New Card';
newCardButton.onclick = () => new Card(c);
c.element.appendChild(newCardButton);
