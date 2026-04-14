export type WorkspaceMenuItem = "Bookmarks" | "Following" | "Takeaway" | "Suggestions";

export interface WorkspaceMenuLink {
	label: WorkspaceMenuItem;
	href: string;
}

export const workspaceMenuLinks: WorkspaceMenuLink[] = [
	{ label: "Bookmarks", href: "/app/bookmarks" },
	{ label: "Following", href: "/app/following" },
	{ label: "Takeaway", href: "/app/takeaway" },
	{ label: "Suggestions", href: "/app/suggestions" },
];
