import type { Workout } from '../types';

export const rollerPyramidFull: Workout = {
	id: 'roller-pyramid-full',
	name: 'ローラー 20分メニュー',
	sections: [
		{
			name: 'ウォーミングアップ',
			phases: [
				{ kind: 'prep', durationSec: 10, label: '準備', note: 'ベースギアを決める (手の圧が消えて足に乗る重さ)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+1 (重)', note: '上から下まで長くベタっと踏む' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)', note: '少し前に座り、 フォームを意識' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-2 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)', note: '背中を丸めず体を前に伸ばし、 お尻の筋肉を使う' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' }
			]
		},
		{
			name: 'ピラミッド (ベース+3)',
			phases: [
				{ kind: 'work', durationSec: 30, label: '全力もがき' },
				{ kind: 'rest', durationSec: 30 },
				{ kind: 'work', durationSec: 20, label: '全力もがき (出力上げる)' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 10, label: 'MAXパワーで突っ込む' },
				{ kind: 'rest', durationSec: 50 },
				{ kind: 'work', durationSec: 20, label: '全力もがき' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 30, label: 'ラスト全力押し切り' }
			]
		},
		{
			name: '高回転',
			phases: [
				{ kind: 'rest', durationSec: 30, label: '繋ぎレスト' },
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
