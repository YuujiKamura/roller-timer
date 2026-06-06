<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { TimerState, findPhaseSection } from '$lib/timer.svelte';
	import { presets, findPresetById } from '$lib/presets/index';
	import { fmtMmSs } from '$lib/types';
	import { beepCountdown, beepDone, beepPhaseChange, beepTick, isMuted, primeAudio, setMuted } from '$lib/audio';

	const STORAGE_PRESET = 'tabata.preset';
	const STORAGE_MUTE = 'tabata.muted';

	const timer = new TimerState(presets[0]);
	let presetId = $state(presets[0].id);
	let muted = $state(false);

	timer.onTick = (t) => {
		if (t.remaining > 0 && t.remaining <= 3) beepCountdown();
		else if (t.remaining > 3) beepTick();
	};
	timer.onPhaseChange = (_prev, next) => {
		if (next) beepPhaseChange(next.kind);
	};
	timer.onDone = () => beepDone();

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
		if (timer.status === 'paused') timer.resume();
		else if (timer.status === 'done') {
			timer.reset();
			timer.start();
		} else timer.start();
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
		} else if (e.key === 'r' || e.key === 'R') timer.reset();
		else if (e.key === 'n' || e.key === 'N') timer.skip();
	}

	onMount(() => {
		document.addEventListener('keydown', onKey);
		try {
			const savedId = localStorage.getItem(STORAGE_PRESET);
			if (savedId) selectPreset(savedId);
			const savedMute = localStorage.getItem(STORAGE_MUTE);
			if (savedMute === '1') { muted = true; setMuted(true); }
		} catch { /* ignore */ }
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
	<title>Tabata Timer — ZENKO 鬼特訓</title>
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
			<button onclick={() => timer.skip()}>スキップ</button>
			<button onclick={() => timer.reset()}>リセット</button>
		</div>
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
		background: #111;
		color: #eee;
		font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
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
		transition: background 0.4s;
	}
	main.k-work { background: linear-gradient(180deg, #2a0808, #111 60%); }
	main.k-rest { background: linear-gradient(180deg, #062623, #111 60%); }
	main.k-prep { background: linear-gradient(180deg, #2a1800, #111 60%); }
	main.k-done { background: #111; }

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
		max-width: 22rem;
		background: #1a1a1a;
		color: #eee;
		border: 1px solid #444;
		border-radius: 8px;
		padding: 0.45rem 0.6rem;
		font-size: 0.95rem;
		cursor: pointer;
	}
	.preset-select:disabled { opacity: 0.5; cursor: not-allowed; }
	.mute {
		font-size: 1.1rem;
		padding: 0.4rem 0.7rem;
		min-width: 0;
	}
	.meta {
		text-align: center;
		opacity: 0.75;
	}
	.section { font-size: 0.95rem; margin-top: 0.15rem; }

	.kind {
		font-size: clamp(2rem, 5vw, 3rem);
		font-weight: 800;
		letter-spacing: 0.15em;
		margin-top: 0.25rem;
	}
	main.k-work .kind { color: #ff5a5a; }
	main.k-rest .kind { color: #4ee2c8; }
	main.k-prep .kind { color: #ffb266; }
	main.k-done .kind { color: #888; }

	.label { font-size: 1.4rem; font-weight: 600; text-align: center; padding: 0 1rem; }
	.note { font-size: 0.95rem; opacity: 0.7; text-align: center; padding: 0 1rem; max-width: 36ch; }

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
	.ring .track { fill: none; stroke: #1f1f1f; stroke-width: 14; }
	.ring .prog {
		fill: none;
		stroke-width: 14;
		stroke-linecap: round;
		transition: stroke-dashoffset 0.95s linear, stroke 0.4s;
	}
	main.k-work .ring .prog { stroke: #ff5a5a; }
	main.k-rest .ring .prog { stroke: #4ee2c8; }
	main.k-prep .ring .prog { stroke: #ffb266; }
	main.k-done .ring .prog { stroke: #555; }

	.seconds {
		position: absolute;
		font-family: ui-monospace, 'SF Mono', Consolas, monospace;
		font-size: clamp(4rem, 18vh, 12rem);
		font-weight: 800;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.next {
		font-size: 0.95rem;
		opacity: 0.6;
		text-align: center;
		padding: 0 1rem;
	}

	.controls {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		justify-content: center;
		padding-bottom: 0.5rem;
	}
	button {
		font-size: 1.1rem;
		padding: 0.85rem 1.6rem;
		border-radius: 12px;
		border: 1px solid #444;
		background: #1a1a1a;
		color: #eee;
		cursor: pointer;
		transition: transform 0.05s, background 0.15s;
	}
	button:hover { background: #2a2a2a; }
	button:active { transform: scale(0.97); }
	button.primary {
		background: #d33;
		border-color: #d33;
		color: #fff;
		font-weight: 700;
		min-width: 8rem;
	}

	.list {
		overflow-y: auto;
		padding: 0.5rem 0.75rem 2rem;
		border-left: 1px solid #222;
		min-height: 0;
	}
	.list h2 {
		margin: 0 0 0.75rem;
		font-size: 1.05rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #aaa;
	}
	.section-block { margin-bottom: 1rem; }
	.section-block h3 {
		margin: 0 0 0.4rem;
		font-size: 0.9rem;
		color: #d6c34a;
		text-transform: none;
		letter-spacing: 0;
	}
	ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
	.row {
		display: grid;
		grid-template-columns: 50px 60px 1fr;
		grid-template-rows: auto auto;
		align-items: center;
		gap: 0 0.5rem;
		padding: 0.45rem 0.6rem;
		border-radius: 8px;
		background: #181818;
		border-left: 4px solid #333;
		font-size: 0.92rem;
	}
	.row.k-work { border-left-color: #d33; }
	.row.k-rest { border-left-color: #2a9; }
	.row.k-prep { border-left-color: #e80; }
	.row.past { opacity: 0.35; }
	.row.now {
		background: #2a2a2a;
		outline: 2px solid #d6c34a;
		font-weight: 600;
	}
	.kind-tag { font-size: 0.78rem; letter-spacing: 0.1em; opacity: 0.85; }
	.row.k-work .kind-tag { color: #ff8080; }
	.row.k-rest .kind-tag { color: #6cebd0; }
	.row.k-prep .kind-tag { color: #ffba75; }
	.dur { font-family: ui-monospace, monospace; opacity: 0.8; }
	.lbl { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.note-row {
		grid-column: 2 / 4;
		font-size: 0.78rem;
		opacity: 0.55;
		margin-top: 2px;
	}

	@media (max-width: 720px) {
		main { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; }
		.list { border-left: none; border-top: 1px solid #222; }
		.ring { width: min(100%, 38vh); }
		.seconds { font-size: clamp(3rem, 14vh, 8rem); }
	}
</style>
