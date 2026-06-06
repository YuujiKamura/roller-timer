// Preset 本体は roller.json (JSON 管理が基本、 編集はそっち)。
import type { Workout } from '../types';
import data from './roller.json';

export const rollerPyramidFull: Workout = data as unknown as Workout;
