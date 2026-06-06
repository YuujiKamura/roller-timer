import type { Phase, PhaseKind, Section, Workout } from '../types';

const PHASE_KINDS: PhaseKind[] = ['prep', 'work', 'rest'];

export function serializeWorkout(w: Workout): string {
	return JSON.stringify(w, null, 2);
}

export class WorkoutParseError extends Error {}

function isObj(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function parsePhase(v: unknown, path: string): Phase {
	if (!isObj(v)) throw new WorkoutParseError(`${path}: phase はオブジェクトである必要があります`);
	const kind = v.kind;
	if (typeof kind !== 'string' || !PHASE_KINDS.includes(kind as PhaseKind)) {
		throw new WorkoutParseError(`${path}.kind: prep/work/rest のいずれか必須 (got ${JSON.stringify(kind)})`);
	}
	const durationSec = v.durationSec;
	if (typeof durationSec !== 'number' || !Number.isFinite(durationSec) || durationSec <= 0) {
		throw new WorkoutParseError(`${path}.durationSec: 0 より大きい数値必須 (got ${JSON.stringify(durationSec)})`);
	}
	const out: Phase = { kind: kind as PhaseKind, durationSec };
	if (v.label !== undefined) {
		if (typeof v.label !== 'string') throw new WorkoutParseError(`${path}.label: 文字列必須`);
		out.label = v.label;
	}
	if (v.note !== undefined) {
		if (typeof v.note !== 'string') throw new WorkoutParseError(`${path}.note: 文字列必須`);
		out.note = v.note;
	}
	return out;
}

function parseSection(v: unknown, path: string): Section {
	if (!isObj(v)) throw new WorkoutParseError(`${path}: section はオブジェクトである必要があります`);
	if (typeof v.name !== 'string' || !v.name) throw new WorkoutParseError(`${path}.name: 文字列必須`);
	if (!Array.isArray(v.phases) || v.phases.length === 0) {
		throw new WorkoutParseError(`${path}.phases: 1 件以上必須`);
	}
	const phases = v.phases.map((p, i) => parsePhase(p, `${path}.phases[${i}]`));
	return { name: v.name, phases };
}

export function parseWorkout(text: string): Workout {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch (e) {
		throw new WorkoutParseError(`JSON 構文エラー: ${(e as Error).message}`);
	}
	if (!isObj(raw)) throw new WorkoutParseError('workout はオブジェクトである必要があります');
	if (typeof raw.id !== 'string' || !raw.id) throw new WorkoutParseError('id: 文字列必須');
	if (typeof raw.name !== 'string' || !raw.name) throw new WorkoutParseError('name: 文字列必須');
	if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
		throw new WorkoutParseError('sections: 1 件以上必須');
	}
	const sections = raw.sections.map((s, i) => parseSection(s, `sections[${i}]`));
	return { id: raw.id, name: raw.name, sections };
}

const STORAGE_KEY = 'tabata.customWorkouts.v1';

export function loadCustomWorkouts(): Workout[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const arr = JSON.parse(raw);
		if (!Array.isArray(arr)) return [];
		return arr
			.map((w) => {
				try {
					return parseWorkout(JSON.stringify(w));
				} catch {
					return null;
				}
			})
			.filter((w): w is Workout => w !== null);
	} catch {
		return [];
	}
}

export function saveCustomWorkouts(list: Workout[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch {
		// localStorage が無い / クォータ越え等、 失敗しても致命ではない
	}
}
