module.exports = class logger {
  constructor(winston) {
    let customNames = this.initTransportNames();
    this.initTransports(winston, customNames);
  }

  initTransports(winston, cur) {
    for (var i in cur) {
      winston.loggers.add(cur[i], {
        file: {
          filename: './logs/' + cur[i] + '.log'
        }
      });
      try {
        winston.loggers.get(cur[i]).remove(winston.transports.Console)
      } catch (e) {}

      this[cur[i]] = winston.loggers.get(cur[i])
    }
  }

  initTransportNames() {
    return [
      "canvasCreations",
      "canvasResizes",
      "cardCreations",
      "cardMovements",
      "stackCreations",
      "stackMovements",
      "stackAdditions",
      "stackDeletes"
    ]
  }
}