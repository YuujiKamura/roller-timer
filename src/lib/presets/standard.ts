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

export const rollerPyramidCore: Workout = {
	id: 'roller-pyramid-core',
	name: 'ローラー ピラミッドだけ',
	sections: [
		{
			name: 'ピラミッド (ベース+3)',
			phases: [
				{ kind: 'prep', durationSec: 10, label: 'ベース+3 にギア合わせ' },
				{ kind: 'work', durationSec: 30, label: '全力もがき' },
				{ kind: 'rest', durationSec: 30 },
				{ kind: 'work', durationSec: 20, label: '全力もがき (出力上げる)' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 10, label: 'MAXパワーで突っ込む' },
				{ kind: 'rest', durationSec: 50 },
				{ kind: 'work', durationSec: 20, label: '全力もがき' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 30, label: 'ラスト全力押し切り' },
				{ kind: 'rest', durationSec: 60, label: 'クールダウン' }
			]
		}
	]
};

export const rollerHighCadence: Workout = {
	id: 'roller-high-cadence',
	name: 'ローラー 高回転だけ',
	sections: [
		{
			name: '高回転',
			phases: [
				{ kind: 'prep', durationSec: 10, label: '軽いギアに合わせる' },
				{ kind: 'work', durationSec: 20, label: 'ベース-1 (軽) 全力回転' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 20, label: 'ベース-3 (軽) 全力回転' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 20, label: 'ベース-6 (軽) ラストスパート' },
				{ kind: 'rest', durationSec: 60, label: 'クールダウン' }
			]
		}
	]
};
