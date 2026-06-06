import type { SensorSample } from '../sensors/types';
import { sensorStore } from '../sensors/store.svelte';
import type { Workout } from '../types';

export type RecordedSession = {
	workoutName: string;
	startedAt: number;
	endedAt?: number;
	samples: SensorSample[];
};

class SessionRecorder {
	current: RecordedSession | null = $state(null);
	completed: RecordedSession | null = $state(null);

	start(workout: Workout) {
		this.current = {
			workoutName: workout.name,
			startedAt: Date.now(),
			samples: []
		};
		this.completed = null;
	}

	tick() {
		const c = this.current;
		if (!c) return;
		const sample: SensorSample = {
			tMs: Date.now() - c.startedAt
		};
		if (typeof sensorStore.power.powerW === 'number') sample.powerW = sensorStore.power.powerW;
		if (typeof sensorStore.power.cadenceRpm === 'number') sample.cadenceRpm = sensorStore.power.cadenceRpm;
		if (typeof sensorStore.power.speedKmh === 'number') sample.speedKmh = sensorStore.power.speedKmh;
		if (typeof sensorStore.hr.hrBpm === 'number') sample.hrBpm = sensorStore.hr.hrBpm;
		c.samples.push(sample);
	}

	finish() {
		if (!this.current) return;
		this.current.endedAt = Date.now();
		this.completed = this.current;
		this.current = null;
	}

	reset() {
		this.current = null;
		this.completed = null;
	}
}

export const sessionRecorder = new SessionRecorder();

export function hasUsefulSamples(s: RecordedSession | null): boolean {
	if (!s || s.samples.length === 0) return false;
	return s.samples.some((x) => x.powerW != null || x.cadenceRpm != null || x.hrBpm != null);
}
