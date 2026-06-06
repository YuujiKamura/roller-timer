<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { TimerState, findPhaseSection } from '$lib/timer.svelte';
	import { presets, findPresetById } from '$lib/presets/index';
	import { fmtMmSs } from '$lib/types';
	import { beepCountdown, beepDone, beepPhaseChange, beepTick, getMasterVolume, primeAudio, setMasterVolume, setMuted } from '$lib/audio';
	import { sensorStore } from '$lib/sensors/store.svelte';
	import { connectFtms, connectHrm, disconnectFtms, disconnectHrm, isWebBluetoothSupported, tryAutoReconnect } from '$lib/sensors/bluetooth';
	import { hasUsefulSamples, sessionRecorder } from '$lib/session/recorder.svelte';
	import { downloadGpx } from '$lib/session/gpx';

	const STORAGE_PRESET = 'tabata.preset';
	const STORAGE_MUTE = 'tabata.muted';
	const STORAGE_VOLUME = 'tabata.volume';

	const timer = new TimerState(presets[0]);
	let presetId = $state(presets[0].id);
	let muted = $state(false);
	let volume = $state(getMasterVolume());

	function handleVolume(e: Event) {
		const v = Number((e.currentTarget as HTMLInputElement).value) / 100;
		volume = v;
		setMasterVolume(v);
		try { localStorage.setItem(STORAGE_VOLUME, String(v)); } catch { /* ignore */ }
	}
	const sensors = sensorStore;
	const recorder = sessionRecorder;
	let bleSupported = $state(false);

	timer.onTick = (t) => {
		if (t.remaining > 0 && t.remaining <= 3) beepCountdown();
		else if (t.remaining > 3) beepTick();
		recorder.tick();
	};
	timer.onPhaseChange = (_prev, next) => {
		if (next) beepPhaseChange(next.kind);
	};
	timer.onDone = () => {
		beepDone();
		recorder.finish();
	};

	function selectPreset(id: string) {
		const w = findPresetById(id);
		if (!w) return;
		presetId = id;
		timer.load(w);
		try { localStorage.setItem(STORAGE_PRESET, id); } catch { /* ignore */ }
	}

	function toggleMute() {
		muted = !muted;
		setMuted(muted);
		try { localStorage.setItem(STORAGE_MUTE, muted ? '1' : '0'); } catch { /* ignore */ }
	}

	let listEl: HTMLDivElement | undefined = $state();

	function handleStart() {
		primeAudio();
		if (timer.status === 'paused') {
			timer.resume();
		} else if (timer.status === 'done') {
			timer.reset();
			recorder.start(timer.workout);
			timer.start();
		} else if (timer.status === 'idle') {
			recorder.start(timer.workout);
			timer.start();
		} else {
			timer.start();
		}
	}

	function handleReset() {
		timer.reset();
		recorder.reset();
	}

	const kindLabel: Record<string, string> = { prep: 'PREP', work: 'WORK', rest: 'REST' };
	const kindClass = (k: string) => `k-${k}`;

	const sectionInfo = $derived(findPhaseSection(timer.workout, timer.idx));
	const sectionPhaseLabel = $derived(
		sectionInfo
			? `${timer.workout.sections[sectionInfo.sectionIdx].name} ・ ${sectionInfo.phaseInSection + 1} / ${timer.workout.sections[sectionInfo.sectionIdx].phases.length}`
			: '完了'
	);

	let flatCounter = 0;
	const flatList = $derived.by(() => {
		flatCounter = 0;
		return timer.workout.sections.map((sec, si) => ({
			si,
			name: sec.name,
			phases: sec.phases.map((p) => ({ p, gi: flatCounter++ }))
		}));
	});

	$effect(() => {
		if (!listEl) return;
		const el = listEl.querySelector<HTMLElement>(`[data-gi="${timer.idx}"]`);
		el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
	});

	function onKey(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			if (timer.status === 'running') timer.pause();
			else handleStart();
		} else if (e.key === 'r' || e.key === 'R') handleReset();
	}

	onMount(() => {
		document.addEventListener('keydown', onKey);
		bleSupported = isWebBluetoothSupported();
		try {
			const savedId = localStorage.getItem(STORAGE_PRESET);
			if (savedId) selectPreset(savedId);
			const savedMute = localStorage.getItem(STORAGE_MUTE);
			if (savedMute === '1') { muted = true; setMuted(true); }
			const savedVol = localStorage.getItem(STORAGE_VOLUME);
			if (savedVol) {
				const v = Number(savedVol);
				if (Number.isFinite(v) && v >= 0 && v <= 1) {
					volume = v;
					setMasterVolume(v);
				}
			}
		} catch { /* ignore */ }
		if (bleSupported) tryAutoReconnect();
	});
	onDestroy(() => {
		document.removeEventListener('keydown', onKey);
		timer.reset();
	});

	const ringR = 110;
	const ringC = 2 * Math.PI * ringR;
	const dashOffset = $derived(ringC * (1 - timer.progressInPhase()));
