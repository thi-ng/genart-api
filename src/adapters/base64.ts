export const base64Encode = (
	src: number[] | Uint8Array | Uint8ClampedArray | Uint32Array
) => {
	const buf = Array.isArray(src)
		? src
		: new Uint8Array(src.buffer, src.byteOffset, src.byteLength);
	return btoa(String.fromCharCode(...buf));
};

export const base64Decode = (src: string) =>
	new Uint8Array([...atob(src)].map((x) => x.charCodeAt(0)));
