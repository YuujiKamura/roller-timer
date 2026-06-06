import type { Workout } from '../types';

// SST ── ウォームアップで段階的に強度を上げて L1/L2/L3/L4 の体感を覚え、 本体で
// L4 と L3 を 5 分ずつ交互に 3 セット繰り返す。 5 分切替なら心拍も追いつくので
// 心拍 over-under として機能する (短時間切替の over-under は power 系)。
// 個人差は数値登録ではなくウォームアップの段階体感で吸収する (RPE 系思想)。

export const sstShort: Workout = {
	id: 'sst-short',
	name: 'SST 40分 5分L4/5分L3 × 3',
	sections: [
		{
			name: 'ウォーミングアップ (L4 まで上げて上限を体感する)',
			phases: [
				{ kind: 'prep', durationSec: 60, label: 'ベースギア決め (70rpm が楽に出るギア)' },
				{ kind: 'work', durationSec: 60, label: 'L1: 会話余裕、 鼻呼吸で楽' },
				{ kind: 'work', durationSec: 60, label: 'L2: 会話可、 鼻呼吸ギリ (有酸素域)' },
				{ kind: 'work', durationSec: 60, label: 'L3 (Tempo): 会話切れがち、 口呼吸入る' },
				{ kind: 'work', durationSec: 60, label: 'L3 上端 (SS 入口): 会話 2-3 語まで' },
				{ kind: 'work', durationSec: 60, label: 'L4 タッチ: 会話不能、 息上がる — 上限を覚えろ' },
				{ kind: 'rest', durationSec: 60, label: 'L1 まで落とす (息整える、 bpm 控えとけ)' }
			]
		},
		{
			name: 'SST 本体 (L4 / L3 を 5分ずつ × 3 セット)',
			phases: [
				{ kind: 'work', durationSec: 300, label: 'L4 維持: 会話不能、 息上がる、 5 分耐える ①' },
				{ kind: 'work', durationSec: 300, label: 'L3 まで落とす: 会話切れがち、 呼吸整える ①' },
				{ kind: 'work', durationSec: 300, label: 'L4 維持 ②' },
				{ kind: 'work', durationSec: 300, label: 'L3 まで落とす ②' },
				{ kind: 'work', durationSec: 300, label: 'L4 維持 ③' },
				{ kind: 'work', durationSec: 300, label: 'L3 まで落とす ③' }
			]
		},
		{
			name: 'クールダウン (3分)',
			phases: [
				{ kind: 'rest', durationSec: 180, label: 'L1、 ゆっくり' }
			]
		}
	]
};
