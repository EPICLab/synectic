import Welcome from '../src/components/welcome';

describe('Welcome', () => {
  let instance: Welcome;

  beforeEach(() => {
    instance = new Welcome({});
  });

  it('creates an instance of App', async () => {
    expect(instance).toBeInstanceOf(Welcome);
  });

  it(`testing snapshots match`, () => {
    const bar = {
      foo: {
        x: 1,
        y: 2
      },
    };

    expect(bar).toMatchSnapshot();
  });
})