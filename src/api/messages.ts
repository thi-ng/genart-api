import type { Features } from "../api.js";
import type { Param, ParamSpecs } from "./params.js";

export interface APIMessage {
	type: MessageType;
	apiID?: string;
	/** @internal */
	__self?: boolean;
}

export interface SetFeaturesMsg extends APIMessage {
	features: Features;
}

export interface SetParamsMsg extends APIMessage {
	params: ParamSpecs;
}

export interface SetParamValueMsg extends APIMessage {
	paramID: string;
	value: any;
}

export interface RandomizeParamMsg extends APIMessage {
	paramID: string;
}

export interface ParamChangeMsg extends APIMessage {
	paramID: string;
	spec: Param<any>;
}
export interface ParamErrorMsg extends APIMessage {
	paramID: string;
	error?: string;
}

export interface MessageTypeMap {
	"genart:setfeatures": SetFeaturesMsg;
	"genart:setparams": SetParamsMsg;
	"genart:setparamvalue": SetParamValueMsg;
	"genart:randomizeparam": RandomizeParamMsg;
	"genart:paramchange": ParamChangeMsg;
	"genart:paramerror": ParamErrorMsg;
	"genart:start": APIMessage;
	"genart:resume": APIMessage;
	"genart:stop": APIMessage;
	"genart:capture": APIMessage;
}

export type MessageType = keyof MessageTypeMap;

export type NotifyType = "self" | "parent" | "all";
