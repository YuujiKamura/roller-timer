export type PhaseKind = 'prep' | 'work' | 'rest';

export type Phase = {
	kind: PhaseKind;
	durationSec: number;
	label?: string;
	note?: string;
};

export type Section = {
	name: string;
	phases: Phase[];
};

export type Workout = {
	id: string;
	name: string;
	sections: Section[];
};

export function flattenPhases(w: Workout): Phase[] {
	return w.sections.flatMap((s) => s.phases);
}

export function totalSeconds(w: Workout): number {
	return flattenPhases(w).reduce((sum, p) => sum + p.durationSec, 0);
}

export function fmtMmSs(sec: number): string {
	const m = Math.floor(sec / 60);
	const s = sec % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}
