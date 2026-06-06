import type { Workout } from '../types';

export const tabataClassic: Workout = {
	id: 'tabata-classic',
	name: 'タバタ・プロトコル (オリジナル準拠)',
	sections: [
		{
			name: 'ウォームアップ',
			phases: [
				{ kind: 'prep', durationSec: 300, label: 'ウォームアップ' }
			]
		},
		{
			name: 'タバタ 4 分コア',
			phases: [
				...Array.from({ length: 8 }, (_, i) => [
					{ kind: 'work' as const, durationSec: 20, label: `ラウンド ${i + 1} 全力` },
					{ kind: 'rest' as const, durationSec: 10, label: '休憩' }
				]).flat()
			]
		},
		{
			name: 'クールダウン',
			phases: [
				{ kind: 'rest', durationSec: 180, label: 'クールダウン' }
			]
		}
	]
};
