import { motion, AnimatePresence } from "motion/react";
import prices from "./prices.json";
import { useState, useMemo, useRef, useEffect, memo } from "react";
import { Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
        </Routes>
    );
}

function Home() {
    const prizeDetails = prices.pageProps.prizeDetails;
    const [searchParams] = useSearchParams();

    const [activeSponsor, setActiveSponsor] = useState<string | null>(() => {
        const sponsorParam = searchParams.get("sponsor");
        if (sponsorParam) return sponsorParam;

        const firstOrganizer = prizeDetails.find((s) => s.type === "organizer");
        if (firstOrganizer) return firstOrganizer.name;

        const firstPartner = prizeDetails.find((s) => s.type === "sponsor");
        if (firstPartner) return firstPartner.name;

        return null;
    });

    return (
        <div className="bg-bg min-h-screen">
            <div className="w-full max-w-[1200px] mx-auto font-geist bg-bg pb-[500px]">
                <div className="flex flex-col md:flex-row w-full gap-6 md:gap-0">
                    <div className="w-full md:w-[30%] pt-4 px-4 md:px-0">
                        <IndexSidebar
                            prizeDetails={prizeDetails}
                            activeSponsor={activeSponsor}
                            onSponsorClick={(name) => {
                                document.getElementById(name)?.scrollIntoView({
                                    behavior: "smooth",
                                });
                            }}
                        />
                    </div>

                    <div className="w-full md:w-[70%] px-4 md:px-10">
                        <Content
                            prizeDetails={prizeDetails}
                            onActiveSponsorChange={setActiveSponsor}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

const Content = memo(function Content({
    prizeDetails,
    onActiveSponsorChange,
}: {
    prizeDetails: typeof prices.pageProps.prizeDetails;
    onActiveSponsorChange: (name: string | null) => void;
}) {
    const [query, setQuery] = useState("");
    const debounceRef = useRef<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setQuery(value);
        }, 300);
    };

    const filteredDetails = useMemo(() => {
        if (!query.trim()) return prizeDetails;
        const lower = query.toLowerCase();
        return prizeDetails.filter((sponsor) => {
            const sponsorMatches = sponsor.name?.toLowerCase().includes(lower);
            const trackOrPrizeMatches = sponsor.tracks.some((track) => {
                const trackMatches = track.name?.toLowerCase().includes(lower);
                const prizeMatches = track.prizes?.some((p) =>
                    p.name?.toLowerCase().includes(lower)
                );
                return trackMatches || prizeMatches;
            });
            return sponsorMatches || trackOrPrizeMatches;
        }) as typeof prizeDetails;
    }, [query, prizeDetails]);

    return (
        <div>
            <div className="sticky top-0 z-10 border-gray-200 py-4 bg-bg">
                <input
                    type="text"
                    onChange={handleChange}
                    placeholder="Search track or prize name..."
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-sm text-sm md:text-base"
                />
            </div>
            <SponsorPrizes
                prizeDetails={filteredDetails}
                onActiveSponsorChange={onActiveSponsorChange}
            />
        </div>
    );
});

