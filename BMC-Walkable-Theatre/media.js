export const venueConfig = {
  venueName: 'Balcony Music Club Theatre',
  marqueeTop: 'BALCONY MUSIC CLUB',
  marqueeBottom: 'LIVE MUSIC • VIDEO WALL • WALKABLE THEATRE',
  liveDefaultTitle: 'BMC Live Broadcast',
  liveDefaultSrc: 'https://example.com/live/stream.m3u8'
};

export const shows = [
  {
    id: 'woodys-rampage',
    band: "Woody's Rampage",
    tagline: 'Blues, psych, Gulf Coast electricity',
    date: 'Tonight',
    time: '9:00 PM',
    posterStyle: ['#2c145f', '#ffcb6b', '#4deaff'],
    videoType: 'video',
    videoSrc: 'media/woodys-rampage.mp4',
    tipLine: 'TIP ARTIST: replace with CashApp / Venmo / QR artwork'
  },
  {
    id: 'bmc-live',
    band: 'BMC Live Broadcast',
    tagline: 'The house feed from the room',
    date: 'Live',
    time: 'Now / scheduled',
    posterStyle: ['#0b132b', '#ff4fd8', '#ffd36e'],
    videoType: 'live-hls',
    videoSrc: 'https://example.com/live/stream.m3u8',
    tipLine: 'Replace videoSrc with Cloudflare Stream, Owncast, Twitch embed, or HLS URL'
  },
  {
    id: 'funk-night',
    band: 'Friday Funk Night',
    tagline: 'Pocket grooves and neon brass',
    date: 'Friday',
    time: '10:00 PM',
    posterStyle: ['#132a13', '#73ff8a', '#fff0c9'],
    videoType: 'video',
    videoSrc: 'media/friday-funk-night.mp4',
    tipLine: 'Add poster art later in posters/'
  },
  {
    id: 'songwriter-round',
    band: 'Songwriter Round',
    tagline: 'Stories, guitars, late-night saints',
    date: 'Saturday',
    time: '8:00 PM',
    posterStyle: ['#3b1f1f', '#ffba4d', '#ffd1ff'],
    videoType: 'video',
    videoSrc: 'media/songwriter-round.mp4',
    tipLine: 'Placeholder MP4 path'
  },
  {
    id: 'jazz-balcony',
    band: 'Balcony Jazz Set',
    tagline: 'Smoke-blue chords above Decatur',
    date: 'Sunday',
    time: '7:30 PM',
    posterStyle: ['#112240', '#4deaff', '#ffcb6b'],
    videoType: 'iframe',
    videoSrc: 'https://player.example.com/embed/live',
    tipLine: 'Use iframe mode for compatible hosted players'
  },
  {
    id: 'artist-feature',
    band: 'Artist Feature',
    tagline: 'Poster slot ready for the next band',
    date: 'Next Week',
    time: 'TBA',
    posterStyle: ['#301934', '#ff4fd8', '#fff0c9'],
    videoType: 'video',
    videoSrc: 'media/artist-feature.mp4',
    tipLine: 'Replace this object with the next artist'
  }
];
