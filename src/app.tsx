import prices from "./prices.json";
import { useState, useMemo, useRef, useEffect } from "react";
import { Routes, Route, useLocation, useSearchParams } from "react-router-dom";

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
        <div className="bg-bg">
            <div className="w-full max-w-320 md:w-[85%] lg:w-[75%] mx-auto h-full font-geist bg-bg pb-[500px]">
                <div className="min-h-screen flex flex-col">
                    <div className="flex w-full">
                        <div className="w-[30%]">
                            <IndexSidebar
                                prizeDetails={prizeDetails}
                                activeSponsor={activeSponsor}
                                onSponsorClick={(name) => {
                                    document
                                        .getElementById(name)
                                        ?.scrollIntoView({
                                            behavior: "smooth",
                                        });
                                }}
                            />
                        </div>

                        <div className="w-[70%] px-10">
                            <div className="w-full">
                                <Content
                                    prizeDetails={prizeDetails}
                                    onActiveSponsorChange={setActiveSponsor}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Content({
    prizeDetails,
    onActiveSponsorChange,
}: {
    prizeDetails: typeof prices.pageProps.prizeDetails;
    onActiveSponsorChange: (name: string | null) => void;
}) {
    const [query, setQuery] = useState("");

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
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search track or prize name..."
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            <SponsorPrizes
                prizeDetails={filteredDetails}
                onActiveSponsorChange={onActiveSponsorChange}
            />
        </div>
    );
}

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
        const handleScroll = () => {
            let currentVisible: string | null = null;

            for (const sponsor of prizeDetails) {
                const el = sponsorRefs.current[sponsor.name];
                if (!el) continue;

                const rect = el.getBoundingClientRect();
                if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
                    currentVisible = sponsor.name;
                    break;
                }
            }

            onActiveSponsorChange(currentVisible);

            if (currentVisible) {
                const url = new URL(window.location.href);
                const existing = url.searchParams.get("sponsor");
                if (existing !== currentVisible) {
                    url.searchParams.set("sponsor", currentVisible);
                    window.history.replaceState({}, "", url.toString());
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [prizeDetails, onActiveSponsorChange]);

    return (
        <div>
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
                        className="scroll-mt-24" // offset for sticky header
                    >
                        <div className="flex items-center gap-4 border border-gray-200 bg-white px-5 py-4">
                            {sponsor.logo && (
                                <div className="flex items-center justify-center rounded-md">
                                    <img
                                        src={sponsor.logo}
                                        alt={sponsor.name}
                                        className="h-12 w-12 object-contain rounded"
                                    />
                                </div>
                            )}
                            <div>
                                <div className="text-base tracking-wide font-bold text-gray-900">
                                    {sponsor.name}
                                </div>
                                <div className="text-[14px] text-gray-500 font-mono font-bold">
                                    ${totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <TrackList tracks={sponsor.tracks} />
                        </div>

                        {prizeDetails.length - 1 != index && (
                            <div className="fill-gray-400 h-20 flex items-center">
                                <div className="mx-auto w-fit h-auto">
                                    <Seperator size={30} />
                                </div>
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
    if (!tracks || tracks.length === 0) return null;

    const sortedTracks = [...tracks].sort((a, b) => {
        const totalA =
            a.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const totalB =
            b.prizes?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        return totalB - totalA;
    });

    return (
        <div className="mt-4 bg-white border border-gray-200 flex flex-col">
            {sortedTracks.map((track) => {
                const totalAmount =
                    track.prizes?.reduce(
                        (sum, p) => sum + (p.amount || 0),
                        0
                    ) || 0;

                return (
                    <div
                        key={track.uuid}
                        className="flex items-center justify-between border-b border-gray-100 py-2 px-2"
                    >
                        <div className="text-[15px] text-gray-800 w-[80%] truncate">
                            {track.name}
                        </div>
                        <div className="text-[14px] text-gray-500 font-mono">
                            ${totalAmount.toLocaleString()}
                        </div>
                    </div>
                );
            })}
        </div>
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

            const elRect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            if (
                elRect.top < containerRect.top + 16 ||
                elRect.bottom > containerRect.bottom - 16
            ) {
                el.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                });
            }
        }
    }, [activeSponsor]);

    return (
        <div className="sticky top-4 w-full h-[calc(50vh-2rem)] bg-white rounded-md border border-gray-200 relative px-4 py-5">
            <div
                ref={scrollRef}
                className="overflow-y-auto h-full pb-3.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] overscroll-contain"
            >
                <h2 className="text-xs uppercase text-gray-400 font-semibold mb-2">
                    Organizer
                </h2>
                {organizer.map((s) => (
                    <div
                        key={s.uuid}
                        ref={(el) => {
                            itemRefs.current[s.name] = el;
                        }}
                        onClick={() => onSponsorClick(s.name)}
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
                ))}

                <h2 className="text-xs uppercase text-gray-400 font-semibold mt-5 mb-2">
                    Partners
                </h2>
                {partners.map((s) => (
                    <div
                        key={s.uuid}
                        ref={(el) => {
                            itemRefs.current[s.name] = el;
                        }}
                        onClick={() => onSponsorClick(s.name)}
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
                ))}
            </div>

            <div className="pointer-events-none absolute bottom-0 left-0 w-full h-15 bg-gradient-to-t from-white/15 to-transparent rounded-b-md" />
        </div>
    );
}

export default App;
