import { useEffect } from "react";

export function useActiveSponsorObserver({
    sponsorRefs,
    prizeDetails,
    onActiveSponsorChange,
}: {
    sponsorRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    prizeDetails: any[];
    onActiveSponsorChange: (name: string | null) => void;
}) {
    useEffect(() => {
        const visibilityMap = new Map<string, number>();
        let debounceTimer: number | null = null;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    const name = entry.target.getAttribute("data-name");
                    if (!name) continue;
                    visibilityMap.set(
                        name,
                        entry.isIntersecting ? entry.intersectionRatio : 0
                    );
                }

                if (debounceTimer) clearTimeout(debounceTimer);

                debounceTimer = window.setTimeout(() => {
                    let bestName: string | null = null;
                    let bestRatio = -1;

                    for (const [name, ratio] of visibilityMap.entries()) {
                        if (ratio > bestRatio) {
                            bestRatio = ratio;
                            bestName = name;
                        }
                    }

                    if (!bestName) return;
                    onActiveSponsorChange(bestName);

                    const url = new URL(window.location.href);
                    const existing = url.searchParams.get("sponsor");
                    if (existing !== bestName) {
                        url.searchParams.set("sponsor", bestName);
                        window.history.replaceState({}, "", url.toString());
                    }
                }, 120);
            },
            {
                root: null,
                rootMargin: "-10% 0px -60% 0px",
                threshold: Array.from({ length: 11 }, (_, i) => i / 10),
            }
        );

        Object.values(sponsorRefs.current).forEach(
            (el) => el && observer.observe(el)
        );

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            observer.disconnect();
        };
    }, [prizeDetails, onActiveSponsorChange]);
}
