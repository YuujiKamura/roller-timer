import type { Workout } from '../types';

// SST ── ウォームアップで L2 → L3 → L3 上端 → L4 タッチ と段階的に上げて、
// そのまま本体に入る (本体前 rest 無し、 ベースギア決めも無し)。
// 本体は L4 / L3 を 5 分ずつ交互に 3 セット。
// ラベルは zone 名のみ、 体感は user 自身の心拍と経験で判断。

export const sstShort: Workout = {
	id: 'sst-short',
	name: 'SST 37分 5分L4/5分L3 × 3',
	sections: [
		{
			name: 'ウォーミングアップ (L2 から L4 タッチまで)',
			phases: [
				{ kind: 'work', durationSec: 60, label: 'L2' },
				{ kind: 'work', durationSec: 60, label: 'L3 (Tempo)' },
				{ kind: 'work', durationSec: 60, label: 'L3 上端 (SS 入口)' },
				{ kind: 'work', durationSec: 60, label: 'L4 タッチ (上限を覚える)' }
			]
		},
		{
			name: 'SST 本体 (L4 / L3 を 5分ずつ × 3 セット)',
			phases: [
				{ kind: 'work', durationSec: 300, label: 'L4 ①' },
				{ kind: 'work', durationSec: 300, label: 'L3 ①' },
				{ kind: 'work', durationSec: 300, label: 'L4 ②' },
				{ kind: 'work', durationSec: 300, label: 'L3 ②' },
				{ kind: 'work', durationSec: 300, label: 'L4 ③' },
				{ kind: 'work', durationSec: 300, label: 'L3 ③' }
			]
		},
		{
			name: 'クールダウン (3分)',
			phases: [
				{ kind: 'rest', durationSec: 180, label: 'L1' }
			]
		}
	]
};
