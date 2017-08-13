const path = require('path');
const fs = require('fs');

// Public
module.exports = {

  // load files into document namespace using loader function for filetypes
  loadFile: (file) => {
    let filepath = (path.isAbsolute(file)) ? file : path.join(__dirname, file);
    if(!fs.existsSync(filepath)) {
      console.log('no file: ', filepath);
      return;
    }
    let filetype = path.extname(filepath);
    switch (filetype) {
      case ".css":
        return loadCSS(filepath);
      case ".js":
        return loadJS(filepath);
      default:
        console.log('no loader for filetype: ' + filetype);
    }
  },

  /* recursively read all files below specified directory (startPath),
     optionally filter for specific filetypes via file extensions (filter),
     and optionally use custom callback function to handle results */
  loadDir: (startPath, {
    filter = '',
    callback = (filename) => module.exports.loadFile(filename)
  }) => {
    let absPath = path.join(__dirname, startPath);
    if (!fs.existsSync(absPath)){
      console.log("no dir: ",absPath);
      return;
    }
    var files = fs.readdirSync(absPath);
    for(var i = 0; i < files.length; i++){
      var filename = path.join(absPath, files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()){
        loadDir(filename, filter, callback); //recurse
      }
      else if (filename.indexOf(filter) >= 0) callback(filename);
    };
  }
}

// Private
function loadCSS(filepath) {
  let ref = document.createElement('link');
  ref.setAttribute('rel', 'stylesheet');
  ref.setAttribute('type', 'text/css');
  ref.setAttribute('href', filepath);
  document.getElementsByTagName('head')[0].appendChild(ref);
}

function loadJS(filepath) {
  let ref = document.createElement('script');
  ref.setAttribute('type', 'text/javascript');
  ref.setAttribute('src', filepath);
  document.getElementsByTagName('head')[0].appendChild(ref);
}
