export const venueConfig = {
  venueName: 'French Quarter Broadway Maze',
  marqueeTop: 'BALCONY MUSIC CLUB',
  marqueeBottom: 'FRENCH QUARTER POSTER MAZE • LIVE MUSIC • NEON'
};

export const shows = [
  { id:'woodys-rampage', band:"Woody's Rampage", tagline:'Blues, psych, Gulf Coast electricity', date:'Tonight', time:'9:00 PM', posterStyle:['#4d1111','#ffd36e','#ff4fd8'], videoType:'video', videoSrc:'media/woodys-rampage.mp4', note:'Replace with real poster art and media later.' },
  { id:'bmc-live', band:'BMC Live Broadcast', tagline:'The room feed glowing from the Quarter', date:'Live', time:'Now', posterStyle:['#111827','#4deaff','#ffd36e'], videoType:'live-hls', videoSrc:'https://example.com/live/stream.m3u8', note:'Replace with the real broadcast stream.' },
  { id:'funk-night', band:'Friday Funk Night', tagline:'Pocket grooves and neon brass', date:'Friday', time:'10:00 PM', posterStyle:['#12351f','#73ff8a','#ffd36e'], videoType:'video', videoSrc:'media/friday-funk-night.mp4', note:'Poster slot placeholder.' },
  { id:'songwriter-round', band:'Songwriter Round', tagline:'Stories, guitars, late-night saints', date:'Saturday', time:'8:00 PM', posterStyle:['#3b1f1f','#ffba4d','#ffd1ff'], videoType:'video', videoSrc:'media/songwriter-round.mp4', note:'Poster slot placeholder.' },
  { id:'jazz-balcony', band:'Balcony Jazz Set', tagline:'Smoke-blue chords above Decatur', date:'Sunday', time:'7:30 PM', posterStyle:['#112240','#4deaff','#ffcb6b'], videoType:'iframe', videoSrc:'https://player.example.com/embed/live', note:'Use iframe mode for hosted players.' },
  { id:'artist-feature', band:'Artist Feature', tagline:'Another glowing poster slot', date:'Next Week', time:'TBA', posterStyle:['#301934','#ff4fd8','#fff0c9'], videoType:'video', videoSrc:'media/artist-feature.mp4', note:'Replace this with the next artist.' }
];
