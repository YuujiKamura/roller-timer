import { describe, expect, it } from 'vitest';
import { parseWorkout, serializeWorkout, WorkoutParseError } from './io';
import { rollerPyramidFull } from './roller';

describe('serializeWorkout / parseWorkout round-trip', () => {
	it('preset を JSON 化して戻すと等価', () => {
		const json = serializeWorkout(rollerPyramidFull);
		const parsed = parseWorkout(json);
		expect(parsed).toEqual(rollerPyramidFull);
	});
});

describe('parseWorkout validation', () => {
	it('JSON 構文エラー', () => {
		expect(() => parseWorkout('{bad}')).toThrow(WorkoutParseError);
	});
	it('id 欠落', () => {
		expect(() => parseWorkout('{"name":"x","sections":[{"name":"s","phases":[{"kind":"work","durationSec":1}]}]}')).toThrow(/id/);
	});
	it('kind 不正', () => {
		expect(() =>
			parseWorkout(
				'{"id":"x","name":"x","sections":[{"name":"s","phases":[{"kind":"bogus","durationSec":1}]}]}'
			)
		).toThrow(/kind/);
	});
	it('durationSec 0', () => {
		expect(() =>
			parseWorkout(
				'{"id":"x","name":"x","sections":[{"name":"s","phases":[{"kind":"work","durationSec":0}]}]}'
			)
		).toThrow(/durationSec/);
	});
	it('sections 空', () => {
		expect(() => parseWorkout('{"id":"x","name":"x","sections":[]}')).toThrow(/sections/);
	});
	it('phase note も保持', () => {
		const w = parseWorkout(
			'{"id":"x","name":"x","sections":[{"name":"s","phases":[{"kind":"work","durationSec":10,"label":"a","note":"b"}]}]}'
		);
		expect(w.sections[0].phases[0]).toEqual({ kind: 'work', durationSec: 10, label: 'a', note: 'b' });
	});
});
