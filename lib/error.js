module.exports = {

  throwIfMissing: function(param) {
    throw new Error('Missing parameter \'' + param + '\'');
  },

  throwIfMissingMinimum: function(min, ...params) {
    throw new Error('Missing at least ' + min + ' parameter from [' + params + ']');
  }

}
