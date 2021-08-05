import { RootState } from '../store';
import { CanvasState } from '../slices/canvas';

export const selectCanvas = (state: RootState): CanvasState => state.canvas;