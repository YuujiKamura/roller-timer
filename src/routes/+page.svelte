<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { TimerState, findPhaseSection } from '$lib/timer.svelte';
	import { presets } from '$lib/presets/index';
	import { loadCustomWorkouts, parseWorkout, saveCustomWorkouts, serializeWorkout, WorkoutParseError } from '$lib/presets/io';
	import { fmtMmSs } from '$lib/types';
	import { beepCountdown, beepDone, beepPhaseChange, beepTick, getMasterVolume, primeAudio, setMasterVolume, setMuted } from '$lib/audio';
	import { sensorStore } from '$lib/sensors/store.svelte';
	import { connectFtms, connectHrm, disconnectFtms, disconnectHrm, isWebBluetoothSupported, tryAutoReconnect } from '$lib/sensors/bluetooth';
	import { hasUsefulSamples, sessionRecorder } from '$lib/session/recorder.svelte';
	import { downloadTcx } from '$lib/session/tcx';

	const STORAGE_PRESET = 'tabata.preset';
	const STORAGE_MUTE = 'tabata.muted';
	const STORAGE_VOLUME = 'tabata.volume';

	const timer = new TimerState(presets[0]);
	let presetId = $state(presets[0].id);
	let muted = $state(false);
	let volume = $state(getMasterVolume());
	let customWorkouts = $state<typeof presets>([]);
	let ioOpen = $state(false);
	let ioMode = $state<'export' | 'import'>('export');
	let ioText = $state('');
	let ioError = $state<string | null>(null);
	let ioCopied = $state(false);

	const allPresets = $derived([...presets, ...customWorkouts]);

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
		const w = allPresets.find((p) => p.id === id);
		if (!w) return;
		presetId = id;
		timer.load(w);
		try { localStorage.setItem(STORAGE_PRESET, id); } catch { /* ignore */ }
	}

	function openExport() {
		const current = allPresets.find((p) => p.id === presetId);
		if (!current) return;
		ioMode = 'export';
		ioText = serializeWorkout(current);
		ioError = null;
		ioCopied = false;
		ioOpen = true;
		try {
			navigator.clipboard?.writeText(ioText).then(() => { ioCopied = true; }, () => {});
		} catch { /* ignore */ }
	}

	function openImport() {
		ioMode = 'import';
		ioText = '';
		ioError = null;
		ioCopied = false;
		ioOpen = true;
	}

	function commitImport() {
		try {
			const w = parseWorkout(ioText);
			const idx = customWorkouts.findIndex((c) => c.id === w.id);
			const next = customWorkouts.slice();
			if (idx >= 0) next[idx] = w; else next.push(w);
			customWorkouts = next;
			saveCustomWorkouts(next);
			selectPreset(w.id);
			ioOpen = false;
		} catch (e) {
			ioError = e instanceof WorkoutParseError ? e.message : String(e);
		}
	}

	function deleteCustom(id: string) {
		const next = customWorkouts.filter((c) => c.id !== id);
		customWorkouts = next;
		saveCustomWorkouts(next);
		if (presetId === id) selectPreset(presets[0].id);
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
			customWorkouts = loadCustomWorkouts();
			const savedId = localStorage.getItem(STORAGE_PRESET);
			if (savedId) selectPreset(savedId);
			const savedMute = localStorage.getItem(STORAGE_MUTE);
			if (savedMute === '1') { muted = true; setMuted(true); }
			const savedVol = localStorage.getItem(STORAGE_VOLUME);
			if (savedVol) {
				const v = Number(savedVol);
				if (Number.isFinite(v) && v >= 0 && v <= 3) {
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

	const tcxSampleCount = $derived(
		recorder.completed?.samples.length ?? recorder.current?.samples.length ?? 0
	);
	const tcxAvailable = $derived(tcxSampleCount > 0);

	function toggleFtms() {
		if (sensors.ftmsStatus === 'connected' || sensors.ftmsStatus === 'connecting') disconnectFtms();
		else connectFtms();
	}
	function toggleHr() {
		if (sensors.hrStatus === 'connected' || sensors.hrStatus === 'connecting') disconnectHrm();
		else connectHrm();
	}
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
				{#each allPresets as p (p.id)}
					<option value={p.id}>{p.name}</option>
				{/each}
			</select>
			<button class="io-btn" onclick={openExport} aria-label="エクスポート" title="現プリセットをエクスポート">📤</button>
			<button class="io-btn" onclick={openImport} aria-label="インポート" title="JSON をインポート">📥</button>
			<button class="mute" onclick={toggleMute} aria-label={muted ? 'ミュート解除' : 'ミュート'}>
				{muted ? '🔇' : '🔊'}
			</button>
			<input
				class="volume"
				type="range"
				min="0"
				max="300"
				step="5"
				value={Math.round(volume * 100)}
				oninput={handleVolume}
				aria-label="音量"
			/>
			<span class="volume-pct">{Math.round(volume * 100)}%</span>
		</div>

		{#if ioOpen}
			<div class="io-panel">
				<div class="io-head">
					<strong>{ioMode === 'export' ? 'エクスポート' : 'インポート'}</strong>
					{#if ioMode === 'export' && ioCopied}<span class="io-hint">クリップボードにコピー済</span>{/if}
					<button class="io-close" onclick={() => (ioOpen = false)} aria-label="閉じる">✕</button>
				</div>
				<textarea
					class="io-text"
					rows="10"
					bind:value={ioText}
					placeholder={ioMode === 'import' ? 'ここに JSON を貼り付けてください' : ''}
					readonly={ioMode === 'export'}
				></textarea>
				{#if ioError}<div class="io-err">{ioError}</div>{/if}
				{#if ioMode === 'import'}
					<div class="io-actions">
						<button onclick={commitImport}>読込</button>
					</div>
				{/if}
				{#if customWorkouts.length > 0}
					<div class="io-customs">
						<div class="io-customs-title">保存済みカスタム</div>
						{#each customWorkouts as cw (cw.id)}
							<div class="io-custom-row">
								<span>{cw.name}</span>
								<button onclick={() => deleteCustom(cw.id)} aria-label="削除">削除</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
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
			<button
				class="tcx-btn"
				disabled={!tcxAvailable}
				onclick={() => {
					const s = recorder.completed ?? recorder.current;
					if (s) downloadTcx(s);
				}}
				title={tcxAvailable ? 'TCX をダウンロード (Strava にアップロード可)' : 'スタート後に保存できます'}
			>
				TCX 保存{tcxSampleCount ? ` (${tcxSampleCount}秒)` : ''}
			</button>
		</div>

		<div class="sensor-cards">
			<button class="card {sensors.ftmsStatus}" onclick={toggleFtms} disabled={!bleSupported}>
				<div class="lbl">パワー</div>
				<div class="v">{sensors.ftmsStatus === 'connected' ? (sensors.power.powerW ?? '—') : '—'}</div>
				<div class="u">W</div>
				<div class="status">
					{#if sensors.ftmsStatus === 'connected'}接続中{:else if sensors.ftmsStatus === 'connecting'}接続中…{:else if sensors.ftmsStatus === 'error'}エラー{:else}タップで接続{/if}
				</div>
			</button>
			<button class="card {sensors.ftmsStatus}" onclick={toggleFtms} disabled={!bleSupported}>
				<div class="lbl">ケイデンス</div>
				<div class="v">{sensors.ftmsStatus === 'connected' && sensors.power.cadenceRpm != null ? Math.round(sensors.power.cadenceRpm) : '—'}</div>
				<div class="u">rpm</div>
				<div class="status">
					{#if sensors.ftmsStatus === 'connected'}接続中{:else if sensors.ftmsStatus === 'connecting'}接続中…{:else}タップで接続{/if}
				</div>
			</button>
			<button class="card hr {sensors.hrStatus}" onclick={toggleHr} disabled={!bleSupported}>
				<div class="lbl">心拍</div>
				<div class="v">{sensors.hrStatus === 'connected' ? (sensors.hr.hrBpm ?? '—') : '—'}</div>
				<div class="u">bpm</div>
				<div class="status">
					{#if sensors.hrStatus === 'connected'}接続中{:else if sensors.hrStatus === 'connecting'}接続中…{:else if sensors.hrStatus === 'error'}エラー{:else}タップで接続{/if}
				</div>
			</button>
		</div>
		{#if !bleSupported}
			<div class="ble-unsupported">このブラウザは Bluetooth 非対応 ── Chrome / Edge / Android Chrome なら使えます</div>
		{:else if sensors.lastError}
			<div class="sensor-err">{sensors.lastError}</div>
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
		grid-template-rows: minmax(0, 100vh);
		gap: 0.8rem;
		padding: 0.8rem;
		height: 100vh;
		max-height: 100vh;
		overflow: hidden;
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
		gap: 0.35rem;
		min-height: 0;
		max-height: 100%;
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
		font-size: clamp(1.8rem, 4vw, 2.8rem);
		font-weight: 900;
		letter-spacing: 0.16em;
		margin-top: 0.1rem;
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
		width: min(100%, 38vh);
		height: auto;
		transform: rotate(-90deg);
	}
	.ring .track { fill: none; stroke: #e1e6ee; stroke-width: 14; }
	.ring .prog {
		fill: none;
		stroke-width: 14;
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
		font-size: clamp(3.5rem, 14vh, 9rem);
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

	.sensor-cards {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.6rem;
		width: 100%;
		padding: 0 0.25rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0;
		padding: 0.7rem 0.4rem 0.55rem;
		border-radius: 14px;
		background: #fff;
		border: 1.5px solid #cbd5e0;
		border-top: 6px solid #cbd5e0;
		min-width: 0;
		font-size: inherit;
		font-weight: 600;
		color: #15202b;
		cursor: pointer;
		box-shadow: 0 1px 2px rgba(20, 30, 50, 0.04);
	}
	.card:hover { background: #f0f3f8; }
	.card:disabled { opacity: 0.5; cursor: not-allowed; }
	.card.connected { border-color: #15806d; border-top-color: #15806d; background: #f1fbf6; }
	.card.connecting { border-color: #b56b00; border-top-color: #b56b00; background: #fff8e8; }
	.card.error { border-color: #d12222; border-top-color: #d12222; background: #ffefef; }
	.card.hr { border-top-color: #d12222; }
	.card.hr.connected { border-top-color: #d12222; }
	.card .lbl { font-size: 0.95rem; color: #4a5568; font-weight: 700; letter-spacing: 0.04em; }
	.card .v {
		font-family: ui-monospace, 'SF Mono', Consolas, monospace;
		font-size: clamp(2.2rem, 6vw, 3.4rem);
		font-weight: 900;
		line-height: 1;
		margin: 0.2rem 0;
		font-variant-numeric: tabular-nums;
	}
	.card .u { font-size: 0.9rem; color: #5a6678; }
	.card .status { font-size: 0.78rem; color: #5a6678; margin-top: 0.25rem; opacity: 0.85; }
	.ble-unsupported {
		color: #4a5568;
		font-size: 0.9rem;
		text-align: center;
		padding: 0 0.5rem;
	}
	.sensor-err {
		font-size: 0.9rem;
		color: #c92020;
		text-align: center;
		padding: 0 0.5rem;
	}
	.tcx-btn {
		background: #2e7cd6;
		border-color: #2e7cd6;
		color: #fff;
		font-weight: 700;
	}
	.tcx-btn:hover:not(:disabled) { background: #3a8cdf; }
	.tcx-btn:disabled { background: #cbd5e0; border-color: #cbd5e0; color: #fff; cursor: not-allowed; }

	.volume-pct {
		font-size: 0.75rem;
		color: #5a6473;
		min-width: 3em;
		text-align: right;
	}

	.io-btn {
		background: none;
		border: 1px solid #c4cbda;
		border-radius: 6px;
		padding: 0.15rem 0.45rem;
		font-size: 1rem;
		cursor: pointer;
		line-height: 1;
	}
	.io-btn:hover { background: #eef2f8; }
	.io-panel {
		margin: 0.5rem 0;
		padding: 0.6rem 0.7rem;
		background: rgba(255, 255, 255, 0.9);
		border: 1px solid #c4cbda;
		border-radius: 8px;
		font-size: 0.85rem;
	}
	.io-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.4rem;
	}
	.io-hint { color: #2e7cd6; font-size: 0.75rem; }
	.io-close {
		margin-left: auto;
		background: none;
		border: none;
		font-size: 1rem;
		cursor: pointer;
		padding: 0 0.3rem;
	}
	.io-text {
		width: 100%;
		font-family: ui-monospace, Menlo, Consolas, monospace;
		font-size: 0.78rem;
		border: 1px solid #d8dde6;
		border-radius: 6px;
		padding: 0.4rem;
		box-sizing: border-box;
		resize: vertical;
	}
	.io-err {
		color: #c92020;
		margin-top: 0.4rem;
		font-size: 0.78rem;
		white-space: pre-wrap;
	}
	.io-actions { margin-top: 0.4rem; display: flex; gap: 0.4rem; }
	.io-actions button {
		padding: 0.25rem 0.8rem;
		background: #2e7cd6;
		color: #fff;
		border: 1px solid #2e7cd6;
		border-radius: 6px;
		cursor: pointer;
	}
	.io-customs { margin-top: 0.6rem; border-top: 1px solid #e0e4ec; padding-top: 0.4rem; }
	.io-customs-title { font-size: 0.75rem; color: #5a6473; margin-bottom: 0.3rem; }
	.io-custom-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.15rem 0;
	}
	.io-custom-row button {
		padding: 0.1rem 0.5rem;
		font-size: 0.75rem;
		background: none;
		border: 1px solid #c4cbda;
		border-radius: 4px;
		cursor: pointer;
	}

	.list {
		overflow-y: auto;
		padding: 0.6rem 0.8rem 1.2rem;
		border-left: 1px solid #d8dde6;
		min-height: 0;
		max-height: 100%;
		background: rgba(255, 255, 255, 0.65);
		border-radius: 12px;
	}
	.list h2 {
		margin: 0 0 0.4rem;
		font-size: 1rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #4a5568;
	}
	.section-block { margin-bottom: 0.5rem; }
	.section-block h3 {
		margin: 0 0 0.3rem;
		font-size: 0.95rem;
		font-weight: 800;
		color: #2e7cd6;
		text-transform: none;
		letter-spacing: 0;
	}
	ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 3px; }
	.row {
		display: grid;
		grid-template-columns: 52px 56px 1fr;
		grid-template-rows: auto auto;
		align-items: center;
		gap: 0 0.5rem;
		padding: 0.35rem 0.6rem;
		border-radius: 8px;
		background: #fff;
		border-left: 4px solid #cbd5e0;
		font-size: 0.92rem;
		box-shadow: 0 1px 2px rgba(20, 30, 50, 0.04);
	}
	.row.k-work { border-left-color: #d12222; }
	.row.k-rest { border-left-color: #15806d; }
	.row.k-prep { border-left-color: #b56b00; }
	.row.past { opacity: 0.45; }
	.row.now {
		background: #fff7d0;
		outline: 2px solid #f5c100;
		font-weight: 700;
	}
	.kind-tag { font-size: 0.82rem; font-weight: 700; letter-spacing: 0.08em; }
	.row.k-work .kind-tag { color: #d12222; }
	.row.k-rest .kind-tag { color: #15806d; }
	.row.k-prep .kind-tag { color: #b56b00; }
	.dur { font-family: ui-monospace, monospace; font-weight: 600; color: #2d3748; font-size: 0.92rem; }
	.lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #15202b; }
	.note-row {
		grid-column: 2 / 4;
		font-size: 0.8rem;
		color: #5a6678;
		margin-top: 1px;
	}

	@media (max-width: 720px) {
		main { grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: 0.4rem; padding: 0.4rem; }
		.list { border-left: none; border-top: 1px solid #d8dde6; }
		.timer { gap: 0.25rem; padding: 0.25rem; }
		.topbar { gap: 0.4rem; flex-wrap: wrap; }
		.preset { font-size: 0.85rem; padding: 0.3rem 0.4rem; }
		.meta { font-size: 0.85rem; }
		.section { font-size: 0.95rem; margin-top: 0; }
		.kind { font-size: 1.4rem; margin-top: 0; }
		.note, .next { display: none; }
		.label { font-size: 1.1rem; padding: 0 0.4rem; }
		.ring { width: min(100%, 24vh); }
		.ring .track, .ring .prog { stroke-width: 12; }
		.seconds { font-size: clamp(2.4rem, 10vh, 4.5rem); }
		.controls { gap: 0.4rem; padding-bottom: 0.2rem; }
		button { font-size: 1rem; padding: 0.5rem 0.9rem; }
		button.primary { font-size: 1.1rem; min-width: 7rem; }
		.sensor-cards { gap: 0.3rem; padding: 0; }
		.card { padding: 0.35rem 0.2rem 0.3rem; border-top-width: 4px; border-width: 1.2px; }
		.card .v { font-size: 1.3rem; margin: 0.05rem 0; }
		.card .lbl { font-size: 0.7rem; }
		.card .u, .card .status { font-size: 0.6rem; }
	}
</style>
