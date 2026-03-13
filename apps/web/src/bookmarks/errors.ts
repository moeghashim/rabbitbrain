export const BOOKMARK_ALREADY_EXISTS_ERROR_CODE = "BOOKMARK_ALREADY_EXISTS";
export const BOOKMARK_ALREADY_EXISTS_MESSAGE = "This post is already in your Bookmarks. We kept the existing save instead of creating a duplicate.";

export interface BookmarkAlreadyExistsErrorData {
	[key: string]: string;
	code: typeof BOOKMARK_ALREADY_EXISTS_ERROR_CODE;
	message: typeof BOOKMARK_ALREADY_EXISTS_MESSAGE;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

export function createBookmarkAlreadyExistsErrorData(): BookmarkAlreadyExistsErrorData {
	return {
		code: BOOKMARK_ALREADY_EXISTS_ERROR_CODE,
		message: BOOKMARK_ALREADY_EXISTS_MESSAGE,
	};
}

export function isBookmarkAlreadyExistsError(error: unknown): boolean {
	if (error instanceof Error && error.message.includes(BOOKMARK_ALREADY_EXISTS_ERROR_CODE)) {
		return true;
	}
	if (!isRecord(error) || !("data" in error)) {
		return false;
	}
	const data = error.data;
	if (!isRecord(data)) {
		return false;
	}
	return data.code === BOOKMARK_ALREADY_EXISTS_ERROR_CODE;
}
