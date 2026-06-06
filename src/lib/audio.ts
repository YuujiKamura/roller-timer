let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
	if (typeof window === 'undefined') return null;
	if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
	if (ctx.state === 'suspended') void ctx.resume();
	return ctx;
}

function beep(freq: number, durationMs: number, volume = 0.2) {
	const c = ensureCtx();
	if (!c) return;
	const osc = c.createOscillator();
	const gain = c.createGain();
	osc.type = 'sine';
	osc.frequency.value = freq;
	gain.gain.value = volume;
	osc.connect(gain).connect(c.destination);
	osc.start();
	osc.stop(c.currentTime + durationMs / 1000);
}

export function beepPhaseChange() {
	beep(880, 250);
}

export function beepCountdown() {
	beep(440, 80);
}

export function beepDone() {
	beep(660, 200);
	setTimeout(() => beep(880, 200), 250);
	setTimeout(() => beep(1100, 400), 500);
}

export function primeAudio() {
	ensureCtx();
}
