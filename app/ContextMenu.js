"use strict";
const Utility = require('../lib/utility.js');
const Stack = require('../app/Stack.js');

Utility.defineConstant(module.exports, 'selectionTemplate', [
  {
    label: 'New Stack',
    click: () => {
      let selected = $('.ui-selected');
      new Stack(selected[0], selected[1]);
    }
  },
  {
    label: 'New Group',
    click: () => {
      console.log('Create Group bhai!');
    }
  }
]);
