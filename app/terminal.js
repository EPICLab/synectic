let Card = require("./Card")
let xterm = require("xterm")


module.exports = class Terminal extends Card {
  constructor(type) {
    super(type);
    xterm.loadAddon('attach')
    this.terminalWindow = new xterm()
    // this.terminalWindow.attach = require("./../node_modules/xterm/dist/addons/attach/attach").attach

    console.log(this.terminalWindow.attach)
    this.terminalWindow.open(document.getElementById(this.body.id))
    this.initTerminalListeners();
    let f = new WebSocket("ws://localhost:7689/terminals/")
    this.terminalWindow.attach(f)
    // console.log(new WebSocket())
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