import type { RecordedSession } from './recorder.svelte';

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

export function sessionToTcx(session: RecordedSession): string {
	const startMs = session.startedAt;
	const samples = session.samples;
	if (samples.length === 0) {
		return '';
	}

	let distance = 0;
	let prevMs = startMs;
	let prevSpeed = 0;
	const enriched = samples.map((s) => {
		const tMs = startMs + s.tMs;
		const speed = typeof s.speedKmh === 'number' ? s.speedKmh / 3.6 : prevSpeed;
		const dt = (tMs - prevMs) / 1000;
		distance += ((speed + prevSpeed) / 2) * dt;
		prevMs = tMs;
		prevSpeed = speed;
		return {
			tIso: toIsoZ(tMs),
			dist: distance,
			speed,
			hr: typeof s.hrBpm === 'number' ? s.hrBpm : null,
			cad: typeof s.cadenceRpm === 'number' ? Math.min(254, Math.round(s.cadenceRpm)) : null,
			pwr: typeof s.powerW === 'number' ? Math.round(s.powerW) : null,
		};
	});

	const totalSeconds = (samples[samples.length - 1].tMs - samples[0].tMs) / 1000;
	const totalDist = distance;
	const maxSpeed = enriched.reduce((m, p) => (p.speed > m ? p.speed : m), 0);
	const hrs = enriched.map((p) => p.hr).filter((h): h is number => h != null);
	const cads = enriched.map((p) => p.cad).filter((c): c is number => c != null);
	const avgHr = hrs.length ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : null;
	const maxHr = hrs.length ? Math.max(...hrs) : null;
	const avgCad = cads.length ? Math.min(254, Math.round(cads.reduce((a, b) => a + b, 0) / cads.length)) : null;

	const startIso = toIsoZ(startMs + samples[0].tMs);

	const trackpoints = enriched
		.map((p) => {
			const parts: string[] = [];
			parts.push(`        <Trackpoint>`);
			parts.push(`          <Time>${p.tIso}</Time>`);
			parts.push(`          <DistanceMeters>${p.dist.toFixed(3)}</DistanceMeters>`);
			if (p.hr != null) parts.push(`          <HeartRateBpm><Value>${p.hr}</Value></HeartRateBpm>`);
			if (p.cad != null) parts.push(`          <Cadence>${p.cad}</Cadence>`);
			const tpx: string[] = [];
			if (p.speed > 0 || samples.some((s) => typeof s.speedKmh === 'number')) {
				tpx.push(`<ae:Speed>${p.speed.toFixed(3)}</ae:Speed>`);
			}
			if (p.pwr != null) tpx.push(`<ae:Watts>${p.pwr}</ae:Watts>`);
			if (tpx.length) {
				parts.push(`          <Extensions><ae:TPX>${tpx.join('')}</ae:TPX></Extensions>`);
			}
			parts.push(`        </Trackpoint>`);
			return parts.join('\n');
		})
		.join('\n');

	const lapSummary: string[] = [];
	lapSummary.push(`        <TotalTimeSeconds>${totalSeconds.toFixed(3)}</TotalTimeSeconds>`);
	lapSummary.push(`        <DistanceMeters>${totalDist.toFixed(3)}</DistanceMeters>`);
	lapSummary.push(`        <MaximumSpeed>${maxSpeed.toFixed(3)}</MaximumSpeed>`);
	lapSummary.push(`        <Calories>0</Calories>`);
	if (avgHr != null) {
		lapSummary.push(`        <AverageHeartRateBpm><Value>${avgHr}</Value></AverageHeartRateBpm>`);
	}
	if (maxHr != null) {
		lapSummary.push(`        <MaximumHeartRateBpm><Value>${maxHr}</Value></MaximumHeartRateBpm>`);
	}
	lapSummary.push(`        <Intensity>Active</Intensity>`);
	if (avgCad != null) {
		lapSummary.push(`        <Cadence>${avgCad}</Cadence>`);
	}
	lapSummary.push(`        <TriggerMethod>Manual</TriggerMethod>`);

	const _name = escapeXml(session.workoutName);

	return `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase
    xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2"
    xmlns:ae="http://www.garmin.com/xmlschemas/ActivityExtension/v2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2 http://www.garmin.com/xmlschemas/TrainingCenterDatabasev2.xsd">
  <Activities>
    <Activity Sport="Biking">
      <Id>${startIso}</Id>
      <Lap StartTime="${startIso}">
${lapSummary.join('\n')}
        <Track>
${trackpoints}
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>
`;
}

export function downloadTcx(session: RecordedSession): void {
	const xml = sessionToTcx(session);
	if (!xml) return;
	const blob = new Blob([xml], { type: 'application/vnd.garmin.tcx+xml' });
	const url = URL.createObjectURL(blob);
	const safeName = session.workoutName.replace(/[\\/:*?"<>|]/g, '_');
	const ymd = new Date(session.startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
	const a = document.createElement('a');
	a.href = url;
	a.download = `tabata-${safeName}-${ymd}.tcx`;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
