import type { Workout } from '../types';

// ZENKO 鬼特訓メニュー (辻善光 / TeamZenko、 動画 youtu.be/Pfvs_5q1lYw、
// CYCLE MODE 公式チャンネル) を 20 分タイマー化。 動画タイムスタンプ実測:
// アップ 6 分 + ピラミッド 5 分 + 高回転 3 分 + クールダウン 6 分 = 20 分ちょうど。
export const rollerPyramidFull: Workout = {
	id: 'roller-pyramid-full',
	name: 'ローラー 20分メニュー',
	sections: [
		{
			name: 'ウォーミングアップ',
			phases: [
				{ kind: 'prep', durationSec: 60, label: 'ベースギア決め', note: '手の圧が消えて足に乗る重さ、 これがベース' },
				{ kind: 'work', durationSec: 60, label: 'ベース+1 (重)', note: 'ベースから 1 枚重く。 上から下まで長くベタっと踏む' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-1 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)', note: '少し前に座り、 フォームを意識' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-2 (軽)' },
				{ kind: 'work', durationSec: 60, label: 'ベース+2 (重)', note: '背中を丸めず体を前に伸ばし、 お尻 (大臀筋) を使う' },
				{ kind: 'rest', durationSec: 60, label: 'ベース-3 (軽)', note: 'ここで「しっかりしたアップが終わり」 と Zenko 明言' }
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
				{ kind: 'work', durationSec: 30, label: 'ラスト全力押し切り' },
				{ kind: 'rest', durationSec: 30 }
			]
		},
		{
			name: '高回転',
			phases: [
				{ kind: 'work', durationSec: 20, label: 'ベース-1 (軽) 全力回転' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 20, label: 'ベース-3 (軽) 全力回転' },
				{ kind: 'rest', durationSec: 40 },
				{ kind: 'work', durationSec: 20, label: 'ベース-5〜6 (軽) ラストスパート' },
				{ kind: 'rest', durationSec: 40 }
			]
		},
		{
			name: 'クールダウン',
			phases: [
				{ kind: 'rest', durationSec: 300, label: 'ゆっくり回して疲れを抜く', note: '足は止めず、 とにかくゆっくりでも回す' }
			]
		}
	]
};
