// FTMS / HRM binary parser を JS から TS へ移植 (元: fujihc-trainer web/lib/ftms_parse.js)。
// pure 関数群、 DOM 依存ゼロ、 little-endian DataView ベース。

export type HeartRateParsed = { hr_bpm?: number };
export type IndoorBikeParsed = {
	speed_mps?: number;
	cadence_rpm?: number;
	distance_m?: number;
	power_w?: number;
};
export type ControlResponseParsed = { req_op: number; result: number; result_name: string };

type BinaryInput = DataView | Uint8Array | ArrayBuffer | { buffer: ArrayBufferLike; byteLength: number; byteOffset?: number };

function asDataView(input: BinaryInput | null | undefined): DataView | null {
	if (!input) return null;
	if (input instanceof DataView) return input;
	if (input instanceof Uint8Array) return new DataView(input.buffer, input.byteOffset, input.byteLength);
	if (input instanceof ArrayBuffer) return new DataView(input);
	const v = input as { buffer: ArrayBufferLike; byteLength: number; byteOffset?: number };
	if (v.buffer && typeof v.byteLength === 'number') {
		return new DataView(v.buffer, v.byteOffset || 0, v.byteLength);
	}
	return null;
}

export function parseHeartRate(input: BinaryInput): HeartRateParsed {
	const view = asDataView(input);
	if (!view || view.byteLength < 1) return {};
	const flags = view.getUint8(0);
	let offset = 1;
	const out: HeartRateParsed = {};
	if (flags & 0x01) {
		if (view.byteLength >= offset + 2) {
			out.hr_bpm = view.getUint16(offset, true);
		}
	} else if (view.byteLength >= offset + 1) {
		out.hr_bpm = view.getUint8(offset);
	}
	return out;
}

export function parseIndoorBikeData(input: BinaryInput): IndoorBikeParsed {
	const view = asDataView(input);
	if (!view || view.byteLength < 2) return {};
	const flags = view.getUint16(0, true);
	let offset = 2;
	const out: IndoorBikeParsed = {};

	const moreData = !!(flags & 0x0001);
	if (!moreData && view.byteLength >= offset + 2) {
		const raw = view.getUint16(offset, true);
		offset += 2;
		const speed_kmh = raw / 100.0;
		out.speed_mps = speed_kmh / 3.6;
	}
	if ((flags & 0x0002) && view.byteLength >= offset + 2) offset += 2;
	if ((flags & 0x0004) && view.byteLength >= offset + 2) {
		const raw = view.getUint16(offset, true);
		offset += 2;
		out.cadence_rpm = raw * 0.5;
	}
	if ((flags & 0x0008) && view.byteLength >= offset + 2) offset += 2;
	if ((flags & 0x0010) && view.byteLength >= offset + 3) {
		const b0 = view.getUint8(offset);
		const b1 = view.getUint8(offset + 1);
		const b2 = view.getUint8(offset + 2);
		offset += 3;
		out.distance_m = b0 | (b1 << 8) | (b2 << 16);
	}
	if ((flags & 0x0020) && view.byteLength >= offset + 2) offset += 2;
	if ((flags & 0x0040) && view.byteLength >= offset + 2) {
		out.power_w = view.getInt16(offset, true);
	}
	return out;
}

export function parseControlResponse(input: BinaryInput): ControlResponseParsed | null {
	const view = asDataView(input);
	if (!view || view.byteLength < 3) return null;
	if (view.getUint8(0) !== 0x80) return null;
	const req_op = view.getUint8(1);
	const result = view.getUint8(2);
	const names: Record<number, string> = {
		0x01: 'OK',
		0x02: 'Op-Not-Supported',
		0x03: 'Invalid-Parameter',
		0x04: 'Operation-Failed',
		0x05: 'Control-Not-Permitted'
	};
	const result_name = names[result] || `Result=0x${result.toString(16).padStart(2, '0').toUpperCase()}`;
	return { req_op, result, result_name };
}
