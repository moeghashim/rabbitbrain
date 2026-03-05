export type WorkspaceMenuItem = "Philosophy" | "Bookmarks" | "Manifesto";

export interface WorkspaceMenuLink {
	label: WorkspaceMenuItem;
	href: string;
}

export const workspaceMenuLinks: WorkspaceMenuLink[] = [
	{ label: "Philosophy", href: "#" },
	{ label: "Bookmarks", href: "/app/bookmarks" },
	{ label: "Manifesto", href: "#" },
];
