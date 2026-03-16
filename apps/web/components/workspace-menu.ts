export type WorkspaceMenuItem = "Philosophy" | "Following" | "Bookmarks" | "Manifesto";

export interface WorkspaceMenuLink {
	label: WorkspaceMenuItem;
	href: string;
}

export const workspaceMenuLinks: WorkspaceMenuLink[] = [
	{ label: "Philosophy", href: "#" },
	{ label: "Following", href: "/app/following" },
	{ label: "Bookmarks", href: "/app/bookmarks" },
	{ label: "Manifesto", href: "#" },
];
