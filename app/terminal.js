let Card = require("./Card")
let xterm = require("xterm")
let request = require("request")
const webSock = require('ws');

module.exports = class Terminal extends Card {
  constructor(type) {
    super(type);
    xterm.loadAddon('attach')
    xterm.loadAddon('fit')
    this.terminalWindow = new xterm({
      cursorBlink: true
    })
    this.ws = null;
    request.post("http://localhost:6789/terminals?cols=20&rows=14", (err, resp, body) => {
      this.terminalWindow.open(document.getElementById(this.body.id))
      this.terminalWindow.fit()
      this.terminalWindow.resize(20, 14) // resize to fit against the card
      this.ws = new webSock('ws://localhost:6789/terminals/' + resp.body);
      this.ws.onopen = () => this.terminalWindow.attach(this.ws)
    });
  }
}