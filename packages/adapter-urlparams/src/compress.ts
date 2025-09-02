const pipe = async (
	buf: BlobPart,
	stream: ReadableWritablePair<any, Uint8Array<ArrayBuffer>>
) =>
	new Uint8Array(
		await new Response(
			new Blob([buf]).stream().pipeThrough(stream)
		).arrayBuffer()
	);

export const compressBytes = (buf: BlobPart, fmt: CompressionFormat = "gzip") =>
	pipe(buf, new CompressionStream(fmt));

export const decompressBytes = (
	buf: BlobPart,
	fmt: CompressionFormat = "gzip"
) => pipe(buf, new DecompressionStream(fmt));
