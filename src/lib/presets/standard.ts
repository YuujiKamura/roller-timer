import type { Workout } from '../types';

export const tabataClassic: Workout = {
	id: 'tabata-classic',
	name: 'クラシックタバタ (20-10×8)',
	sections: [
		{
			name: 'タバタ 1 セット',
			phases: [
				{ kind: 'prep', durationSec: 10, label: '準備' },
				...Array.from({ length: 8 }, (_, i) => [
					{ kind: 'work' as const, durationSec: 20, label: `ラウンド ${i + 1}` },
					{ kind: 'rest' as const, durationSec: 10 }
				]).flat()
			]
		}
	]
};

export const zenkoPyramidOnly: Workout = {
	id: 'zenko-pyramid-only',
	name: 'ZENKO ピラミッドだけ',
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

export const zenkoSpinOnly: Workout = {
	id: 'zenko-spin-only',
	name: 'ZENKO 高回転だけ',
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
