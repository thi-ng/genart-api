import type { GenArtAPIOpts } from "../api.js";
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
     * ID of the {@link GenArtAPI} instance this message is intended for. Use
     * `"*"` to broadcast message to all active `GenArtAPI` instances. Also see
     * {@link GenArtAPI.id}.
     */
    apiID: string;
    /**
     * Flag used to indicate the message was emitted by the same instance.
     *
     * @internal
     */
    __self?: boolean;
}
/**
 * Message type emitted by {@link GenArtAPI.setTraits} to inform external
 * tooling about artwork defined {@link Traits}.
 */
export interface TraitsMessage extends APIMessage {
    type: "genart:traits";
    traits: Traits;
}
/**
 * Message type emitted at the end of {@link GenArtAPI.setParams} to inform
 * external tooling about artwork defined {@link ParamSpecs}.
 */
export interface ParamsMessage extends APIMessage {
    type: "genart:params";
    params: NestedParamSpecs;
}
/**
 * Command message type received by {@link GenArtAPI} to remotely trigger
 * {@link GenArtAPI.setParamValue}.
 */
export interface SetParamValueMessage extends APIMessage {
    type: "genart:set-param-value";
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
export interface RandomizeParamMessage extends APIMessage {
    type: "genart:randomize-param";
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
export interface ParamChangeMessage extends APIMessage {
    type: "genart:param-change";
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
export interface ParamErrorMessage extends APIMessage {
    type: "genart:param-error";
    paramID: string;
    error?: string;
}
/**
 * Message type emitted when the {@link GenArtAPI} internally switches into a
 * new state. See {@link APIState} for details.
 */
export interface StateChangeMessage extends APIMessage {
    type: "genart:state-change";
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
export interface ResizeMessage extends APIMessage {
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
 * editors, players, sequencers). Messages are only sent if the
 * {@link GenArtAPIOpts.notifyFrameUpdate} option is enabled.
 *
 * @remarks
 * Also see: {@link GenArtAPI.configure} and {@link ConfigureMessage}.
 */
export interface AnimFrameMessage extends APIMessage {
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
 * Message type sent when {@link GenArtAPI.configure} is called or a
 * {@link ConfigureMessage} or {@link GetInfoMessage} is received by the API.
 * Includes all current config options, API state, timing info,
 * {@link GenArtAPI.version} and more.
 */
export interface InfoMessage extends APIMessage {
    type: "genart:info";
    opts: GenArtAPIOpts;
    /** Same as {@link GenArtAPI.state}. */
    state: APIState;
    /** Same as {@link GenArtAPI.version}. */
    version: string;
    /** Same as {@link PlatformAdapter.id}. */
    adapter?: string;
    /**
     * Current animation time (in milliseconds). See {@link TimeProvider.now}.
     */
    time: number;
    /**
     * Current animation frame number. See {@link TimeProvider.now}.
     */
    frame: number;
    /**
     * Random seed used by this instance's {@link PRNG}.
     */
    seed: string;
}
/**
 * Command message type received by {@link GenArtAPI} to trigger an
 * {@link InfoMessage} being sent in response.
 */
export interface GetInfoMessage extends APIMessage {
    type: "genart:get-info";
}
/**
 * Command message type received by {@link GenArtAPI}. Only if the
 * {@link GenArtAPIOpts.allowExternalConfig} option is enabled, the message
 * payload's options are passed to {@link GenArtAPI.configure}, which then
 * results in a {@link InfoMessage} being sent in response.
 *
 * @remarks
 * For security reasons, the {@link GenArtAPIOpts.id} and
 * {@link GenArtAPIOpts.allowExternalConfig} options cannot be changed
 * themselves using this mechanism.
 */
export interface ConfigureMessage extends APIMessage {
    type: "genart:configure";
    opts: Partial<Omit<GenArtAPIOpts, "id">>;
}
/**
 * LUT mapping message types (names) to their respective type of API message.
 * Used for type checking/inference in {@link GenArtAPI.on}.
 */
export interface MessageTypeMap {
    "genart:capture": CaptureMessage;
    "genart:configure": ConfigureMessage;
    "genart:frame": AnimFrameMessage;
    "genart:get-info": GetInfoMessage;
    "genart:info": InfoMessage;
    "genart:param-change": ParamChangeMessage;
    "genart:param-error": ParamErrorMessage;
    "genart:randomize-param": RandomizeParamMessage;
    "genart:resize": ResizeMessage;
    "genart:resume": ResumeMessage;
    "genart:params": ParamsMessage;
    "genart:set-param-value": SetParamValueMessage;
    "genart:start": StartMessage;
    "genart:state-change": StateChangeMessage;
    "genart:stop": StopMessage;
    "genart:traits": TraitsMessage;
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
