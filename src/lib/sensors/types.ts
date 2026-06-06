export type SensorSample = {
	tMs: number;
	powerW?: number;
	cadenceRpm?: number;
	hrBpm?: number;
	speedKmh?: number;
};

export type SensorState = {
	powerW?: number;
	cadenceRpm?: number;
	hrBpm?: number;
	speedKmh?: number;
	lastUpdateMs?: number;
};

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

export type SensorKind = 'hr' | 'power' | 'ftms';
