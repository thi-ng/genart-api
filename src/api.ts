export type NumOrString = number | string;
export type Maybe<T> = T | undefined;

export type RandomFn = () => number;

export interface GenArtAPI {
	readonly screen: ScreenConfig;
	readonly random: PRNG;

	setAdapter(adapter: PlatformAdapter): void;

	setParams(specs: ParamSpecs): void;
	getParams<T extends ParamSpecs>(t?: number): Promise<Maybe<ParamValues<T>>>;
	getParam<T extends ParamSpec<T>>(
		id: string,
		spec: T,
		time?: number
	): Promise<ParamValue<T>>;

	capture(): void;
}

export interface PlatformAdapter {
	readonly screen: ScreenConfig;
	readonly prng: PRNG;

	setParam<T extends ParamSpec<any>>(id: string, param: T): void;

	paramValue(
		id: string,
		param: ParamSpec<any>,
		time: number
	): Maybe<NumOrString>;
	capture(): void;
}

export interface ScreenConfig {
	width: number;
	height: number;
	dpr: number;
}

export interface PRNG {
	seed: string;
	rnd: () => number;
}

export interface ParamSpec<T> {
	type: string;
	doc: string;
	tooltip: string;
	default: T;
}

export interface ParamImpl<T> {
	eval(src: string, spec: ParamSpec<T>, t: number): T;
	randomize(rnd: RandomFn, spec: ParamSpec<T>): T;
	stringify(x: T, spec: ParamSpec<T>): string;
}

export interface Flag extends ParamSpec<boolean> {
	type: "flag";
}

export interface Color extends ParamSpec<string> {
	type: "color";
}

export interface Range extends ParamSpec<number> {
	type: "range";
	min: number;
	max: number;
	step: number;
}

export interface XY extends ParamSpec<[number, number]> {
	type: "xy";
}

export interface Choice extends ParamSpec<string> {
	type: "choice";
	choices: string[];
}

export interface WeightedChoice extends ParamSpec<string> {
	type: "weighted";
	choices: [string, number][];
}

export interface Ramp extends ParamSpec<number> {
	type: "ramp";
	stops: [number, number][];
}

export type ParamSpecs = Record<string, ParamSpec<any>>;

export type ParamValues<T extends ParamSpecs> = {
	[id in keyof T]: ParamValue<T[id]>;
};

export type ParamValue<T extends ParamSpec<any>> = T extends Flag
	? boolean
	: T extends Range | Ramp
	? number
	: T extends Color | Choice | WeightedChoice
	? string
	: any;
