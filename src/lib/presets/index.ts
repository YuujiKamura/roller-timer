import type { Workout } from '../types';
import { rollerPyramidFull } from './roller';
import { tabataClassic } from './standard';

export const presets: Workout[] = [
	rollerPyramidFull,
	tabataClassic
];

export function findPresetById(id: string): Workout | undefined {
	return presets.find((p) => p.id === id);
}

export { rollerPyramidFull };
