interface Prize {
    uuid: string;
    name: string;
    amount: number;
    currency: string | null;
    quantity: number;
    desc: string;
    track_uuid: string;
    sponsors: string[];
    hasWinners: boolean;
}

interface Track {
    uuid: string;
    name: string;
    description: string;
    prizes: Prize[];
    sponsorUUID: string | null;
}

interface BasePrizeDetail {
    uuid: string;
    name: string;
    logo: string;
    desc: string | null;
    type: string;
    prizes: never[];
    totalPrizeAmount: number;
    totalPrizeCurrency: string;
}

interface OrganizerPrizeDetail extends BasePrizeDetail {
    type: "organizer";
    tracks: Track[];
}

interface SponsorPrizeDetail extends BasePrizeDetail {
    type: "sponsor";
    tracks: Track[];
}

export type PrizeDetail = OrganizerPrizeDetail | SponsorPrizeDetail;
