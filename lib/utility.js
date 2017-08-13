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
  }

}
