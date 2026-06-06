import type { RecordedSession } from './recorder.svelte';

// 既定座標は富士山頂 (ローラー台 = 物理移動なし、 座標は 1 点固定)。 GPX の trkpt は
// 1 点必須なので「同じ場所で時刻だけ進む」 形にする。 Strava はこの形でも
// power / cadence / hr extensions を読んで activity に乗せる。
const DEFAULT_LAT = 35.3606;
const DEFAULT_LON = 138.7274;
const DEFAULT_ELEV = 3776;

function escapeXml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

function toIsoZ(ms: number): string {
	return new Date(ms).toISOString();
}

export function sessionToGpx(
	session: RecordedSession,
	opts: { lat?: number; lon?: number; elev?: number; creator?: string } = {}
): string {
	const lat = opts.lat ?? DEFAULT_LAT;
	const lon = opts.lon ?? DEFAULT_LON;
	const elev = opts.elev ?? DEFAULT_ELEV;
	const creator = opts.creator ?? 'tabata-timer';

	const startMs = session.startedAt;
	const trkpts = session.samples
		.map((s) => {
			const tIso = toIsoZ(startMs + s.tMs);
			const hr = typeof s.hrBpm === 'number' ? s.hrBpm : null;
			const cad = typeof s.cadenceRpm === 'number' ? Math.round(s.cadenceRpm) : null;
			const pw = typeof s.powerW === 'number' ? Math.round(s.powerW) : null;
			const speed = typeof s.speedKmh === 'number' ? (s.speedKmh / 3.6).toFixed(2) : null;

			const tpxParts: string[] = [];
			if (hr != null) tpxParts.push(`<gpxtpx:hr>${hr}</gpxtpx:hr>`);
			if (cad != null) tpxParts.push(`<gpxtpx:cad>${cad}</gpxtpx:cad>`);
			if (speed != null) tpxParts.push(`<gpxtpx:speed>${speed}</gpxtpx:speed>`);

			const ext: string[] = [];
			if (tpxParts.length) {
				ext.push(`<gpxtpx:TrackPointExtension>${tpxParts.join('')}</gpxtpx:TrackPointExtension>`);
			}
			if (pw != null) ext.push(`<power>${pw}</power>`);

			const extBlock = ext.length ? `      <extensions>${ext.join('')}</extensions>\n` : '';

			return `    <trkpt lat="${lat}" lon="${lon}">\n      <ele>${elev}</ele>\n      <time>${tIso}</time>\n${extBlock}    </trkpt>`;
		})
		.join('\n');

	const name = escapeXml(session.workoutName);
	const metaTime = toIsoZ(startMs);

	return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"
     creator="${escapeXml(creator)}"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <metadata>
    <name>${name}</name>
    <time>${metaTime}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <type>VirtualRide</type>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

export function downloadGpx(session: RecordedSession): void {
	const xml = sessionToGpx(session);
	const blob = new Blob([xml], { type: 'application/gpx+xml' });
	const url = URL.createObjectURL(blob);
	const safeName = session.workoutName.replace(/[\\/:*?"<>|]/g, '_');
	const ymd = new Date(session.startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
	const a = document.createElement('a');
	a.href = url;
	a.download = `tabata-${safeName}-${ymd}.gpx`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
