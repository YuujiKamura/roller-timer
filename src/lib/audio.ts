// Web Audio。 タイマー音色は重ね合わせで「タイマーっぽさ」 を出す:
// - tick: square 短い、 ガード的なメトロノーム音
// - countdown: square 強め、 残 3 秒のカウントダウン
// - phase change: 2-3 音重ね + ハモリで明瞭な合図
// - done: 上昇 3 音 + 持続で「終わった」 感

let ctx: AudioContext | null = null;
let muted = false;
let masterVolume = 0.8;

function ensureCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

type Wave = 'sine' | 'square' | 'triangle' | 'sawtooth';

function tone(opts: {
	freq: number;
	durationMs: number;
	volume: number;
	wave?: Wave;
	startOffsetMs?: number;
	attackMs?: number;
	releaseMs?: number;
}) {
	if (muted) return;
	const c = ensureCtx();
	if (!c) return;
	const vol = Math.max(0, Math.min(1, opts.volume * masterVolume));
	if (vol <= 0) return;
	const osc = c.createOscillator();
	const gain = c.createGain();
	osc.type = opts.wave || 'square';
	osc.frequency.value = opts.freq;
	const t0 = c.currentTime + (opts.startOffsetMs || 0) / 1000;
	const attack = (opts.attackMs ?? 3) / 1000;
	const release = (opts.releaseMs ?? 30) / 1000;
	const sustainEnd = t0 + opts.durationMs / 1000;
	const t1 = sustainEnd + release;
	gain.gain.setValueAtTime(0.0001, t0);
	gain.gain.exponentialRampToValueAtTime(vol, t0 + attack);
	gain.gain.setValueAtTime(vol, sustainEnd);
	gain.gain.exponentialRampToValueAtTime(0.0001, t1);
	osc.connect(gain).connect(c.destination);
	osc.start(t0);
	osc.stop(t1 + 0.02);
}

export function beepTick() {
	tone({ freq: 1000, durationMs: 35, volume: 0.18, wave: 'square' });
}

export function beepCountdown() {
	tone({ freq: 1500, durationMs: 110, volume: 0.55, wave: 'square' });
	tone({ freq: 750, durationMs: 110, volume: 0.3, wave: 'triangle' });
}

export function beepPhaseChange(kind: 'work' | 'rest' | 'prep' | 'done' = 'work') {
	if (kind === 'work') {
		// 力強い 2 音アラート (ピロッ・ピー)
		tone({ freq: 1100, durationMs: 140, volume: 0.55, wave: 'square' });
		tone({ freq: 1650, durationMs: 140, volume: 0.35, wave: 'square' });
		tone({ freq: 1320, durationMs: 260, volume: 0.6, wave: 'square', startOffsetMs: 160 });
		tone({ freq: 1980, durationMs: 260, volume: 0.35, wave: 'triangle', startOffsetMs: 160 });
	} else if (kind === 'rest') {
		// 落ち着いた下降 2 音
		tone({ freq: 880, durationMs: 200, volume: 0.45, wave: 'triangle' });
		tone({ freq: 660, durationMs: 280, volume: 0.45, wave: 'triangle', startOffsetMs: 220 });
	} else if (kind === 'prep') {
		// 低めの予告音
		tone({ freq: 520, durationMs: 220, volume: 0.4, wave: 'triangle' });
		tone({ freq: 780, durationMs: 220, volume: 0.25, wave: 'triangle' });
	} else {
		// done: 上昇 3 音 + 持続
		tone({ freq: 660, durationMs: 180, volume: 0.5, wave: 'square' });
		tone({ freq: 880, durationMs: 180, volume: 0.5, wave: 'square', startOffsetMs: 220 });
		tone({ freq: 1320, durationMs: 500, volume: 0.55, wave: 'square', startOffsetMs: 440 });
		tone({ freq: 1980, durationMs: 500, volume: 0.3, wave: 'triangle', startOffsetMs: 440 });
	}
}

export function beepDone() {
	beepPhaseChange('done');
}

export function primeAudio() {
	ensureCtx();
}

export function setMuted(m: boolean) {
	muted = m;
}

export function isMuted() {
	return muted;
}

export function setMasterVolume(v: number) {
	masterVolume = Math.max(0, Math.min(1, v));
}

export function getMasterVolume() {
	return masterVolume;
}
