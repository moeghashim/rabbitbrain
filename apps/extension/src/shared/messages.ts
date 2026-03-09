import type {
	AnalyzeTweetResponse,
	ExtensionSessionStatus,
	SaveBookmarkInput,
	SavedBookmark,
} from "@pi-starter/contracts";

export type PendingAuthActionType = "analyze" | "save-bookmark";

export interface PendingAuthAction {
	type: PendingAuthActionType;
	tweetUrl: string;
	tabId: number;
	tags?: string[];
	createdAt: number;
}

export interface SuccessResponse<T> {
	ok: true;
	data: T;
}

export interface ErrorResponse {
	ok: false;
	code: string;
	message: string;
	authStarted?: boolean;
}

export interface AnalyzeTweetMessage {
	type: "rabbitbrain/analyze-tweet";
	tweetUrl: string;
}

export interface SaveBookmarkMessage {
	type: "rabbitbrain/save-bookmark";
	payload: SaveBookmarkInput;
	tags: string[];
}

export interface CheckSessionMessage {
	type: "rabbitbrain/check-session";
}

export type RuntimeRequestMessage = AnalyzeTweetMessage | SaveBookmarkMessage | CheckSessionMessage;

export type AnalyzeTweetMessageResponse = SuccessResponse<AnalyzeTweetResponse> | ErrorResponse;
export type SaveBookmarkMessageResponse = SuccessResponse<SavedBookmark> | ErrorResponse;
export type CheckSessionMessageResponse = SuccessResponse<ExtensionSessionStatus> | ErrorResponse;

export interface ResumePendingActionMessage {
	type: "rabbitbrain/resume-pending-action";
	pendingAction: PendingAuthAction;
}

export type RuntimeEventMessage = ResumePendingActionMessage;
