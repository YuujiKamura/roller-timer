import type { Workout } from '../types';

export const rollerPyramidFull: Workout = {
	id: 'roller-pyramid-full',
	name: 'SFR + 高回転 20分メニュー',
	sections: [
		{
			name: 'ウォーミングアップ',
			phases: [
				{ kind: 'prep', durationSec: 60, label: 'ベースギア決め' },
				{ kind: 'work', durationSec: 60, label: 'ベース+1 (重)' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-2 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-3 (軽)' }
			]
		},
		{
			name: 'ピラミッド (ベース+3)',
			phases: [
				{ kind: 'work', durationSec: 30, label: 'SFR' },
				{ kind: 'rest', durationSec: 30 },
				{ kind: 'work', durationSec: 20, label: 'SFR' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 10, label: 'SFR' },
				{ kind: 'rest', durationSec: 50 },
				{ kind: 'work', durationSec: 20, label: 'SFR' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 30, label: 'SFR' },
				{ kind: 'rest', durationSec: 30 }
			]
		},
		{
			name: '高回転',
			phases: [
				{ kind: 'work', durationSec: 20, label: 'ベース-1 (軽) 高回転' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 20, label: 'ベース-3 (軽) 高回転' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 20, label: 'ベース-5〜6 (軽) 高回転' },
				{ kind: 'rest', durationSec: 40 }
			]
		},
		{
			name: 'クールダウン',
			phases: [
				{ kind: 'rest', durationSec: 300, label: 'クールダウン' }
			]
		}
	]
};
