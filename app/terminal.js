let Card = require("./Card")
let xterm = require("xterm")
let request = require("request")


module.exports = class Terminal extends Card {
  constructor(type) {
    super(type);
    xterm.loadAddon('attach')
    this.terminalWindow = new xterm()
    // this.terminalWindow.attach = require("./../node_modules/xterm/dist/addons/attach/attach").attach

    console.log(this.terminalWindow.attach)
    this.terminalWindow.open(document.getElementById(this.body.id))
    this.initTerminalListeners();
    let f, ws;
    request.post("http://localhost:6789/terminals", (e, r, body) => {
      console.log(r)
      this.terminalWindow.open(document.getElementById(this.body.id))
      const websock = require('ws');
      ws = new websock('ws://localhost:6789/terminals/' + r.body);

      ws.onopen = () => {
        this.terminalWindow.attach(ws)
      }
    });
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
        console.log(key)
        self.terminalWindow.write(key);
      }
    });
  }

}