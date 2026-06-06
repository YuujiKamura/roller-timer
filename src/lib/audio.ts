let ctx: AudioContext | null = null;
let muted = false;

function ensureCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

function beep(freq: number, durationMs: number, volume = 0.2) {
	if (muted) return;
	const c = ensureCtx();
	if (!c) return;
	const osc = c.createOscillator();
	const gain = c.createGain();
	osc.type = 'sine';
	osc.frequency.value = freq;
	const t0 = c.currentTime;
	const t1 = t0 + durationMs / 1000;
	gain.gain.setValueAtTime(volume, t0);
	gain.gain.exponentialRampToValueAtTime(0.0001, t1);
	osc.connect(gain).connect(c.destination);
	osc.start(t0);
	osc.stop(t1 + 0.02);
}

export function beepTick() {
	beep(600, 35, 0.08);
}

export function beepPhaseChange(kind: 'work' | 'rest' | 'prep' | 'done' = 'work') {
	if (kind === 'work') {
		beep(1100, 180, 0.3);
		setTimeout(() => beep(1400, 220, 0.3), 200);
	} else if (kind === 'rest') {
		beep(660, 250, 0.25);
	} else if (kind === 'prep') {
		beep(520, 200, 0.2);
	} else {
		beep(660, 200, 0.3);
		setTimeout(() => beep(880, 200, 0.3), 250);
		setTimeout(() => beep(1100, 400, 0.3), 500);
	}
}

export function beepCountdown() {
	beep(880, 120, 0.25);
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
