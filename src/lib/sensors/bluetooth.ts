// Web Bluetooth クライアント。 fujihc-trainer web/lib/ble_client.js をローラータイマー用に
// 簡素化したもの (viewer dispatch interface を廃し、 store を直接更新)。
// FTMS handshake / HRM notify / auto reconnect の core はそのまま使う。

import { parseHeartRate, parseIndoorBikeData, parseControlResponse } from './ftms_parse';
import { sensorStore } from './store.svelte';

const FTMS_SERVICE = 0x1826;
const INDOOR_BIKE_DATA_CHAR = 0x2ad2;
const CONTROL_POINT_CHAR = 0x2ad9;
const HEART_RATE_SERVICE = 0x180d;
const HEART_RATE_MEASUREMENT_CHAR = 0x2a37;

const FTMS_OP_REQUEST_CONTROL = 0x00;
const FTMS_OP_RESET = 0x01;

const LS_KEY_FTMS = 'roller.lastFtmsDeviceId';
const LS_KEY_HRM = 'roller.lastHrmDeviceId';

type BTDevice = BluetoothDevice;
type BTServer = BluetoothRemoteGATTServer;
type BTChar = BluetoothRemoteGATTCharacteristic;

const state: {
	ftmsDevice: BTDevice | null;
	ftmsServer: BTServer | null;
	indoorBikeChar: BTChar | null;
	controlPointChar: BTChar | null;
	indoorBikeListener: ((e: Event) => void) | null;
	controlPointListener: ((e: Event) => void) | null;
	ftmsDisconnectListener: (() => void) | null;
	hrmDevice: BTDevice | null;
	hrmServer: BTServer | null;
	hrmChar: BTChar | null;
	hrmListener: ((e: Event) => void) | null;
	hrmDisconnectListener: (() => void) | null;
} = {
	ftmsDevice: null,
	ftmsServer: null,
	indoorBikeChar: null,
	controlPointChar: null,
	indoorBikeListener: null,
	controlPointListener: null,
	ftmsDisconnectListener: null,
	hrmDevice: null,
	hrmServer: null,
	hrmChar: null,
	hrmListener: null,
	hrmDisconnectListener: null
};

export function isWebBluetoothSupported(): boolean {
	return typeof navigator !== 'undefined' && !!navigator.bluetooth && typeof navigator.bluetooth.requestDevice === 'function';
}

function errMsg(err: unknown): string {
	if (!err) return 'unknown error';
	if (typeof err === 'string') return err;
	if (err instanceof Error) return err.message;
	return String(err);
}

async function writeControlPoint(bytes: Uint8Array): Promise<boolean> {
	const ch = state.controlPointChar;
	if (!ch) return false;
	try {
		if (typeof ch.writeValueWithResponse === 'function') {
			await ch.writeValueWithResponse(bytes);
			return true;
		}
		if (typeof ch.writeValue === 'function') {
			await ch.writeValue(bytes);
			return true;
		}
	} catch {
		try {
			if (typeof ch.writeValueWithoutResponse === 'function') {
				await ch.writeValueWithoutResponse(bytes);
				return true;
			}
		} catch {
			/* both failed */
		}
	}
	return false;
}

async function connectFtmsWithDevice(device: BTDevice): Promise<void> {
	state.ftmsDevice = device;
	try {
		if (device.id) localStorage.setItem(LS_KEY_FTMS, device.id);
	} catch {
		/* quota / privacy */
	}

	state.ftmsDisconnectListener = () => {
		sensorStore.ftmsStatus = 'idle';
		sensorStore.lastError = 'トレーナーが切断されました';
	};
	device.addEventListener('gattserverdisconnected', state.ftmsDisconnectListener);

	try {
		if (!device.gatt) throw new Error('GATT 利用不可');
		state.ftmsServer = await device.gatt.connect();
		const service = await state.ftmsServer.getPrimaryService(FTMS_SERVICE);
		state.indoorBikeChar = await service.getCharacteristic(INDOOR_BIKE_DATA_CHAR);
		state.controlPointChar = await service.getCharacteristic(CONTROL_POINT_CHAR);
	} catch (err) {
		sensorStore.ftmsStatus = 'error';
		sensorStore.lastError = errMsg(err);
		return;
	}

	state.indoorBikeListener = (event: Event) => {
		const target = event.target as BTChar | null;
		const view = target?.value;
		if (!view) return;
		const parsed = parseIndoorBikeData(view);
		sensorStore.updateFromIndoorBike(parsed);
	};
	try {
		await state.indoorBikeChar.startNotifications();
		state.indoorBikeChar.addEventListener('characteristicvaluechanged', state.indoorBikeListener);
	} catch (err) {
		sensorStore.ftmsStatus = 'error';
		sensorStore.lastError = `indoor bike notify failed: ${errMsg(err)}`;
		return;
	}

	state.controlPointListener = (event: Event) => {
		const target = event.target as BTChar | null;
		const view = target?.value;
		if (!view) return;
		parseControlResponse(view);
	};
	try {
		await state.controlPointChar.startNotifications();
		state.controlPointChar.addEventListener('characteristicvaluechanged', state.controlPointListener);
	} catch {
		/* indication 無し機器は無視 */
	}

	for (const opcode of [FTMS_OP_REQUEST_CONTROL, FTMS_OP_RESET]) {
		await writeControlPoint(new Uint8Array([opcode]));
	}

	sensorStore.ftmsStatus = 'connected';
	sensorStore.ftmsDeviceName = device.name || device.id || 'FTMS device';
	sensorStore.lastError = undefined;
}

