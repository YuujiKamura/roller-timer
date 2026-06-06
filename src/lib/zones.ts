// Phase の強度 zone → 色のマッピング表 (1 箇所で管理)。
// Phase の json には "zone": "L2" のように zone 名だけ書く、 hex はここに集約。
// fallback: zone 未指定 / 不明 zone は undefined を返す → UI 側で kind ベースの既存色。

export const ZONE_COLOR: Record<string, string> = {
	L1: '#a3d9a5', // 薄緑 (active recovery)
	L2: '#5fbe57', // 緑 (endurance)
	L3: '#efc547', // 黄 (tempo)
	L4: '#f08a35', // オレンジ (threshold)
	L5: '#e0473d', // 赤 (VO2max)
	L6: '#9b1a14' // 暗赤 (anaerobic)
};

export function zoneColor(zone: string | undefined): string | undefined {
	if (!zone) return undefined;
	return ZONE_COLOR[zone];
}
