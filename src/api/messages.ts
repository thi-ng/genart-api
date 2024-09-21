import type { APIState, Features } from "../api.js";
import type { Param, ParamSpecs } from "./params.js";

export interface APIMessage {
	type: MessageType;
	apiID?: string;
	/** @internal */
	__self?: boolean;
}

export interface SetFeaturesMsg extends APIMessage {
	type: "genart:setfeatures";
	features: Features;
}

export interface SetParamsMsg extends APIMessage {
	type: "genart:setparams";
	params: ParamSpecs;
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
}

export interface ParamChangeMsg extends APIMessage {
	type: "genart:paramchange";
	paramID: string;
	spec: Param<any>;
}

export interface ParamErrorMsg extends APIMessage {
	type: "genart:paramerror";
	paramID: string;
	error?: string;
}

export interface StateChangeMsg extends APIMessage {
	type: "genart:statechange";
	state: APIState;
}

export interface MessageTypeMap {
	"genart:setfeatures": SetFeaturesMsg;
	"genart:setparams": SetParamsMsg;
	"genart:setparamvalue": SetParamValueMsg;
	"genart:randomizeparam": RandomizeParamMsg;
	"genart:paramchange": ParamChangeMsg;
	"genart:paramerror": ParamErrorMsg;
	"genart:statechange": StateChangeMsg;
	"genart:start": APIMessage;
	"genart:resume": APIMessage;
	"genart:stop": APIMessage;
	"genart:capture": APIMessage;
}

export type MessageType = keyof MessageTypeMap;

export type NotifyType = "none" | "self" | "parent" | "all";
