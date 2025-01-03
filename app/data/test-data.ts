export const testLiveEvent = {
    day: ["1"],
    isLive: true,
    slug: "test-live",
    description: "This is a test of the live player - ignore",
    status: "running",
    type: "devroom",
    track: "Radio",
    trackKey: "radio",
    title: "THIS IS A TEST OF THE LIVE PLAYER - IGNORE",
    persons: ["Nicholas Griffin"],
    links: [{
        href: "https://rdmedia.bbc.co.uk/testcard/simulcast/",
        title: "BBC R&D Test Cards",
        type: "external"
    }],
    streams: [
        {
            href: "https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/avc-full.m3u8",
            title: "AVC (All representations in all languages)",
            type: "application/vnd.apple.mpegurl"
        },
        {
            href: "https://rdmedia.bbc.co.uk/testcard/simulcast/manifests/radio-en.m3u8",
            title: "Audio Only (HE and LC AAC Stereo in English)",
            type: "application/vnd.apple.mpegurl"
        },
    ],
    chat: 'https://fosdem.org/2025/schedule/event/test-live/chat',
    room: "UB2.147",
    id: "test-live",
    startTime: "15:30",
    duration: "01:00",
    abstract: "<p>This is just a test to confirm things work before FOSDOM</p>"
}

export const testConference = {
    "acronym": {
        "_text": "fosdem-2025"
    },
    "title": {
        "_text": "FOSDEM 2025"
    },
    "subtitle": {},
    "venue": {
        "_text": "ULB (Université Libre de Bruxelles)"
    },
    "city": {
        "_text": "Brussels"
    },
    "start": {
        "_text": "2025-02-01"
    },
    "end": {
        "_text": "2025-02-02"
    },
    "days": {
        "_text": "2"
    },
    "day_change": {
        "_text": "09:00:00"
    },
    "timeslot_duration": {
        "_text": "00:05:00"
    },
    "base_url": {
        "_text": "https://fosdem.org/2025/schedule/"
    },
    "time_zone_name": {
        "_text": "Europe/Brussels"
    }
}