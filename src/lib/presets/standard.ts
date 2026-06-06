import type { Workout } from '../types';

export const tabataClassic: Workout = {
	id: 'tabata-classic',
	name: 'タバタ・プロトコル (オリジナル準拠)',
	sections: [
		{
			name: 'ウォームアップ',
			phases: [
				{ kind: 'prep', durationSec: 300, label: '軽め回転 50% VO2max', note: '田畑論文の推奨。 簡略形なら 3-5 分でも可' }
			]
		},
		{
			name: 'タバタ 4 分コア (170% VO2max)',
			phases: [
				...Array.from({ length: 8 }, (_, i) => [
					{ kind: 'work' as const, durationSec: 20, label: `ラウンド ${i + 1} 全力`, note: i === 0 ? '170% VO2max 相当、 8 ラウンド限界まで' : undefined },
					{ kind: 'rest' as const, durationSec: 10, label: '休憩' }
				]).flat()
			]
		},
		{
			name: 'クールダウン',
			phases: [
				{ kind: 'rest', durationSec: 180, label: '軽め回転で整理', note: '心拍を落とす' }
			]
		}
	]
};
