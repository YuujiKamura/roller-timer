import type { Workout } from '../types';

// SST (Sweet Spot) ── L3 (Tempo) 上端〜L4 (Threshold) 下端の境界を持続。
// 個人差が大きく LTHR 数値も人によって違うので、 ウォームアップで段階的に強度を
// 上げて user 自身に L1/L2/L3 の体感としきい値を覚えてもらう構成にしてある。
// 心拍計を繋いでいれば各段階で画面の bpm をチラ見して自分の数値を控えると以後楽になる。
// label の体感言語 (会話・呼吸) は RPE (Borg / Coggan) 系の指導書に倣った。

export const sstShort: Workout = {
	id: 'sst-short',
	name: 'SST ショート 2x10 (体感で SS を掴む)',
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
			name: 'SST 第1セット (10分)',
			phases: [
				{ kind: 'work', durationSec: 600, label: 'L3 上端を維持 (さっき触った L4 の一歩手前)' }
			]
		},
		{
			name: 'セット間レスト (5分)',
			phases: [
				{ kind: 'rest', durationSec: 300, label: 'L2 まで落とす、 呼吸整える' }
			]
		},
		{
			name: 'SST 第2セット (10分)',
			phases: [
				{ kind: 'work', durationSec: 600, label: 'L3 上端を維持、 L4 に踏み込まない' }
			]
		},
		{
			name: 'クールダウン (5分)',
			phases: [
				{ kind: 'rest', durationSec: 300, label: 'L1、 ゆっくり' }
			]
		}
	]
};
