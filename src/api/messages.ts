import type { NestedParam, NestedParamSpecs } from "./params.js";
import type { ScreenConfig } from "./screen.js";
import type { APIState } from "./state.js";
import type { Traits } from "./traits.js";

/**
 * Base message type for all {@link GenArtAPI}-related messages sent/received.
 */
export interface APIMessage {
	/**
	 * Message type (always prefixed with `genart:`)
	 */
	type: MessageType;
	/**
	 * ID of the {@link GenArtAPI} instance this message is intended for. Also
	 * see {@link GenArtAPI.id}.
	 */
	apiID: string;
	/** @internal */
	__self?: boolean;
}

/**
 * Message type emitted by {@link GenArtAPI.setTraits} to inform external
 * tooling about artwork defined {@link Traits}.
 */
export interface SetTraitsMsg extends APIMessage {
	type: "genart:settraits";
	traits: Traits;
}

/**
 * Message type emitted at the end of {@link GenArtAPI.setParams} to inform
 * external tooling about artwork defined {@link ParamSpecs}.
 */
export interface SetParamsMsg extends APIMessage {
	type: "genart:setparams";
	params: NestedParamSpecs;
}

/**
 * Command message type received by {@link GenArtAPI} to remotely trigger
 * {@link GenArtAPI.setParamValue}.
 */
export interface SetParamValueMsg extends APIMessage {
	type: "genart:setparamvalue";
	/**
	 * ID of parameter to update.
	 */
	paramID: string;
	/**
	 * Optional. ID of nested sub-param to update.
	 */
	key?: string;
	/**
	 * New value.
	 */
	value: any;
}

/**
 * Command message type received by {@link GenArtAPI} to remotely trigger
 * {@link GenArtAPI.randomizeParamValue}.
 */
export interface RandomizeParamMsg extends APIMessage {
	type: "genart:randomizeparam";
	/**
	 * ID of parameter to randomize.
	 */
	paramID: string;
	/**
	 * Optional. The property in the param spec which has been randomized (only
	 * used if the param is a composite, i.e. has nested params)
	 */
	key?: string;
}

/**
 * Message type emitted by {@link GenArtAPI.setParamValue} when a parameter has
 * been changed/updated.
 */
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

/**
 * Message type emitted by {@link GenArtAPI.setParamValue} if the given value is
 * not valid or the param couldn't be updated for any other reason.
 */
export interface ParamErrorMsg extends APIMessage {
	type: "genart:paramerror";
	paramID: string;
	error?: string;
}

/**
 * Message type emitted when the {@link GenArtAPI} internally switches into a
 * new state. See {@link APIState} for details.
 */
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
 * Message type emitted by the platform adapter when a screen configuration
 * change occurred and the artwork (or 3rd party tooling) should respond/adapt
 * to these new dimensions provided.
 */
export interface ResizeMsg extends APIMessage {
	type: "genart:resize";
	/**
	 * New screen/canvas configuration
	 */
	screen: ScreenConfig;
}

/**
 * Message type emitted by the {@link GenArtAPI.start} update/animation loop for
 * each single frame update. The message contains the time & frame information
 * of the currently rendered frame and is intended for 3rd party tooling (i.e.
 * editors, players, sequencers).
 */
export interface AnimFrameMsg extends APIMessage {
	type: "genart:frame";
	/**
	 * Current animation time (in seconds)
	 */
	time: number;
	/**
	 * Current frame number
	 */
	frame: number;
}

/**
 * Message type sent to parent window when {@link GenArtAPI.capture} is called.
 */
export interface CaptureMessage extends APIMessage {
	type: "genart:capture";
}

/**
 * Message type sent when {@link GenArtAPI.start} is called.
 */
export interface StartMessage extends APIMessage {
	type: "genart:start";
}

/**
 * Message type sent when {@link GenArtAPI.start} is called (with resume=true).
 */
export interface ResumeMessage extends APIMessage {
	type: "genart:resume";
}

/**
 * Message type sent when {@link GenArtAPI.stop} is called.
 */
export interface StopMessage extends APIMessage {
	type: "genart:stop";
}

/**
 * LUT mapping message types (names) to their respective type of API message.
 * Used for type checking/inference in {@link GenArtAPI.on}.
 */
export interface MessageTypeMap {
	"genart:capture": CaptureMessage;
	// "genart:capturerequest": APIMessage;
	"genart:paramchange": ParamChangeMsg;
	"genart:paramerror": ParamErrorMsg;
	"genart:randomizeparam": RandomizeParamMsg;
	"genart:frame": AnimFrameMsg;
	"genart:resize": ResizeMsg;
	"genart:resume": ResumeMessage;
	"genart:setparams": SetParamsMsg;
	"genart:setparamvalue": SetParamValueMsg;
	"genart:settraits": SetTraitsMsg;
	"genart:start": StartMessage;
	"genart:statechange": StateChangeMsg;
	"genart:stop": StopMessage;
}

/**
 * All known message types/names
 */
export type MessageType = keyof MessageTypeMap;

/**
 * Message notification types:
 *
 * - `all`: message sent to current and parent window (if different)
 * - `none`: message will NOT be sent
 * - `parent`: message only sent to parent window (if different present)
 * - `self`: message only sent to current window/iframe
 */
export type NotifyType = "all" | "none" | "parent" | "self";
