import {diffLines} from 'diff';

/**
 * Diffs two blocks of text, comparing line by line, based on the algorithm proposed
 * in "An O(ND) Difference Algorithm and its Variations" (Myers, 1986). Results are formatted
 * according to the unified diff patch used in the Git protocol, where +/- indicate lines
 * added or removed in order to transform from original to updated.
 * @param original The base version of code or text to evaluate.
 * @param updated The updated version of code or text to compare against original.
 * @returns {string} A diff patch that conforms to the unified diff patch format.
 */
export const diff = (original: string, updated: string): string => {
  const diffLineChanges = diffLines(original, updated);
  let readableDiff = '';

  diffLineChanges.map(segment => {
    const segmentLines = segment.value.split(/\n/g, segment.count);
    if (segment.added) {
      segmentLines.map(line => (readableDiff += `+${line}\n`));
    } else if (segment.removed) {
      segmentLines.map(line => (readableDiff += `-${line}\n`));
    } else {
      segmentLines.map(line => (readableDiff += ` ${line}\n`));
    }
  });

  return readableDiff;
};
