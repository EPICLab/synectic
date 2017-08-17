module.exports = class logger{
  constructor(winston){
    console.log("Weeee")
    this.customLevels = this.initLevels();
    console.log(this.customLevels)
    this.log = new (winston.Logger)({
      transports: [
        new (winston.transports.File)({
          name: 'created-file',
          filename: 'creations.log',
          level: this.customLevels.canvasCreation
        }),
        new (winston.transports.File)({
          name: 'movements-file',
          filename: 'movements.log',
          level: 'movement'
        }),
      ]
      });
      console.log(logger)
  }

  initLevels(){
    return {
      canvasCreation: 0,
      canvasResize: 1,
      cardCreation: 2,
      cardMovement: 3,
      stackCreation: 4,
      stackMovement: 5,
      stackAdd: 6,
      stackDelete: 7
    }
  }
}
