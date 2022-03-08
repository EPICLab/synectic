import { diff } from './diff';

describe('diff', () => {
  const good = 'Good dog\nGood dog\nBad dog';
  const bad = 'Bad dog\nGood dog\nGood dog';

  it('diff matches unmodified text without line changes', () => {
    expect(diff(good, good)).toMatchSnapshot();
  });

  it('diff returns both added and removed lines', () => {
    expect(diff(good, bad)).toMatchSnapshot();
  });
});