// Preset 本体は tabata.json (JSON 管理が基本、 編集はそっち)。
import type { Workout } from '../types';
import data from './tabata.json';

export const tabataClassic: Workout = data as unknown as Workout;
