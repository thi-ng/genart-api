export const isNumber = (x: any): x is number =>
	typeof x === "number" && !isNaN(x);

export const isString = (x: any): x is string => typeof x === "string";

export const illegalParam = (id: string): void =>
	console.warn("illegal param value/config for:", id);

export const u8 = (x: number) => (
	(x &= 0xff), (x < 16 ? "0" : "") + x.toString(16)
);

export const u16 = (x: number) => ((x &= 0xffff), u8(x >>> 8) + u8(x & 0xff));

export const u24 = (x: number) => (
	(x &= 0xffffff), u16(x >>> 8) + u8(x & 0xff)
);

export const u32 = (x: number) => u16(x >>> 16) + u16(x & 0xfffff);
