import type { Stack } from '../../src/types';
import { testStore } from './ReduxStore';

export const basicStack = testStore.stacks.entities['254fa11a-6e7e-4fd3-bc08-e97c5409719b'];
export const biggerStack: Stack = testStore.stacks.entities['1942z532-e7ab-190a-d1d3-385a2295de62'];