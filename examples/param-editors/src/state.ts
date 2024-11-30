import type { Maybe } from "@thi.ng/api";
import type {
	AnimFrameMsg,
	APIMessage,
	APIState,
	NestedParamSpecs,
	ParamChangeMsg,
	ParamSpecs,
	SetParamsMsg,
	SetTraitsMsg,
	StateChangeMsg,
} from "../../../src/api";
import {
	reactive,
	stream,
	type ISubscription,
	type WithErrorHandlerOpts,
} from "@thi.ng/rstream";
import { defTimecode } from "@thi.ng/date";
import { padLeft } from "@thi.ng/strings";

const INF: Partial<WithErrorHandlerOpts> = { closeOut: "never" };

export const iframe = <HTMLIFrameElement>document.getElementById("art");
export const iframeWindow = iframe.contentWindow!;
export const iframeParams = reactive(
	iframe.src.substring(iframe.src.indexOf("?")),
	INF
);

export const artURL = stream<string>();
export const apiID = stream<string>();
export const apiError = stream<Maybe<string>>();
export const apiState = reactive<APIState>("init");

export const params = stream<NestedParamSpecs>();
export const paramCache: Record<string, any> = {};
export const paramValues: Record<string, ISubscription<any, any>> = {};

export const traits = reactive({});
const currentTime = reactive(0);
const currentFrame = reactive(0);
export const formattedTime = currentTime.map(defTimecode(60), INF);
export const formattedFrame = currentFrame.map(padLeft(6, "0"), INF);

export let selfUpdate = false;

window.addEventListener("message", (e) => {
	switch (e.data.type) {
		case "genart:settraits": {
			const $msg = <SetTraitsMsg>e.data;
			apiID.next($msg.apiID);
			traits.next($msg.traits);
			break;
		}
		case "genart:setparams": {
			const $msg = <SetParamsMsg>e.data;
			apiID.next($msg.apiID);
			if (Object.keys($msg.params).length) params.next($msg.params);
			console.log("setparams", $msg.params);
			break;
		}
		case "genart:paramchange": {
			const $msg = <ParamChangeMsg>e.data;
			selfUpdate = true;
			paramValues[$msg.paramID]?.next($msg.param.value);
			params.next({ ...params.deref(), [$msg.paramID]: $msg.param });
			selfUpdate = false;
			break;
		}
		case "genart:statechange": {
			const $msg = <StateChangeMsg>e.data;
			apiState.next($msg.state);
			if ($msg.state === "error") apiError.next($msg.info);
			break;
		}
		case "genart:frame":
			const $msg = <AnimFrameMsg>e.data;
			currentTime.next($msg.time);
			currentFrame.next($msg.frame);
			break;
		case "paramadapter:update":
			iframeParams.next(e.data.params);
			break;
	}
});

export const sendMessage = <T extends APIMessage>(msg: Omit<T, "apiID">) => {
	iframeWindow.postMessage({ ...msg, apiID: apiID.deref() }, "*");
};
