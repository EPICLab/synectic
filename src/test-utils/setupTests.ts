/**
 * 'ace-builds/webpack-resolver' is for dynamically loading modes and themes, however, Jest does not rely on webpack
 * for setting configurations and resolving paths. Therefore, resolving paths to modes and themes during testing will
 * not work unless paths are directly set using `basePath`, `modePath`, and `themePath`. For more details regarding this
 * problem and the steps used to resolve it, see https://github.com/EPICLab/synectic/issues/90. 
 */
import * as ace from 'ace-builds/src-noconflict/ace';
ace.config.set('basePath', './node_modules/ace-builds/');
ace.config.set('modePath', '');
ace.config.set('themePath', '');