/**
 * TypeScript requires type definitions, otherwise types from libraries written in JavaScript will
 * be inferred to have type `any`. This is not ideal, as it defeats the purpose of using TypeScript,
 * so we include the placeholder type definition below.
 *
 * Solution found on Stack Overflow: https://stackoverflow.com/a/41946697
 */
declare module 'git-remote-protocol';
