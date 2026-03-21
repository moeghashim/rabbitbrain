export type WorkspaceMenuItem = "Following" | "Bookmarks";

export interface WorkspaceMenuLink {
	label: WorkspaceMenuItem;
	href: string;
}

export const workspaceMenuLinks: WorkspaceMenuLink[] = [
	{ label: "Following", href: "/app/following" },
	{ label: "Bookmarks", href: "/app/bookmarks" },
];
