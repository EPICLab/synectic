import { StacksState } from "../slices/stacks";
import { RootState } from "../store";

export const selectStacks = (state: RootState): StacksState => state.stacks;