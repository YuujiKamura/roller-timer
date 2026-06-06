import type { ConnectionStatus, SensorState } from './types';

class SensorStore {
	power: SensorState = $state({});
	hr: SensorState = $state({});
	ftmsStatus: ConnectionStatus = $state('idle');
	hrStatus: ConnectionStatus = $state('idle');
	ftmsDeviceName = $state<string | undefined>(undefined);
	hrDeviceName = $state<string | undefined>(undefined);
	lastError = $state<string | undefined>(undefined);

	updateFromIndoorBike(p: { power_w?: number; cadence_rpm?: number; speed_mps?: number }) {
		if (typeof p.power_w === 'number') this.power.powerW = p.power_w;
		if (typeof p.cadence_rpm === 'number') this.power.cadenceRpm = p.cadence_rpm;
		if (typeof p.speed_mps === 'number') this.power.speedKmh = p.speed_mps * 3.6;
		this.power.lastUpdateMs = Date.now();
	}

	updateFromHeartRate(p: { hr_bpm?: number }) {
		if (typeof p.hr_bpm === 'number') {
			this.hr.hrBpm = p.hr_bpm;
			this.hr.lastUpdateMs = Date.now();
		}
	}

	resetFtms() {
		this.power = {};
		this.ftmsStatus = 'idle';
		this.ftmsDeviceName = undefined;
	}

	resetHr() {
		this.hr = {};
		this.hrStatus = 'idle';
		this.hrDeviceName = undefined;
	}
}

export const sensorStore = new SensorStore();
