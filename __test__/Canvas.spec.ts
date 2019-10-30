import Canvas, { CanvasProps } from '../src/components/Canvas';

describe('Canvas', () => {
  const props: CanvasProps = {};

  it('creates an instance of Canvas', async () => {
    expect(Canvas(props)).toBeInstanceOf(Canvas);
  });

  it(`testing snapshots match`, () => {
    const bar = {
      foo: {
        x: 2,
        y: 2
      },
    };

    expect(bar).toMatchSnapshot();
  });
})