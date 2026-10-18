"use client";

import React, { useEffect, useState, createContext, useContext, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import DashboardLoading from "@/app/dashboard/loading";

interface NavigationContextType {
    isNavigating: boolean;
    startNavigating: () => void;
}

const NavigationContext = createContext<NavigationContextType>({
    isNavigating: false,
    startNavigating: () => {},
});

export const useNavigationState = () => useContext(NavigationContext);

function RouteChangeListener({ onComplete }: { onComplete: () => void }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        onComplete();
    }, [pathname, searchParams, onComplete]);

    return null;
}

export function DashboardTransitionWrapper({ children }: { children: React.ReactNode }) {
    const [isNavigating, setIsNavigating] = useState(false);

    // Safety timeout in case navigation is cancelled or network fails
    useEffect(() => {
        if (!isNavigating) return;
        const timer = setTimeout(() => {
            setIsNavigating(false);
        }, 10000);
        return () => clearTimeout(timer);
    }, [isNavigating]);

    // Listen to all link clicks across the document for instant (0ms) feedback
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest("a");
            if (!target) return;

            const href = target.getAttribute("href");
            if (!href) return;

            // Ignore external links, modifier clicks, downloads, or anchor hash jumps
            if (
                target.target === "_blank" ||
                e.ctrlKey ||
                e.metaKey ||
                e.shiftKey ||
                e.altKey ||
                href.startsWith("#") ||
                href.startsWith("mailto:") ||
                href.startsWith("tel:") ||
                href.startsWith("javascript:") ||
                target.hasAttribute("download")
            ) {
                return;
            }

            try {
                const destUrl = new URL(href, window.location.origin);
                // Only handle same-origin routes
                if (destUrl.origin !== window.location.origin) return;

                const currentPathWithSearch = window.location.pathname + window.location.search;
                const destPathWithSearch = destUrl.pathname + destUrl.search;

                // If navigating to a different page, trigger skeleton immediately
                if (destPathWithSearch !== currentPathWithSearch) {
                    setIsNavigating(true);
                }
            } catch {
                // Ignore invalid URLs
            }
        };

        const handlePopState = () => {
            setIsNavigating(true);
        };

        document.addEventListener("click", handleClick, { capture: true });
        window.addEventListener("popstate", handlePopState);

        return () => {
            document.removeEventListener("click", handleClick, { capture: true });
            window.removeEventListener("popstate", handlePopState);
        };
    }, []);

    const startNavigating = () => setIsNavigating(true);

    return (
        <NavigationContext.Provider value={{ isNavigating, startNavigating }}>
            <Suspense fallback={null}>
                <RouteChangeListener onComplete={() => setIsNavigating(false)} />
            </Suspense>

            {/* Glowing top progress bar */}
            {isNavigating && (
                <div className="fixed top-0 left-0 right-0 h-1 z-[9999] overflow-hidden bg-primary/20 pointer-events-none">
                    <div className="h-full bg-primary animate-indeterminate shadow-[0_0_8px_hsl(var(--primary))]" />
                </div>
            )}

            {/* If navigating, render skeleton immediately so the user gets 0ms feedback */}
            {isNavigating ? (
                <div className="w-full animate-fade-in pointer-events-none">
                    <DashboardLoading />
                </div>
            ) : (
                children
            )}
        </NavigationContext.Provider>
    );
}

export default DashboardTransitionWrapper;
