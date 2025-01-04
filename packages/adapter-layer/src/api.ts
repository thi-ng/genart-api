// from: https://www.notion.so/Generative-Specifications-766560b60a6a444182c041c923b5aa8d
export interface LayerParamChangeEvent extends CustomEvent {
	detail: {
		id: string;
		value: boolean | string | number | ColorResult;
	};
}

export type LayerEvent =
	| "layer:play" // Signals that the piece should start playing
	| "layer:pause" // Signals that the piece should stop playing
	| "layer:reset" // Signals that the piece should start over for playback
	| "layer:preview" // Signals that a 10s preview should be recorded for the current parameters
	| "layer:parameters" // Signals update to one or more parameters in studio
	| "layer:paramchange"; // Signals update to one parameter in studio

export type ParameterOption = {
	value: string;
	label?: string;
};

export type Parameter =
	| NumberParameter
	| BooleanParameter
	| ColorParameter
	| ListParameter
	| HashParameter;

export type BaseParameter = {
	// used to identify the parameter field, e.g. $layer.parameters[parameter.id]
	id: string;
	// The text displayed to the user for this parameter
	name: string;
	// Determines the inputs and outputs of the parameter
	kind: "NUMBER" | "BOOLEAN" | "COLOR" | "LIST" | "HASH";
	// Displayed as a tooltip for aiding a user in understanding
	// the application of the parameter’s value
	description?: string;
	// Determines which group of users has access to set custom values
	// for this parameter. defaults to VIEWER
	customization_level?: "ARTIST" | "CURATOR" | "VIEWER";
	// default value
	default?: any;
};

export type ColorParameter = BaseParameter & {
	kind: "COLOR";
	// A HEX color string, pattern: /^#[A-Fa-f0-9]{6}$/, default #FFFFFF
	default?: string;
};

export type BooleanParameter = BaseParameter & {
	kind: "BOOLEAN";
	default?: boolean;
};

export type NumberParameter = BaseParameter & {
	kind: "NUMBER";
	min?: number | string; // default 0
	max?: number | string; // default 100
	step?: number | string; // default 1
	default?: number | string;
};

export type ListParameter = BaseParameter & {
	kind: "LIST";
	options: Array<ParameterOption | string>;
	default?: string;
};

export type HashParameter = BaseParameter & {
	kind: "HASH";
	default?: string;
	minLength?: number;
	maxLength?: number;
	pattern?: "BASE64" | "HEX" | "ALPHABETICAL" | "ALPHANUMERIC";
};

export interface ColorResult {
	readonly rgb: [number, number, number] | null;
	readonly hsl: [number, number, number] | null;
	readonly hex: string | null;
}

export type LayerSDK = {
	// Setter version of registerCanvas
	canvas: HTMLCanvasElement | null;

	// Turn on 'layer:preview' events
	previewEnabled: boolean;

	// Debug mode
	debug: boolean;

	// A UUID that is unique to this version of the parameters
	readonly uuid: string;
	// Canvas size
	readonly width: number;
	readonly height: number;

	// a randomly generated float seeded with the UUID
	readonly prng: () => number;

	// This value indicates that the parent platform intends
	// to send events that notify the art when to pause, play, or reset.
	// This feature improves the experience for users that have the
	// ability to configure parameters and create variations.
	// When this value is false, the art should play automatically
	// and only reset when reloaded.
	readonly controlled: boolean;

	// A dictionary of field/value pairs that correspond to the .id
	// property of the parameters defined by $layer.params(...entries)
	// and either the default value of that property or the value passed
	// from the parent platform.
	readonly parameters: Readonly<
		Record<string, boolean | string | number | ColorResult>
	>;

	// Define one or more parameters using the Parameter schema.
	// Resolves to the initialized value of the parameters.
	params(...params: Parameter[]): Promise<LayerSDK["parameters"]>;

	// supply the parent platform with a generated video with MIME video/mp4
	// optionally, supply a thumbnail image also, otherwise the first frame of
	// the video will be captured as the thumbnail
	preview(video: Blob, thumbnail?: Blob): LayerSDK;

	// Register a canvas element that can be used tell the LayerSDK
	// where to capture a screenshot. Layer will call toDataUrl() on
	// the canvas when triggered by the parent platform.
	registerCanvas(canvasElement: HTMLCanvasElement): LayerSDK;

	// show FPS overlay
	startFPSOverlay(targetFPS?: number, fill?: boolean): LayerSDK;
	// remopve FPS Overlay
	stopFPSOverlay(): LayerSDK;
};
