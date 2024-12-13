import type {
	AnimFrameMessage,
	APIMessage,
	APIState,
	ConfigureMessage,
	InfoMessage,
	NestedParamSpecs,
	ParamChangeMessage,
	ParamsMessage,
	StateChangeMessage,
	TraitsMessage,
} from "@genart-api/core";
import type { Maybe } from "@thi.ng/api";
import { isPlainObject, isString } from "@thi.ng/checks";
import { defTimecode } from "@thi.ng/date";
import {
	reactive,
	stream,
	type ISubscription,
	type WithErrorHandlerOpts,
} from "@thi.ng/rstream";
import { padLeft } from "@thi.ng/strings";
import { isCompatibleVersion } from "./utils.js";
import { MIN_API_VERSION } from "./version.js";

const ADAPTER_ID = "@genart-api/adapter-urlparams";

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
let doUpdateParamsOnChange = false;
let infoRequested = false;

window.addEventListener("message", (e) => {
	if (!(isPlainObject(e.data) && isString(e.data.type))) return;
	switch (e.data.type) {
		case "genart:traits": {
			const $msg = <TraitsMessage>e.data;
			apiID.next($msg.apiID);
			traits.next($msg.traits);
			break;
		}
		case "genart:params": {
			const $msg = <ParamsMessage>e.data;
			apiID.next($msg.apiID);
			if (Object.keys($msg.params).length) params.next($msg.params);
			console.log("set-params", $msg.params);
			break;
		}
		case "genart:param-change": {
			const $msg = <ParamChangeMessage>e.data;
			selfUpdate = true;
			paramValues[$msg.paramID]?.next($msg.param.value);
			if (doUpdateParamsOnChange) {
				params.next({ ...params.deref(), [$msg.paramID]: $msg.param });
			}
			selfUpdate = false;
			break;
		}
		case "genart:state-change": {
			const $msg = <StateChangeMessage>e.data;
			apiState.next($msg.state);
			if ($msg.state === "error") apiError.next($msg.info);
			break;
		}
		case "genart:frame": {
			const $msg = <AnimFrameMessage>e.data;
			currentTime.next($msg.time);
			currentFrame.next($msg.frame);
			break;
		}
		case "genart:info": {
			if (!infoRequested) return;
			infoRequested = false;
			const $msg = <InfoMessage>e.data;
			if ($msg.adapter !== ADAPTER_ID) {
				alert(
					`Incompatible platform adapter detected.\n\nThis editor requires your artwork to use this adapter:\n${ADAPTER_ID}`
				);
				return;
			}
			if (
				!(
					$msg.version &&
					isCompatibleVersion($msg.version, MIN_API_VERSION)
				)
			) {
				alert(
					`Outdated GenArtAPI detected.\n\nPlease upgrade to version: ${MIN_API_VERSION}`
				);
				return;
			}
			apiID.next($msg.apiID);
			sendMessage<ConfigureMessage>({
				type: "genart:configure",
				opts: { notifyFrameUpdate: true },
			});
			break;
		}
		case `${ADAPTER_ID}:set-params`:
			iframeParams.next(e.data.params);
			break;
	}
});

export const sendMessage = <T extends APIMessage>(msg: Omit<T, "apiID">) => {
	iframeWindow.postMessage({ ...msg, apiID: apiID.deref() }, "*");
};

export const updateParamsOnChange = (state: boolean) =>
	(doUpdateParamsOnChange = state);

export const reloadArt = (url: string) => {
	infoRequested = true;
	setTimeout(() => sendMessage({ type: "genart:get-info" }), 500);
	iframe.src = url;
};
