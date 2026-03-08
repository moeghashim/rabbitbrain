import Link from "next/link";
import React from "react";

import { RabbitBrandMark } from "./rabbit-brand-mark.js";
import { workspaceMenuLinks, type WorkspaceMenuItem } from "./workspace-menu.js";

export interface AppWorkspaceNavProps {
	activeItem: WorkspaceMenuItem;
}

export function AppWorkspaceNav({ activeItem }: Readonly<AppWorkspaceNavProps>) {
	return (
		<nav className="sticky left-0 top-0 z-40 mx-auto flex w-[95%] max-w-7xl items-center justify-between rounded-[48px] border border-white/10 bg-ink/70 px-8 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] backdrop-blur-xl">
			<Link href="/" id="nav-logo" className="group flex items-center gap-2">
				<RabbitBrandMark className="h-8 w-8 transition-transform duration-700 ease-redsun group-hover:-rotate-12 group-hover:scale-105" />
				<span className="mt-1 font-serif text-2xl tracking-tight text-white">Rabbit Brain</span>
			</Link>

				<div className="hidden items-center gap-10 md:flex">
					{workspaceMenuLinks.map((item) => (
					<Link
						key={item.label}
						href={item.href}
						className={`text-sm font-medium transition-colors duration-300 hover:text-white ${
							item.label === activeItem ? "text-white" : "text-peach/70"
						}`}
					>
						{item.label}
					</Link>
				))}
			</div>

			<Link
				href="/account"
				id="nav-cta"
				className="rounded-[48px] bg-coral px-7 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(239,70,35,0.4)] transition-all duration-300 ease-redsun hover:-translate-y-0.5 hover:bg-coral-hover hover:shadow-[0_6px_20px_rgba(239,70,35,0.6)]"
			>
				Account Settings
			</Link>
		</nav>
	);
}
