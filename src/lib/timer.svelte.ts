import type { Phase, Workout } from './types';
import { flattenPhases } from './types';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done';

export class TimerState {
	workout: Workout = $state({ id: '', name: '', sections: [] });
	phases: Phase[] = $derived(flattenPhases(this.workout));
	idx = $state(0);
	remaining = $state(0);
	status: TimerStatus = $state('idle');

	current: Phase | undefined = $derived(this.phases[this.idx]);
	next: Phase | undefined = $derived(this.phases[this.idx + 1]);
	totalPhases = $derived(this.phases.length);
	progressInPhase = $derived(() => {
		const c = this.current;
		if (!c || c.durationSec === 0) return 0;
		return (c.durationSec - this.remaining) / c.durationSec;
	});

	#timerId: ReturnType<typeof setInterval> | null = null;
	onTick?: (state: TimerState) => void;
	onPhaseChange?: (prev: Phase | undefined, next: Phase | undefined) => void;
	onDone?: () => void;

	constructor(workout: Workout) {
		this.load(workout);
	}

	load(workout: Workout) {
		this.workout = workout;
		this.idx = 0;
		this.remaining = workout.sections[0]?.phases[0]?.durationSec ?? 0;
		this.status = 'idle';
	}

	start() {
		if (this.status === 'done') return;
		if (this.phases.length === 0) return;
		this.status = 'running';
		this.#timerId ??= setInterval(() => this.tick(), 1000);
	}

	pause() {
		if (this.status !== 'running') return;
		this.status = 'paused';
		this.#clearTimer();
	}

	resume() {
		if (this.status !== 'paused') return;
		this.start();
	}

	reset() {
		this.#clearTimer();
		this.idx = 0;
		this.remaining = this.phases[0]?.durationSec ?? 0;
		this.status = 'idle';
	}

	skip() {
		this.advance();
	}

	tick() {
		if (this.status !== 'running') return;
		this.remaining -= 1;
		this.onTick?.(this);
		if (this.remaining <= 0) {
			this.advance();
		}
	}

	advance() {
		const prev = this.current;
		const nextIdx = this.idx + 1;
		if (nextIdx >= this.phases.length) {
			this.#clearTimer();
			this.idx = this.phases.length;
			this.remaining = 0;
			this.status = 'done';
			this.onPhaseChange?.(prev, undefined);
			this.onDone?.();
			return;
		}
		this.idx = nextIdx;
		this.remaining = this.phases[nextIdx].durationSec;
		this.onPhaseChange?.(prev, this.phases[nextIdx]);
	}

	#clearTimer() {
		if (this.#timerId != null) {
			clearInterval(this.#timerId);
			this.#timerId = null;
		}
	}
}

export function findPhaseSection(workout: Workout, phaseIdx: number): { sectionIdx: number; phaseInSection: number } | null {
	let count = 0;
	for (let s = 0; s < workout.sections.length; s++) {
		const section = workout.sections[s];
		if (phaseIdx < count + section.phases.length) {
			return { sectionIdx: s, phaseInSection: phaseIdx - count };
		}
		count += section.phases.length;
	}
	return null;
}
