// document.getElementsByTagName('body')[0].innerHTML = `My node Version: ${process.versions.node}`;
console.log('electron-renderer here...');
// import { remote } from 'electron';
// let id = remote.getCurrentWindow().id;

document.getElementsByTagName('body')[0].innerHTML = `node Version: ${process.versions.node}<br>Happy New Year!`;

import Calculator from './calculator';
let calc = new Calculator();
console.log(calc.Add(3,2));

console.log('document.DOCUMENT_NODE: ' + document.DOCUMENT_NODE);

const css = require('./core/styles.css').toString();
console.log(css); // {String}

// *******************************************************

import { AppManagerInstance } from './core/manager';
import './asset/style/canvas.css';

const btn: HTMLButtonElement = document.createElement('button');
btn.innerText = 'TEST';
btn.onclick = (e: Event) => { s(e); };

document.body.appendChild(btn);

function s(e: Event) {
  console.log(e.bubbles);
  console.log('TEST responded...');
  AppManagerInstance.print();
}
