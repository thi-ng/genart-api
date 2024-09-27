const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

export const base64Encode = (
	src: number[] | Uint8Array | Uint8ClampedArray | Uint32Array
) => {
	const buf = Array.isArray(src)
		? new Uint8Array(src)
		: new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
	const n = buf.length;
	const n3 = ((n / 3) | 0) * 3;
	const enc1 = (x: number) => B64[(x >> 18) & 0x3f] + B64[(x >> 12) & 0x3f];
	const enc2 = (x: number) => enc1(x) + B64[(x >> 6) & 0x3f];
	let result = "";
	for (let i = 0; i < n3; i += 3) {
		const x = (buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2];
		result += enc2(x) + B64[x & 0x3f];
	}
	result +=
		n - n3 === 1
			? enc1(buf[n - 1] << 16) + "=="
			: n - n3 === 2
			? enc2((buf[n - 2] << 16) | (buf[n - 1] << 8)) + "="
			: "";
	return result;
};

export const base64Decode = (src: string) => {
	const match = /=*$/.exec(src);
	const num = src.length - (match?.[0].length ?? 0);
	const result = new Uint8Array((num / 4) * 3);
	let value = 0;
	for (let i = 0, j = 0; i < num; ) {
		const x = B64.indexOf(src[i]);
		value = i & 3 ? (value << 6) + x : x;
		if (i++ & 3) result[j++] = 255 & (value >> ((-2 * i) & 6));
	}
	return result;
};
