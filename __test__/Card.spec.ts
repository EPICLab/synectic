import Card from '../src/components/Card';

describe('Card', () => {
  let instance: Card;

  beforeEach(() => {
    instance = new Card({ id: 1, name: 'test', offset: 3 });
  });

  it('creates an instance of Card', async () => {
    expect(instance).toBeInstanceOf(Card);
  });
})