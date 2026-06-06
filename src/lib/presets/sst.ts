// Preset 本体は sst.json (JSON 管理が基本、 編集はそっち)。
import type { Workout } from '../types';
import data from './sst.json';

export const sstShort: Workout = data as unknown as Workout;
