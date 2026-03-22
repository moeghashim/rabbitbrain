export type WorkspaceMenuItem = "Takeaway" | "Following" | "Bookmarks";

export interface WorkspaceMenuLink {
	label: WorkspaceMenuItem;
	href: string;
}

export const workspaceMenuLinks: WorkspaceMenuLink[] = [
	{ label: "Takeaway", href: "/app/takeaway" },
	{ label: "Following", href: "/app/following" },
	{ label: "Bookmarks", href: "/app/bookmarks" },
];
