// load global libraries required for Electron to properly use them
window.$ = window.jQuery = require('jquery');
// window.CanvasManager = require('../lib/CanvasManager.js');
var raphael = require('raphael');
require('jquery-ui-bundle');

// load Electron#Menu into the appropriate location for each platform
const { Menu } = require('electron').remote;
const appMenu = require('../app/AppMenu.js');
 if (process.platform === 'darwin') appMenu.configDarwinMenu();
const menu = Menu.buildFromTemplate(appMenu.template);
Menu.setApplicationMenu(menu);

// load application-specific CSS and JS files, plus jQuery-UI minimized files
let loader = require('./loader.js');
loader.loadDir('../style', {filter: '.css'});
// loader.loadDir('../app', {filter: '.js'});

// load a blank Canvas instance
let CanvasManager = require('../lib/manager.js');
CanvasManager.register();
