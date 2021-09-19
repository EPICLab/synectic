/**
 * TypeScript does not know how to import files with unknown file suffix (i.e. non-TS/JS files).
 * To be able to import '*.css' files in TypeScript, the following definition is required to
 * allow TypeScript and Webpack to combine to properly pipe CSS into the resulting JavaScript.
 * 
 * Solution found on Stack Overflow: https://stackoverflow.com/a/41946697
 */
 declare module '*.css';

 declare module 'git-remote-protocol';
 
 declare module 'binarnia';