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
 * Message type emitted by the {@link GenArtAPI.start} update/animation loop for
 * each single frame update. The message contains the time & frame information
 * of the currently rendered frame and intended for 3rd party tooling (i.e.
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
 * LUT mapping message types (names) to their respective type of API message.
 * Used for type checking/inference in {@link GenArtAPI.on}.
 */
export interface MessageTypeMap {
    "genart:capture": APIMessage;
    "genart:capturerequest": APIMessage;
    "genart:paramchange": ParamChangeMsg;
    "genart:paramerror": ParamErrorMsg;
    "genart:randomizeparam": RandomizeParamMsg;
    "genart:frame": AnimFrameMsg;
    "genart:resize": ResizeMsg;
    "genart:resume": APIMessage;
    "genart:setparams": SetParamsMsg;
    "genart:setparamvalue": SetParamValueMsg;
    "genart:settraits": SetTraitsMsg;
    "genart:start": APIMessage;
    "genart:statechange": StateChangeMsg;
    "genart:stop": APIMessage;
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
