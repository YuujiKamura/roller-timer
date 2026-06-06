import type { Workout } from '../types';

// SST (Sweet Spot Training) ── L3 (Tempo) 上端〜L4 (Threshold) 下端の境界を
// 持続的に刺激する持久力メニュー。 心拍ベースで LTHR の 88-95% 維持が指針。
// 心拍は遅延あって短時間切替に追いつかないので flat 持続が筋 (over-under は power 系)。
// 業界の「ショート SST」 は 2x10 (本体 20 min) が定番。
// 出典: FasCat Coaching, BikeRadar, charinori-goburin.com (日本語), TrainerRoad forum。
// LTHR は屋内で屋外より 5-10 bpm 低くなる傾向、 user 側で zone 較正。

export const sstShort: Workout = {
	id: 'sst-short',
	name: 'SST ショート 2x10 (35分)',
	sections: [
		{
			name: 'ウォーミングアップ',
			phases: [
				{ kind: 'prep', durationSec: 60, label: 'ベースギア決め' },
				{ kind: 'work', durationSec: 60, label: 'ベース+1 心拍 L2 で温める' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 心拍 L2 上限まで' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' }
			]
		},
		{
			name: 'SST 第1セット (10分)',
			phases: [
				{ kind: 'work', durationSec: 600, label: '心拍 LTHR 88-95% 維持' }
			]
		},
		{
			name: 'セット間レスト',
			phases: [
				{ kind: 'rest', durationSec: 300, label: '軽め (心拍 L2 まで落とす)' }
			]
		},
		{
			name: 'SST 第2セット (10分)',
			phases: [
				{ kind: 'work', durationSec: 600, label: '心拍 LTHR 88-95% 維持' }
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
