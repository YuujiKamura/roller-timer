import type { Workout } from '../types';
import { rollerPyramidFull } from './roller';
import { tabataClassic, rollerPyramidCore, rollerHighCadence } from './standard';

export const presets: Workout[] = [
	rollerPyramidFull,
	rollerPyramidCore,
	rollerHighCadence,
	tabataClassic
];

export function findPresetById(id: string): Workout | undefined {
	return presets.find((p) => p.id === id);
}

export { rollerPyramidFull };
