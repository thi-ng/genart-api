import type { TypedArray } from "../api.js";

const pipe = async (
	buf: TypedArray,
	stream: ReadableWritablePair<any, Uint8Array>
) =>
	new Uint8Array(
		await new Response(
			new Blob([buf]).stream().pipeThrough(stream)
		).arrayBuffer()
	);

export const compressBytes = (
	buf: TypedArray,
	fmt: CompressionFormat = "gzip"
) => pipe(buf, new CompressionStream(fmt));

export const decompressBytes = async (
	buf: Uint8Array,
	fmt: CompressionFormat = "gzip"
) => pipe(buf, new DecompressionStream(fmt));
