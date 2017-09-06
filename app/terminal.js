let Card = require("./Card")
const xterm = require("xterm")

module.exports = class Terminal extends Card {
  constructor(type) {
    super(type);
    this.terminalWindow = new xterm({
      cursorBlink: true, // Do not blink the terminal's cursor
      cols: 120, // Set the terminal's width to 120 columns
      rows: 80 // Set the terminal's height to 80 rows
    })
    this.terminalWindow.open(document.getElementById(this.body.id))
    this.initTerminalListeners();
    console.log(this)
  }

  initTerminalListeners() {
    let self = this;
    self.terminalWindow.prompt = function() {
      self.terminalWindow.write('\r\n$');
    };
    this.terminalWindow.on('key', function(key, ev) {
      var printable = (!ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey);

      if (ev.keyCode == 13) {
        self.terminalWindow.prompt();
      } else if (ev.keyCode == 8) {
        // Do not delete the prompt
        if (self.terminalWindow.x > 2) {
          self.terminalWindow.write('\b \b');
        }
      } else if (printable) {
        self.terminalWindow.write(key);
      }
    });
  }

}