export const isNumber = (x: any): x is number =>
	typeof x === "number" && !isNaN(x);

export const isString = (x: any): x is string => typeof x === "string";

export const illegalParam = (id: string): void =>
	console.warn("illegal param value/config for:", id);