export async function connectFtms(): Promise<void> {
	if (!isWebBluetoothSupported()) {
		sensorStore.ftmsStatus = 'error';
		sensorStore.lastError = 'このブラウザは Web Bluetooth 非対応 (iOS Safari/Firefox は不可)';
		return;
	}
	sensorStore.ftmsStatus = 'connecting';
	let device: BTDevice;
	try {
		device = await navigator.bluetooth.requestDevice({
			filters: [{ services: [FTMS_SERVICE] }],
			optionalServices: [FTMS_SERVICE]
		});
	} catch (err) {
		sensorStore.ftmsStatus = 'idle';
		sensorStore.lastError = errMsg(err);
		return;
	}
	await connectFtmsWithDevice(device);
}

async function connectHrmWithDevice(device: BTDevice): Promise<void> {
	state.hrmDevice = device;
	try {
		if (device.id) localStorage.setItem(LS_KEY_HRM, device.id);
	} catch {
		/* ignore */
	}
	state.hrmDisconnectListener = () => {
		sensorStore.hrStatus = 'idle';
	};
	device.addEventListener('gattserverdisconnected', state.hrmDisconnectListener);

	try {
		if (!device.gatt) throw new Error('GATT 利用不可');
		state.hrmServer = await device.gatt.connect();
		const service = await state.hrmServer.getPrimaryService(HEART_RATE_SERVICE);
		state.hrmChar = await service.getCharacteristic(HEART_RATE_MEASUREMENT_CHAR);
	} catch (err) {
		sensorStore.hrStatus = 'error';
		sensorStore.lastError = errMsg(err);
		return;
	}

	state.hrmListener = (event: Event) => {
		const target = event.target as BTChar | null;
		const view = target?.value;
		if (!view) return;
		const parsed = parseHeartRate(view);
		sensorStore.updateFromHeartRate(parsed);
	};
	try {
		await state.hrmChar.startNotifications();
		state.hrmChar.addEventListener('characteristicvaluechanged', state.hrmListener);
	} catch (err) {
		sensorStore.hrStatus = 'error';
		sensorStore.lastError = errMsg(err);
		return;
	}

	sensorStore.hrStatus = 'connected';
	sensorStore.hrDeviceName = device.name || device.id || 'HR sensor';
}

export async function connectHrm(): Promise<void> {
	if (!isWebBluetoothSupported()) {
		sensorStore.hrStatus = 'error';
		sensorStore.lastError = 'このブラウザは Web Bluetooth 非対応';
		return;
	}
	sensorStore.hrStatus = 'connecting';
	let device: BTDevice;
	try {
		device = await navigator.bluetooth.requestDevice({
			filters: [{ services: [HEART_RATE_SERVICE] }],
			optionalServices: [HEART_RATE_SERVICE]
		});
	} catch (err) {
		sensorStore.hrStatus = 'idle';
		sensorStore.lastError = errMsg(err);
		return;
	}
	await connectHrmWithDevice(device);
}

export function disconnectFtms(): void {
	if (state.indoorBikeChar && state.indoorBikeListener) {
		try { state.indoorBikeChar.removeEventListener('characteristicvaluechanged', state.indoorBikeListener); } catch { /* */ }
	}
	if (state.controlPointChar && state.controlPointListener) {
		try { state.controlPointChar.removeEventListener('characteristicvaluechanged', state.controlPointListener); } catch { /* */ }
	}
	if (state.ftmsDevice && state.ftmsDisconnectListener) {
		try { state.ftmsDevice.removeEventListener('gattserverdisconnected', state.ftmsDisconnectListener); } catch { /* */ }
	}
	try { state.ftmsServer?.disconnect(); } catch { /* */ }
	state.ftmsServer = null;
	state.indoorBikeChar = null;
	state.controlPointChar = null;
	state.ftmsDevice = null;
	state.indoorBikeListener = null;
	state.controlPointListener = null;
	state.ftmsDisconnectListener = null;
	sensorStore.resetFtms();
}

export function disconnectHrm(): void {
	if (state.hrmChar && state.hrmListener) {
		try { state.hrmChar.removeEventListener('characteristicvaluechanged', state.hrmListener); } catch { /* */ }
	}
	if (state.hrmDevice && state.hrmDisconnectListener) {
		try { state.hrmDevice.removeEventListener('gattserverdisconnected', state.hrmDisconnectListener); } catch { /* */ }
	}
	try { state.hrmServer?.disconnect(); } catch { /* */ }
	state.hrmServer = null;
	state.hrmChar = null;
	state.hrmDevice = null;
	state.hrmListener = null;
	state.hrmDisconnectListener = null;
	sensorStore.resetHr();
}

export async function tryAutoReconnect(): Promise<void> {
	if (!isWebBluetoothSupported() || typeof navigator.bluetooth.getDevices !== 'function') return;
	let savedFtms: string | null = null;
	let savedHrm: string | null = null;
	try {
		savedFtms = localStorage.getItem(LS_KEY_FTMS);
		savedHrm = localStorage.getItem(LS_KEY_HRM);
	} catch {
		return;
	}
	let devices: BTDevice[] = [];
	try {
		devices = await navigator.bluetooth.getDevices();
	} catch {
		return;
	}
	if (savedFtms) {
		const t = devices.find((d) => d.id === savedFtms);
		if (t) {
			sensorStore.ftmsStatus = 'connecting';
			try { await connectFtmsWithDevice(t); } catch { /* silent */ }
		}
	}
	if (savedHrm) {
		const t = devices.find((d) => d.id === savedHrm);
		if (t) {
			sensorStore.hrStatus = 'connecting';
			try { await connectHrmWithDevice(t); } catch { /* silent */ }
		}
	}
}
