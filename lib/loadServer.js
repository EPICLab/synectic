let {
  execFile
} = require("child_process");
module.exports = function () {
  const child = execFile('node', ['./lib/websocket.js'], (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
  })
}