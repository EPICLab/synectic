"use strict";

module.exports = {

  // serialize a JavaScript function body to String object
  getFunctionBody: function(fn) {
    function removeCommentsFromSource(str) {
      return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource( fn.toString() );
    return s.substring(s.indexOf('{')+1, s.lastIndexOf('}'));
  },

  // define an immutable constant within a given scope
  defineConstant: function(scope, name, value) {
    Object.defineProperty(scope, name, {
      value: value,
      enumerable: true
    });
  },

  // list all currently open BrowserWindow objects
  showAllBrowserWindows: function() {
    const BrowserWindow = require('electron').BrowserWindow;
    var windowObjectArray = BrowserWindow.getAllWindows();
    for (var i = 0, len = windowObjectArray.length; i < len; i ++) {
      var windowObject = windowObjectArray[i];
      console.log('window id: \t' + windowObject.id);
      console.log('name: \t\t' + windowObject.__name);
      console.log('tag: \t\t' + windowObject.__tag);
    }
  }

}
