import type { Workout } from '../types';

// SST (Sweet Spot) ── 持続強度系。 over-under (強度の上下) で退屈を回避。
// 「やや重 90rpm」 と「中重 85rpm」 を 2 分交互、 強度感はベースギア決めと同じ思想で
// label は薄く、 体感で合わせる。

export const sstShort: Workout = {
	id: 'sst-short',
	name: 'SST ショート 20分 (over-under)',
	sections: [
		{
			name: 'ウォーミングアップ',
			phases: [
				{ kind: 'prep', durationSec: 60, label: 'ベースギア決め' },
				{ kind: 'work', durationSec: 60, label: 'ベース+1 (重)' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-2 (軽)' }
			]
		},
		{
			name: 'SST 本体 (over-under × 5)',
			phases: [
				{ kind: 'work', durationSec: 120, label: 'ベース+2 90rpm (やや重)' },
				{ kind: 'work', durationSec: 120, label: 'ベース+1 85rpm (中重)' },
				{ kind: 'work', durationSec: 120, label: 'ベース+2 90rpm (やや重)' },
				{ kind: 'work', durationSec: 120, label: 'ベース+1 85rpm (中重)' },
				{ kind: 'work', durationSec: 120, label: 'ベース+2 90rpm (やや重)' }
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
