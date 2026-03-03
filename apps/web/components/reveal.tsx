"use client";

import { useEffect, useRef } from "react";
import type { PropsWithChildren } from "react";
import React from "react";

interface RevealProps extends PropsWithChildren {
	className?: string;
}

export function Reveal({ children, className = "" }: RevealProps) {
	const ref = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const target = ref.current;
		if (!target) {
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						entry.target.classList.add("active");
						observer.unobserve(entry.target);
					}
				}
			},
			{ threshold: 0.1 },
		);

		observer.observe(target);
		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div ref={ref} className={`reveal ${className}`.trim()}>
			{children}
		</div>
	);
}
