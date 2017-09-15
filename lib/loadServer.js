let {
  exec
} = require("child_process");
// Due to a NODE_MODULE_VERSION mismatch this is the work around to 
// loading the terminal card and connecting it to the backend
module.exports = function() {
  function startUp() {
    exec("node ./websocket.js", {
      //exec is the only node CMD that runs the file w/o isues
      cwd: __dirname,
      env: {
        PORT: 6789
      }
    }, (err, stdout, stderr) => {
      if (err) {
        killPort();
        startUp()
      }
    })
  }

  function killPort() {
    exec("ps -e | grep ./websocket.js | grep -v grep")
  }
  startUp()
}