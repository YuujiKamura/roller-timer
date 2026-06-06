import type { Workout } from '../types';
import { zenkoOniTokkun } from './zenko';
import { tabataClassic, zenkoPyramidOnly, zenkoSpinOnly } from './standard';

export const presets: Workout[] = [
	zenkoOniTokkun,
	zenkoPyramidOnly,
	zenkoSpinOnly,
	tabataClassic
];

export function findPresetById(id: string): Workout | undefined {
	return presets.find((p) => p.id === id);
}

export { zenkoOniTokkun };
