import { Stack } from '../../src/store/slices/stacks';
import { testStore } from './ReduxStore';

export const basicStack = testStore.stacks.entities['254fa11a-6e7e-4fd3-bc08-e97c5409719b'] as Stack;
export const biggerStack = testStore.stacks.entities['1942z532-e7ab-190a-d1d3-385a2295de62'] as Stack;