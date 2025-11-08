import prices from "./prices.json";
import type { PrizeDetail, PrizeDetailsRoot, PrizeEntity } from "./type";

function App() {
    const prizeDetails = prices.pageProps.prizeDetails;

    return (
        <div className="w-full max-w-320 md:w-[85%] lg:w-[75%] mx-auto h-full border">
            <div className="min-h-screen flex flex-col">
                <div className="flex w-full">
                    <div className="w-[30%] border border-red-400">index</div>

                    <div className="w-[70%] px-10">
                        <div className="h-20">som</div>
                        <div className="w-full">
                            <Content prizeDetails={prizeDetails} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Content({ prizeDetails }: { prizeDetails: PrizeDetail[] }) {
    return (
        <div>
            <SponsorPrizes prizeDetails={prizeDetails} />
        </div>
    );
}

const SponsorPrizes = ({ prizeDetails }) => {
    return (
        <div className="space-y-6">
            {prizeDetails.map((sponsor) => {
                // calculate total amount from all tracks' prizes
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
                        className="flex items-center gap-4 border border-gray-200 bg-white px-5 py-4"
                    >
                        {sponsor.logo ? (
                            <div className="flex items-center justify-center rounded-md bg-black">
                                <img
                                    src={sponsor.logo}
                                    alt={sponsor.name}
                                    className="h-10 w-10 object-contain rounded"
                                />
                            </div>
                        ) : null}

                        <div>
                            <div className="text-[15px] font-semibold text-gray-900">
                                {sponsor.name}
                            </div>
                            <div className="text-[14px] text-gray-500 font-mono">
                                ${totalAmount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

function PatternSVG() {
    return (
        <div className="absolute inset-0 text-gray-200/60">
            <svg width="100%" height="100%">
                <defs>
                    <pattern
                        id="pattern-diagonal"
                        viewBox="0 0 10 10"
                        width="8"
                        height="8"
                        patternUnits="userSpaceOnUse"
                    >
                        <line
                            x1="0"
                            y1="10"
                            x2="10"
                            y2="0"
                            stroke="currentColor"
                            vectorEffect="non-scaling-stroke"
                        />
                    </pattern>
                </defs>
                <rect
                    width="100%"
                    height="100%"
                    fill="url(#pattern-diagonal)"
                />
            </svg>
        </div>
    );
}

export default App;
