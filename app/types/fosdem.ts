export interface Conference {
    conference: any;
    types: Record<string, any>;
    days: Record<string, any>;
    tracks: Record<string, Track>;
    events: Record<string, Event>;
}

export interface Track {
    id: string;
    name: string;
    description: string;
    room: string;
    type: string;
    day: number;
}

export interface Event {
    title: string;
    description: string;
    room: string;
    persons: string[];
    slug: string;
    id: string;
    startTime: string;
    duration: string;
    abstract: string;
    chat: string;
    links: {
        href: string;
        title: string;
        type: string;
    }[];
    streams: {
        href: string;
        title: string;
        type: string;
    }[];
    day: string[];
    trackKey: string;
    isLive: boolean;
    status: string;
    type: string;
}

export interface DayGroupedData {
    [key: string]: any[];
}