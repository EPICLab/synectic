// document.getElementsByTagName('body')[0].innerHTML = `My node Version: ${process.versions.node}`;
console.log('electron-renderer here...');
// import { remote } from 'electron';
// let id = remote.getCurrentWindow().id;

document.getElementsByTagName('body')[0].innerHTML = `node Version: ${process.versions.node}`;

import Calculator from './calculator';
let calc = new Calculator();
console.log(calc.Add(3,2));

console.log('document.DOCUMENT_NODE: ' + document.DOCUMENT_NODE);

let ref = document.createElement('div');
ref.setAttribute('id', 'test');
document.getElementsByTagName('body')[0].appendChild(ref);

const css = require('./core/styles.css').toString();
console.log(css); // {String}

// console.log('Window ID: ' + id);
