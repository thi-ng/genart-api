import type { NestedParam, NestedParamSpecs } from "./params.js";
import type { ScreenConfig } from "./screen.js";
import type { APIState } from "./state.js";
import type { Traits } from "./traits.js";

export interface APIMessage {
	type: MessageType;
	/**
	 * ID of the {@link GenArtAPI} instance this message is intended for. Also
	 * see {@link GenArtAPI.id}.
	 */
	apiID: string;
	/** @internal */
	__self?: boolean;
}

export interface SetTraitsMsg extends APIMessage {
	type: "genart:settraits";
	traits: Traits;
}

export interface SetParamsMsg extends APIMessage {
	type: "genart:setparams";
	params: NestedParamSpecs;
}

export interface SetParamValueMsg extends APIMessage {
	type: "genart:setparamvalue";
	paramID: string;
	key?: string;
	value: any;
}

export interface RandomizeParamMsg extends APIMessage {
	type: "genart:randomizeparam";
	paramID: string;
	/**
	 * Optional. The property in the param spec which has been randomized (only
	 * used if the param is a composite, i.e. has nested params)
	 */
	key?: string;
}

export interface ParamChangeMsg extends APIMessage {
	type: "genart:paramchange";
	param: NestedParam;
	paramID: string;
	/**
	 * Optional. The property in the param spec which has been randomized (only
	 * used if the param is a composite, i.e. has nested params)
	 */
	key?: string;
}

export interface ParamErrorMsg extends APIMessage {
	type: "genart:paramerror";
	paramID: string;
	error?: string;
}

export interface StateChangeMsg extends APIMessage {
	type: "genart:statechange";
	/**
	 * New API state
	 */
	state: APIState;
	/**
	 * Optional additional information (e.g. error message)
	 */
	info?: string;
}

/**
 * Message triggered by the platform adapter when a screen configuration change
 * occurred and the artwork (or 3rd party tooling) shoyld respond/adapt to these
 * new dimensions provided.
 */
export interface ResizeMsg extends APIMessage {
	type: "genart:resize";
	/**
	 * New screen/canvas configuration
	 */
	screen: ScreenConfig;
}

/**
 * LUT mapping message types (names) to their respective type of API message.
 * Used for type checking/inference in {@link GenArtAPI.on}.
 */
export interface MessageTypeMap {
	"genart:setparams": SetParamsMsg;
	"genart:setparamvalue": SetParamValueMsg;
	"genart:settraits": SetTraitsMsg;
	"genart:randomizeparam": RandomizeParamMsg;
	"genart:paramchange": ParamChangeMsg;
	"genart:paramerror": ParamErrorMsg;
	"genart:statechange": StateChangeMsg;
	"genart:resize": ResizeMsg;
	"genart:start": APIMessage;
	"genart:resume": APIMessage;
	"genart:stop": APIMessage;
	"genart:capture": APIMessage;
	"genart:capturerequest": APIMessage;
}

/**
 * All known message types/names
 */
export type MessageType = keyof MessageTypeMap;

/**
 * Message notification types:
 *
 * - `all`: message sent to same and parent (if different)
 * - `none`: message will NOT be sent
 * - `parent`: message only sent to parent window (if different present)
 * - `self`: message only sent to same window/iframe
 */
export type NotifyType = "all" | "none" | "parent" | "self";