</script>

<svelte:head>
	<title>Tabata Timer — {timer.workout.name}</title>
</svelte:head>

<main class={timer.current ? kindClass(timer.current.kind) : 'k-done'}>
	<section class="timer">
		<div class="topbar">
			<select
				class="preset-select"
				value={presetId}
				onchange={(e) => selectPreset((e.currentTarget as HTMLSelectElement).value)}
				disabled={timer.status === 'running' || timer.status === 'paused'}
			>
				{#each presets as p (p.id)}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
			<button class="mute" onclick={toggleMute} aria-label={muted ? 'ミュート解除' : 'ミュート'}>
				{muted ? '🔇' : '🔊'}
			</button>
			<input
				class="volume"
				type="range"
				min="0"
				max="100"
				step="5"
				value={Math.round(volume * 100)}
				oninput={handleVolume}
				aria-label="音量"
			/>
		</div>
		<div class="meta">
			<div class="section">{sectionPhaseLabel}</div>
		</div>

		<div class="kind">{timer.current ? kindLabel[timer.current.kind] : 'DONE'}</div>
		<div class="label">{timer.current?.label ?? '完了'}</div>
		{#if timer.current?.note}
			<div class="note">{timer.current.note}</div>
		{/if}

		<div class="ring-wrap">
			<svg viewBox="0 0 240 240" class="ring">
				<circle cx="120" cy="120" r={ringR} class="track" />
				<circle
					cx="120"
					cy="120"
					r={ringR}
					class="prog"
					stroke-dasharray={ringC}
					stroke-dashoffset={dashOffset}
				/>
			</svg>
			<div class="seconds">{timer.remaining}</div>
		</div>

		{#if timer.next}
			<div class="next">次: {kindLabel[timer.next.kind]} {timer.next.durationSec}s {timer.next.label ?? ''}</div>
		{:else if timer.status !== 'done'}
			<div class="next">次: (なし)</div>
		{/if}

		<div class="controls">
			{#if timer.status === 'running'}
				<button class="primary" onclick={() => timer.pause()}>一時停止</button>
			{:else}
				<button class="primary" onclick={handleStart}>
					{timer.status === 'paused' ? '再開' : timer.status === 'done' ? 'もう一度' : 'スタート'}
				</button>
			{/if}
			<button onclick={handleReset}>リセット</button>
		</div>

		<div class="sensor-bar">
			{#if !bleSupported}
				<span class="ble-unsupported">このブラウザは Bluetooth 非対応 (Chrome / Edge / Android Chrome なら使えます)</span>
			{:else}
				<button
					class="sensor-btn {sensors.ftmsStatus}"
					onclick={() => sensors.ftmsStatus === 'connected' ? disconnectFtms() : connectFtms()}
				>
					{#if sensors.ftmsStatus === 'connected'}
						⚙ パワー {sensors.power.powerW ?? '—'}W ・ 回転 {sensors.power.cadenceRpm ? Math.round(sensors.power.cadenceRpm) : '—'}
					{:else if sensors.ftmsStatus === 'connecting'}
						⚙ 接続中…
					{:else}
						⚙ トレーナー接続
					{/if}
				</button>
				<button
					class="sensor-btn {sensors.hrStatus}"
					onclick={() => sensors.hrStatus === 'connected' ? disconnectHrm() : connectHrm()}
				>
					{#if sensors.hrStatus === 'connected'}
						♥ {sensors.hr.hrBpm ?? '—'} bpm
					{:else if sensors.hrStatus === 'connecting'}
						♥ 接続中…
					{:else}
						♥ 心拍接続
					{/if}
				</button>
			{/if}
			{#if sensors.lastError}
				<span class="sensor-err">{sensors.lastError}</span>
			{/if}
		</div>

		{#if timer.status === 'done' && hasUsefulSamples(recorder.completed)}
			<div class="gpx-row">
				<button class="gpx-btn" onclick={() => recorder.completed && downloadGpx(recorder.completed)}>
					GPX をダウンロード ({recorder.completed?.samples.length}秒分)
				</button>
			</div>
		{/if}
	</section>

	<aside class="list" bind:this={listEl}>
		<h2>セットリスト</h2>
		{#each flatList as sec (sec.si)}
			<div class="section-block">
				<h3>{sec.name}</h3>
				<ol>
					{#each sec.phases as { p, gi } (gi)}
						<li
							data-gi={gi}
							class="row {kindClass(p.kind)} {gi === timer.idx ? 'now' : ''} {gi < timer.idx ? 'past' : ''}"
						>
							<span class="kind-tag">{kindLabel[p.kind]}</span>
							<span class="dur">{fmtMmSs(p.durationSec)}</span>
							<span class="lbl">{p.label ?? ''}</span>
							{#if p.note}
								<span class="note-row">{p.note}</span>
							{/if}
						</li>
					{/each}
				</ol>
			</div>
		{/each}
	</aside>
</main>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		background: #f4f6fa;
		color: #15202b;
		font-family: system-ui, -apple-system, 'Segoe UI', 'Hiragino Sans', sans-serif;
		height: 100%;
		overscroll-behavior: none;
	}
	:global(*) {
		box-sizing: border-box;
	}

	main {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		padding: 1rem;
		height: 100vh;
		max-height: 100vh;
		transition: background 0.5s;
	}
	main.k-work { background: linear-gradient(180deg, #ffd1d1 0%, #f4f6fa 60%); }
	main.k-rest { background: linear-gradient(180deg, #c5efe5 0%, #f4f6fa 60%); }
	main.k-prep { background: linear-gradient(180deg, #ffe2b8 0%, #f4f6fa 60%); }
	main.k-done { background: #f4f6fa; }

	.timer {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-start;
		gap: 0.5rem;
		min-height: 0;
		overflow: hidden;
	}
	.topbar {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 0 0.25rem;
	}
	.preset-select {
		flex: 1 1 auto;
		max-width: 24rem;
		background: #fff;
		color: #15202b;
		border: 1.5px solid #cbd5e0;
		border-radius: 10px;
		padding: 0.6rem 0.8rem;
		font-size: 1.15rem;
		font-weight: 600;
		cursor: pointer;
	}
	.preset-select:disabled { opacity: 0.55; cursor: not-allowed; }
	.mute {
		font-size: 1.4rem;
		padding: 0.45rem 0.85rem;
		min-width: 0;
	}
	.volume {
		flex: 0 1 9rem;
		accent-color: #d63838;
	}
	.meta {
		text-align: center;
		color: #4a5568;
	}
	.section { font-size: 1.15rem; font-weight: 600; margin-top: 0.15rem; }

	.kind {
		font-size: clamp(2.6rem, 6vw, 4rem);
		font-weight: 900;
		letter-spacing: 0.16em;
		margin-top: 0.25rem;
	}
	main.k-work .kind { color: #d12222; }
	main.k-rest .kind { color: #15806d; }
	main.k-prep .kind { color: #b56b00; }
	main.k-done .kind { color: #5a6678; }

	.label { font-size: clamp(1.5rem, 2.6vw, 2.1rem); font-weight: 800; text-align: center; padding: 0 1rem; color: #15202b; }
	.note { font-size: clamp(1rem, 1.5vw, 1.25rem); color: #4a5568; text-align: center; padding: 0 1rem; max-width: 38ch; line-height: 1.4; }

	.ring-wrap {
		position: relative;
		flex: 1 1 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 0;
		width: 100%;
	}
	.ring {
		width: min(100%, 56vh);
		height: auto;
		transform: rotate(-90deg);
	}
	.ring .track { fill: none; stroke: #e1e6ee; stroke-width: 16; }
	.ring .prog {
		fill: none;
		stroke-width: 16;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.95s linear, stroke 0.4s;
	}
	main.k-work .ring .prog { stroke: #d12222; }
	main.k-rest .ring .prog { stroke: #15806d; }
	main.k-prep .ring .prog { stroke: #b56b00; }
	main.k-done .ring .prog { stroke: #a0aec0; }

	.seconds {
		position: absolute;
		font-family: ui-monospace, 'SF Mono', Consolas, monospace;
		font-size: clamp(5rem, 20vh, 14rem);
		font-weight: 900;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		color: #15202b;
	}

	.next {
		font-size: clamp(1rem, 1.4vw, 1.2rem);
		color: #4a5568;
		text-align: center;
		padding: 0 1rem;
		font-weight: 600;
	}

	.controls {
		display: flex;
		gap: 0.85rem;
		flex-wrap: wrap;
		justify-content: center;
		padding-bottom: 0.5rem;
	}
	button {
		font-size: 1.25rem;
		padding: 0.95rem 1.8rem;
		border-radius: 14px;
		border: 1.5px solid #cbd5e0;
		background: #fff;
		color: #15202b;
		cursor: pointer;
		font-weight: 600;
		transition: transform 0.05s, background 0.15s, box-shadow 0.15s;
		box-shadow: 0 1px 2px rgba(20, 30, 50, 0.05);
	}
	button:hover { background: #f0f3f8; box-shadow: 0 2px 6px rgba(20, 30, 50, 0.1); }
	button:active { transform: scale(0.97); }
	button.primary {
		background: #d12222;
		border-color: #d12222;
		color: #fff;
		font-weight: 800;
		font-size: 1.35rem;
		min-width: 10rem;
	}
	button.primary:hover { background: #e63232; }

	.sensor-bar {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
		padding: 0 0.5rem;
		font-size: 1rem;
	}
	.sensor-btn {
		font-size: 1rem;
		padding: 0.5rem 0.95rem;
		font-weight: 600;
		min-width: 0;
	}
	.sensor-btn.connected {
		background: #e4f6ed;
		border-color: #15806d;
		color: #0e5547;
		font-variant-numeric: tabular-nums;
	}
	.sensor-btn.connecting {
		background: #fff3dc;
		border-color: #b56b00;
		color: #6b3f00;
	}
	.sensor-btn.error {
		background: #ffe1e1;
		border-color: #d12222;
		color: #7a1212;
	}
	.ble-unsupported {
		color: #4a5568;
		font-size: 0.9rem;
	}
	.sensor-err {
		font-size: 0.9rem;
		color: #c92020;
	}
	.gpx-row {
		display: flex;
		justify-content: center;
		padding-bottom: 0.5rem;
	}
	.gpx-btn {
		background: #2e7cd6;
		border-color: #2e7cd6;
		color: #fff;
		font-weight: 700;
		font-size: 1.2rem;
	}
	.gpx-btn:hover { background: #3a8cdf; }

	.list {
		overflow-y: auto;
		padding: 0.75rem 1rem 2.5rem;
		border-left: 1px solid #d8dde6;
		min-height: 0;
		background: rgba(255, 255, 255, 0.65);
		border-radius: 12px;
	}
	.list h2 {
		margin: 0 0 0.75rem;
		font-size: 1.2rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #4a5568;
	}
	.section-block { margin-bottom: 1rem; }
	.section-block h3 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
		font-weight: 800;
		color: #2e7cd6;
		text-transform: none;
		letter-spacing: 0;
	}
	ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 5px; }
	.row {
		display: grid;
		grid-template-columns: 60px 70px 1fr;
		grid-template-rows: auto auto;
		align-items: center;
		gap: 0 0.6rem;
		padding: 0.6rem 0.8rem;
		border-radius: 10px;
		background: #fff;
		border-left: 5px solid #cbd5e0;
		font-size: 1.05rem;
		box-shadow: 0 1px 2px rgba(20, 30, 50, 0.04);
	}
	.row.k-work { border-left-color: #d12222; }
	.row.k-rest { border-left-color: #15806d; }
	.row.k-prep { border-left-color: #b56b00; }
	.row.past { opacity: 0.45; }
	.row.now {
		background: #fff7d0;
		outline: 3px solid #f5c100;
		font-weight: 700;
		transform: scale(1.02);
	}
	.kind-tag { font-size: 0.95rem; font-weight: 700; letter-spacing: 0.08em; }
	.row.k-work .kind-tag { color: #d12222; }
	.row.k-rest .kind-tag { color: #15806d; }
	.row.k-prep .kind-tag { color: #b56b00; }
	.dur { font-family: ui-monospace, monospace; font-weight: 600; color: #2d3748; }
	.lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #15202b; }
	.note-row {
		grid-column: 2 / 4;
		font-size: 0.9rem;
		color: #5a6678;
		margin-top: 3px;
	}

	@media (max-width: 720px) {
		main { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
		.list { border-left: none; border-top: 1px solid #d8dde6; }
		.ring { width: min(100%, 38vh); }
		.seconds { font-size: clamp(3rem, 14vh, 8rem); }
	}
</style>
