import type { Metafile } from '../../src/types';
import { testStore } from './ReduxStore';

export const basicMetafile = testStore.metafiles.entities['821c9159-292b-4639-b90e-e84fc12740ee'] as Metafile;
export const virtualMetafile = testStore.metafiles.entities['46ae0111-0c82-4ee2-9ee5-cd5bdf8d8a71'] as Metafile;
