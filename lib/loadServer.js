let {
  exec
} = require("child_process");

module.exports = function() {
  function startUp() {
    exec("node ./websocket.js", {
      //exec is the only node CMD that runs the file w/o isues
      cwd: __dirname,
      env: {
        PORT: 7689
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