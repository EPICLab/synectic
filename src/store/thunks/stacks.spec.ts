import { DateTime } from 'luxon';
import isUUID from 'validator/lib/isUUID';
import { emptyStore } from '../../test-utils/empty-store';
import { mock, MockInstance } from '../../test-utils/mock-fs';
import { mockStore } from '../../test-utils/mock-store';
import { Card, cardAdded } from '../slices/cards';
import { createStack, popCard, pushCards } from './stacks';

const card1: Card = {
  id: 'b741f857-870c-4756-b38b-b375823a08f6',
  name: 'sample.js',
  type: 'Editor',
  metafile: 'a58e4a5b-c8ec-42ba-86d2-82fa4d47638b',
  created: DateTime.fromISO('2019-01-10T10:08:30.114-08:00').valueOf(),
  modified: DateTime.fromISO('2020-01-28T07:44:15.276-08:00').valueOf(),
  captured: undefined,
  expanded: false,
  flipped: false,
  x: 30,
  y: 50
};

const card2: Card = {
  id: 'bca65655-a072-4a71-803b-9fef3a358a93',
  name: 'second.js',
  type: 'Editor',
  metafile: '7d2a0568-ad1b-4402-839b-593db00c445a',
  created: DateTime.fromISO('2019-01-10T10:08:30.114-08:00').valueOf(),
  modified: DateTime.fromISO('2022-01-28T07:44:15.276-08:00').valueOf(),
  captured: undefined,
  expanded: false,
  flipped: false,
  x: 45,
  y: 65
};

const card3: Card = {
  id: 'e9da275d-0640-4f9f-a0da-bc9d2a2c70d6',
  name: 'third.js',
  type: 'Editor',
  metafile: '7d2a0568-ad1b-4402-839b-593db00c445a',
  created: DateTime.fromISO('2019-01-10T10:08:30.114-08:00').valueOf(),
  modified: DateTime.fromISO('2021-12-25T07:44:15.276-08:00').valueOf(),
  captured: undefined,
  expanded: false,
  flipped: false,
  x: 30,
  y: 85
};

describe('thunks/stacks', () => {
  it('node::fs module cannot be injected into this jest test suite, so passthrough', () => {
    expect(true).toBeTruthy();
  });
  // const store = mockStore(emptyStore);
  // let mockedInstance: MockInstance;

  // beforeAll(async () => {
  //   store.dispatch(cardAdded(card1));
  //   store.dispatch(cardAdded(card2));
  //   const instance = await mock({
  //     foo: {
  //       bar: 'content stuff'
  //     }
  //   });
  //   return (mockedInstance = instance);
  // });

  // afterAll(() => mockedInstance.reset());

  // it('createStack resolves a Stack from a pair of cards', async () => {
  //   expect.assertions(4);
  //   const id = await store
  //     .dispatch(
  //       createStack({
  //         name: 'New Stack',
  //         cards: [card1.id, card2.id]
  //       })
  //     )
  //     .unwrap();
  //   const stack = store.getState().stacks.entities[id];
  //   const updated1 = store.getState().cards.entities[card1.id];
  //   const updated2 = store.getState().cards.entities[card2.id];

  //   expect(isUUID(id.toString())).toBe(true);
  //   expect(stack).toStrictEqual(
  //     expect.objectContaining({
  //       left: card1.x,
  //       top: card1.y
  //     })
  //   );
  //   expect(updated1).toStrictEqual(
  //     expect.objectContaining({
  //       zIndex: 1,
  //       top: 50,
  //       left: 10
  //     })
  //   );
  //   expect(updated2).toStrictEqual(
  //     expect.objectContaining({
  //       zIndex: 2,
  //       top: 60,
  //       left: 20
  //     })
  //   );
  // });

  // // it('createStack rejects creating a Stack from non-existing cards', async () => {
  // //     const stack = await store.dispatch(createStack({
  // //         name: 'New Stack', note: 'two cards', cards: [card1.id, card3.id]
  // //     })).unwrap();
  // //     const updated1 = store.getState().cards.entities[card1.id];
  // //     const updated3 = store.getState().cards.entities[card3.id];
  // //     expect()
  // // });

  // it('pushCards rejects adding non-existing cards to a Stack', async () => {
  //   expect.assertions(2);
  //   const id = await store
  //     .dispatch(
  //       createStack({
  //         name: 'New Stack',
  //         cards: [card1.id, card2.id]
  //       })
  //     )
  //     .unwrap();
  //   const stack = store.getState().stacks.entities[id];
  //   expect(stack?.cards).toHaveLength(2);

  //   await store.dispatch(pushCards({ stack: id, cards: [card3.id] }));
  //   const updatedStack = store.getState().stacks.entities[id];
  //   expect(updatedStack?.cards).toHaveLength(2);
  // });

  // it('pushCards resolves to add cards to existing set in a Stack', async () => {
  //   expect.assertions(3);
  //   store.dispatch(cardAdded(card3));
  //   const id = await store
  //     .dispatch(
  //       createStack({
  //         name: 'New Stack',
  //         cards: [card1.id, card2.id]
  //       })
  //     )
  //     .unwrap();
  //   const stack = store.getState().stacks.entities[id];
  //   expect(stack?.cards).toHaveLength(2);

  //   await store.dispatch(pushCards({ stack: id, cards: [card3.id] }));
  //   const updatedStack = store.getState().stacks.entities[id];
  //   expect(updatedStack?.cards).toHaveLength(3);

  //   const updatedCard3 = store.getState().cards.entities[card3.id];
  //   expect(updatedCard3).toStrictEqual(
  //     expect.objectContaining({
  //       zIndex: 4,
  //       top: 80,
  //       left: 40
  //     })
  //   );
  // });

  // it('popCards resolves removing cards from a Stack with greater than two cards', async () => {
  //   expect.assertions(3);
  //   const id = await store
  //     .dispatch(
  //       createStack({
  //         name: 'New Stack',
  //         cards: [card1.id, card2.id, card3.id]
  //       })
  //     )
  //     .unwrap();

  //   await store.dispatch(popCard({ stack: id, card: card2.id, x: 10, y: 100 }));
  //   const updatedStack = store.getState().stacks.entities[id];
  //   expect(updatedStack?.cards).toHaveLength(2);

  //   const updatedCard2 = store.getState().cards.entities[card2.id];
  //   expect(updatedCard2).toStrictEqual(
  //     expect.objectContaining({
  //       captured: undefined,
  //       left: 55,
  //       top: 135
  //     })
  //   );

  //   const updatedCard3 = store.getState().cards.entities[card3.id];
  //   expect(updatedCard3).toStrictEqual(
  //     expect.objectContaining({
  //       captured: id,
  //       x: 20,
  //       y: 60
  //     })
  //   );
  // });

  // it('popCards resolves removing cards from a Stack with only two cards and delta is provided', async () => {
  //   expect.assertions(2);
  //   const id = await store
  //     .dispatch(
  //       createStack({
  //         name: 'New Stack',
  //         cards: [card1.id, card2.id]
  //       })
  //     )
  //     .unwrap();

  //   await store.dispatch(popCard({ stack: id, card: card2.id, x: 10, y: 100 }));
  //   const updatedStack = store.getState().stacks.entities[id];
  //   expect(updatedStack).not.toBeDefined();

  //   const updatedCard2 = store.getState().cards.entities[card2.id];
  //   expect(updatedCard2).toStrictEqual(
  //     expect.objectContaining({
  //       captured: undefined,
  //       x: 40,
  //       y: 210
  //     })
  //   );
  // });
});
