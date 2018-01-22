import { AppManagerInstance } from './AppManager';
import { Card } from './Card';
import '../asset/style/canvas.css';
import '../asset/style/card.css';
import '../asset/style/stack.css';

let c = AppManagerInstance.newCanvas();

let newCardButton = document.createElement('button');
newCardButton.innerText = 'New Card';
newCardButton.onclick = () => c.add(new Card(c));
c.element.appendChild(newCardButton);
