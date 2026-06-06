import type { Workout } from '../types';
import { rollerPyramidFull } from './roller';
import { sstShort } from './sst';
import { tabataClassic } from './standard';

export const presets: Workout[] = [
	rollerPyramidFull,
	sstShort,
	tabataClassic
];

export function findPresetById(id: string): Workout | undefined {
	return presets.find((p) => p.id === id);
}

export { rollerPyramidFull };