const SponsorPrizes = ({
    prizeDetails,
    onActiveSponsorChange,
}: {
    prizeDetails: typeof prices.pageProps.prizeDetails;
    onActiveSponsorChange: (name: string | null) => void;
}) => {
    const sponsorRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sponsorName = params.get("sponsor");

        if (sponsorName && sponsorRefs.current[sponsorName]) {
            setTimeout(() => {
                sponsorRefs.current[sponsorName]?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 200);
        }
    }, [location.search]);

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

    return (
        <div className="space-y-10 mt-5">
            {prizeDetails.map((sponsor, index) => {
                const totalAmount = sponsor.tracks?.reduce((sum, track) => {
                    const trackSum = track.prizes?.reduce(
                        (a, p) => a + (p.amount || 0),
                        0
                    );
                    return sum + trackSum;
                }, 0);

                return (
                    <div
                        key={sponsor.uuid}
                        ref={(el) => {
                            sponsorRefs.current[sponsor.name] = el;
                        }}
                        id={sponsor.name}
                        data-name={sponsor.name}
                        className="scroll-mt-24"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border border-gray-200 bg-white px-5 py-4 rounded-sm">
                            {sponsor.logo && (
                                <img
                                    src={sponsor.logo}
                                    alt={sponsor.name}
                                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded"
                                />
                            )}
                            <div>
                                <div className="text-base sm:text-lg font-bold text-gray-900">
                                    {sponsor.name}
                                </div>
                                <div className="text-[13px] sm:text-[14px] text-gray-500 font-mono font-bold">
                                    ${totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4">
                            <TrackList tracks={sponsor.tracks} />
                        </div>

                        {prizeDetails.length - 1 !== index && (
                            <div className="fill-gray-400 h-14 flex items-center justify-center">
                                <Seperator size={24} />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

type Prize = {
    uuid: string;
    name: string;
    amount: number;
    desc?: string;
    hasWinners?: boolean;
};

type TrackProps = {
    uuid: string;
    name: string;
    description?: string;
    prizes: Prize[];
};

function TrackList({ tracks }: { tracks: TrackProps[] }) {
    const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

    if (!tracks || tracks.length === 0) return null;

    const sortedTracks = [...tracks].sort((a, b) => {
        const totalA =
            a.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalB =
            b.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        return totalB - totalA;
    });

    const toggleExpand = (uuid: string) => {
        setExpandedTrack((prev) => (prev === uuid ? null : uuid));
    };

    return (
        <div className="mt-4 bg-white border border-gray-200 flex flex-col rounded-md overflow-hidden">
            {sortedTracks.map((track) => {
                const totalAmount =
                    track.prizes?.reduce(
                        (sum, p) => sum + (p.amount || 0),
                        0
                    ) || 0;

                const isExpanded = expandedTrack === track.uuid;

                return (
                    <div key={track.uuid} className="border-b border-gray-100">
                        <div
                            onClick={() => toggleExpand(track.uuid)}
                            className="flex items-center justify-between py-2 px-3 cursor-pointer hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-2 w-[80%] truncate">
                                <motion.div
                                    animate={{
                                        rotate: isExpanded ? 180 : 0,
                                    }}
                                    transition={{
                                        duration: 0.25,
                                        ease: "easeInOut",
                                    }}
                                    className="text-gray-500"
                                >
                                    <ChevronDown size={16} />
                                </motion.div>
                                <span className="text-[15px] text-gray-800 truncate select-none">
                                    {track.name}
                                </span>
                            </div>
                            <div className="text-[14px] text-gray-500 font-mono">
                                ${totalAmount.toLocaleString()}
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            <motion.div
                                key={track.uuid}
                                initial={false}
                                animate={
                                    isExpanded
                                        ? { height: "auto", opacity: 1 }
                                        : { height: 0, opacity: 0 }
                                }
                                exit={{ height: 0, opacity: 0 }}
                                transition={{
                                    duration: 0.25,
                                    ease: "easeInOut",
                                }}
                                className="overflow-hidden bg-gray-50/40 px-3 text-sm text-gray-700 leading-relaxed"
                            >
                                <div className="pt-2 whitespace-pre-line">
                                    {isExpanded ? (
                                        <MarkdownRenderer
                                            content={track.description}
                                        />
                                    ) : (
                                        track.description
                                    )}
                                </div>

                                <div className="pb-3">
                                    {track.prizes?.length > 0 && (
                                        <div className="mt-3 border-t border-gray-200 pt-3">
                                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                                Prize Breakdown
                                            </h4>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {track.prizes.map((p) => (
                                                    <div
                                                        key={p.uuid}
                                                        className="flex flex-col justify-between border border-gray-200 bg-white/70 rounded-md px-3 py-2"
                                                    >
                                                        <div className="text-[14px] text-gray-800 font-medium truncate">
                                                            {p.name}
                                                        </div>
                                                        <div className="text-[13px] text-gray-600 font-mono mt-1">
                                                            $
                                                            {p.amount.toLocaleString()}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
}

export function ChevronDown({ size = 16, className = "" }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            width={size}
            height={size}
            className={className}
            fill="currentColor"
        >
            <path d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L534.7 278.6C547.2 266.1 547.2 245.8 534.7 233.3C522.2 220.8 501.9 220.8 489.4 233.3L320 402.7L150.6 233.4C138.1 220.9 117.8 220.9 105.3 233.4C92.8 245.9 92.8 266.2 105.3 278.7L297.3 470.7z" />
        </svg>
    );
}

function Seperator({ size = 48 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 640"
            width={size}
            height={size}
        >
            <path d="M96 320C96 289.1 121.1 264 152 264C182.9 264 208 289.1 208 320C208 350.9 182.9 376 152 376C121.1 376 96 350.9 96 320zM264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320zM488 264C518.9 264 544 289.1 544 320C544 350.9 518.9 376 488 376C457.1 376 432 350.9 432 320C432 289.1 457.1 264 488 264z" />
        </svg>
    );
}

function IndexSidebar({
    prizeDetails,
    activeSponsor,
    onSponsorClick,
}: {
    prizeDetails: typeof prices.pageProps.prizeDetails;
    activeSponsor: string | null;
    onSponsorClick: (name: string) => void;
}) {
    const organizer = prizeDetails.filter((s) => s.type === "organizer");
    const partners = prizeDetails.filter((s) => s.type === "sponsor");

    const scrollRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (activeSponsor && itemRefs.current[activeSponsor]) {
            const el = itemRefs.current[activeSponsor];
            const container = scrollRef.current;
            if (!el || !container) return;

            const elOffsetTop = el.offsetTop;
            const elHeight = el.offsetHeight;
            const containerHeight = container.clientHeight;

            const scrollPosition =
                elOffsetTop - containerHeight / 2 + elHeight / 2;

            container.scrollTo({
                top: scrollPosition,
                behavior: "smooth",
            });
        }
    }, [activeSponsor]);

    return (
        <div className="hidden md:block md:sticky md:top-4 w-full md:h-[calc(50vh-2rem)] bg-white rounded-md border border-gray-200 relative px-4 py-5">
            <div
                ref={scrollRef}
                className="overflow-y-auto h-full pb-3.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overscroll-contain"
            >
                <h2 className="text-xs uppercase text-gray-400 font-semibold mb-2">
                    Organizer
                </h2>
                {organizer.map((s) => (
                    <SidebarItem
                        key={s.uuid}
                        s={s}
                        activeSponsor={activeSponsor}
                        onClick={onSponsorClick}
                        itemRefs={itemRefs}
                    />
                ))}

                <h2 className="text-xs uppercase text-gray-400 font-semibold mt-5 mb-2">
                    Partners
                </h2>
                {partners.map((s) => (
                    <SidebarItem
                        key={s.uuid}
                        s={s}
                        activeSponsor={activeSponsor}
                        onClick={onSponsorClick}
                        itemRefs={itemRefs}
                    />
                ))}
            </div>
        </div>
    );
}

function SidebarItem({ s, activeSponsor, onClick, itemRefs }: any) {
    return (
        <div
            ref={(el) => {
                itemRefs.current[s.name] = el;
            }}
            onClick={() => onClick(s.name)}
            className={`cursor-pointer mb-3 rounded-md px-2 py-1.5 transition-colors ${
                activeSponsor === s.name
                    ? "bg-gray-100 text-blue-600"
                    : "hover:bg-gray-50"
            }`}
        >
            <div className="text-sm">{s.name}</div>
            <div className="text-xs text-gray-500">
                Upto ${s.totalPrizeAmount?.toLocaleString()}
            </div>
        </div>
    );
}

const MarkdownRenderer = ({ content }: { content: string | undefined }) => {
    if (!content) return null;

    const decoded = content.replace(/\\n/g, "\n");

    const normalized = decoded
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    return (
        <div className="prose max-w-none prose-headings:font-semibold prose-p:leading-relaxed prose-li:my-1">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children }) => {
                        const videoId = href ? extractYouTubeId(href) : null;

                        if (videoId) {
                            return (
                                <div className="my-4">
                                    <iframe
                                        width="100%"
                                        height="360"
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title="YouTube video player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="rounded-md"
                                    />
                                </div>
                            );
                        }

                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-800"
                            >
                                {children}
                            </a>
                        );
                    },
                    h2: ({ children }) => (
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            {children}
                        </h2>
                    ),
                    li: ({ children }) => (
                        <li className="ml-4 list-disc -my-2">{children}</li>
                    ),
                }}
            >
                {normalized}
            </ReactMarkdown>
        </div>
    );
};

function extractYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname.includes("youtu.be")) {
            return u.pathname.replace("/", "");
        }
        if (u.hostname.includes("youtube.com")) {
            const id = u.searchParams.get("v");
            if (id) return id;
            const pathParts = u.pathname.split("/");
            if (pathParts.includes("embed") || pathParts.includes("shorts")) {
                return pathParts.pop() || null;
            }
        }
        return null;
    } catch {
        return null;
    }
}

export default App;
