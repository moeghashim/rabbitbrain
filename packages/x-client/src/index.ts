export interface XClientInfo {
	name: string;
	version: string;
}

export function getXClientInfo(): XClientInfo {
	return {
		name: "x-client",
		version: "0.0.1",
	};
}
