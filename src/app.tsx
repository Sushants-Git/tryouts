import prices from "./prices.json";

function App() {
    const prizeDetails = prices.pageProps.prizeDetails;

    return (
        <div className="w-full max-w-320 md:w-[85%] lg:w-[75%] mx-auto h-full border font-geist">
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

function Content({
    prizeDetails,
}: {
    prizeDetails: typeof prices.pageProps.prizeDetails;
}) {
    return (
        <div>
            <SponsorPrizes prizeDetails={prizeDetails} />
        </div>
    );
}

const SponsorPrizes = ({
    prizeDetails,
}: {
    prizeDetails: typeof prices.pageProps.prizeDetails;
}) => {
    return (
        <div>
            {prizeDetails.map((sponsor) => {
                const totalAmount = sponsor.tracks?.reduce((sum, track) => {
                    const trackSum = track.prizes?.reduce(
                        (a, p) => a + (p.amount || 0),
                        0
                    );
                    return sum + trackSum;
                }, 0);

                return (
                    <div>
                        <div
                            key={sponsor.uuid}
                            className="flex items-center gap-4 border border-gray-200 bg-white px-5 py-4"
                        >
                            {sponsor.logo ? (
                                <div className="flex items-center justify-center rounded-md bg-black">
                                    <img
                                        src={sponsor.logo}
                                        alt={sponsor.name}
                                        className="h-12 w-12 object-contain rounded"
                                    />
                                </div>
                            ) : null}

                            <div>
                                <div className="text-base tracking-wide font-semibold text-gray-900">
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

                        <div className="fill-gray-400 h-20 flex items-center">
                            <div className="mx-auto w-fit h-auto">
                                <Seperator size={30} />
                            </div>
                        </div>
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
        <div className="mt-4 space-y-6">
            {sortedTracks.map((track) => {
                const totalAmount =
                    track.prizes?.reduce(
                        (sum, p) => sum + (p.amount || 0),
                        0
                    ) || 0;

                return (
                    <div
                        key={track.uuid}
                        className="flex items-center justify-between border-b border-gray-100 pb-2"
                    >
                        <div className="text-[14px] text-gray-800">
                            {track.name}
                        </div>
                        <div className="text-[13px] text-gray-500 font-mono">
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

export default App;
