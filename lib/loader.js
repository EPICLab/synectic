// recursively read and filter all files below the specified directory
// use callback to handle each result, or collect to work with all results
module.exports.load = function(startPath, filter, callback) {
  let fs = require('fs');
  let path = require('path');
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
      load(filename, filter, callback); //recurse
    }
    else if (filename.indexOf(filter) >= 0) callback(filename);
  };
};
