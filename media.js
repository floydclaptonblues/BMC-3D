export const venueConfig = {
  venueName: 'French Quarter Broadway Maze',
  marqueeTop: 'BALCONY MUSIC CLUB',
  marqueeBottom: 'FRENCH QUARTER POSTER MAZE • LIVE MUSIC • NEON'
};

// Management schedule revised 2026-10-01. Billings are verbatim; blanks are TBA.
// Only starts were supplied. The existing 150-minute block convention is used
// solely to expire poster listings. No performance media or live status is inferred.
const DAYS = [
  ['2026-10-01', [[18, 'DAPPER DANDIES'], [21, 'KAT KILEY EXPERIENCE']]],
  ['2026-10-02', [[18, 'ELECTRIC BARRELHOUSE'], [21, 'BIG MIKE & RB KINGS']]],
  ['2026-10-03', [[15, 'PARISH LINE'], [18, 'JOSH BENITEZ BAND'], [21, 'ANDRE LOVETT BAND']]],
  ['2026-10-04', [[15, 'DEEJ FK & MOTHER RUCKUS'], [18, 'JAM BRASS BAND'], [21, 'ARMANI SMITH']]],
  ['2026-10-08', [[18, 'MAURICE CADE & ESS'], [21, 'KAT KILEY EXPERIENCE']]],
  ['2026-10-09', [[18, 'ELECTRIC BARRELHOUSE'], [21, 'BIG MIKE & RB KINGS']]],
  ['2026-10-10', [[15, 'TROPICAL WEATHER'], [18, 'TBA'], [21, 'KEEP IT ROLLING BRASS BAND']]],
  ['2026-10-11', [[15, 'DEEJ FK & MOTHER RUCKUS'], [18, 'JAM BRASS BAND'], [21, 'KIM IN THE WIND']]],
  ['2026-10-15', [[18, 'DAPPER DANDIES'], [21, 'KAT KILEY EXPERIENCE']]],
  ['2026-10-16', [[18, 'PARISH LINE'], [21, 'CAESAR BROS']]],
  ['2026-10-17', [[15, 'TROPICAL WEATHER'], [18, 'SUGAR & THE DADDIES'], [21, 'TAMARIE T PLAYMATZ']]],
  ['2026-10-18', [[15, 'DEEJ FK & MOTHER RUCKUS'], [18, 'JAM BRASS BAND'], [21, 'ANDRE LOVETT BAND']]],
  ['2026-10-22', [[18, 'MAURICE CADE & ESS'], [21, 'KAT KILEY EXPERIENCE']]],
  ['2026-10-23', [[18, 'PARISH LINE'], [21, 'BIG MIKE & RB KINGS']]],
  ['2026-10-24', [[15, 'TROPICAL WEATHER'], [18, 'GABE STILLMAN'], [21, 'ESSENTIALS']]],
  ['2026-10-25', [[15, 'DEEJ FK & MOTHER RUCKUS'], [18, 'JAM BRASS BAND'], [21, 'FUNKY SOLES']]],
  ['2026-10-29', [[18, 'DAPPER DANDIES'], [21, 'KEEP IT ROLLING BRASS BAND']]],
  ['2026-10-30', [[18, 'MOTHER RUCKUS'], [21, 'BIG MIKE & RB KINGS']]],
  ['2026-10-31', [[15, 'TROPICAL WEATHER'], [18, 'TBA'], [21, 'KAT KILEY EXPERIENCE']]]
];

export const octoberSchedule = DAYS.flatMap(([date, acts]) =>
  acts.map(([hour, artist]) => ({ date, hour, artist }))
);

const POSTER_STYLES = [
  ['#4d1111', '#ffd36e', '#ff4fd8'], ['#111827', '#4deaff', '#ffd36e'],
  ['#12351f', '#73ff8a', '#ffd36e'], ['#3b1f1f', '#ffba4d', '#ffd1ff'],
  ['#112240', '#4deaff', '#ffcb6b'], ['#301934', '#ff4fd8', '#fff0c9']
];
const CALENDAR_URL = 'https://shows.balconymusicclub.com/';
const MEDIA_NOTE = 'Calendar listing only. Opens the full BMC calendar; no performance video was supplied and no broadcast status is implied.';

export function selectShows(now = new Date()) {
  const values = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  const today = `${values.year}-${values.month}-${values.day}`;
  const minutes = Number(values.hour) * 60 + Number(values.minute);
  // Keep the existing six-poster layout; the complete month remains exported above.
  const selected = octoberSchedule.filter(item => item.date > today ||
    (item.date === today && minutes < item.hour * 60 + 150)).slice(0, 6);
  const posters = selected.map((item, i) => {
    const date = new Date(item.date + 'T12:00:00Z');
    const dayLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    }).format(date);
    return {
      id: `bmc-${item.date}-${item.hour}`,
      band: item.artist,
      tagline: item.artist === 'TBA' ? 'Artist to be announced' : 'October 2026 scheduled performance',
      date: dayLabel,
      // Include the date here too because the street board renders only time + band.
      time: `Oct ${Number(item.date.slice(-2))} • ${item.hour - 12}:00 PM CT`,
      posterStyle: POSTER_STYLES[i % POSTER_STYLES.length],
      videoType: 'iframe', videoSrc: CALENDAR_URL,
      note: MEDIA_NOTE, tipLine: MEDIA_NOTE
    };
  });
  // The nested theatre screen references shows[1]. Supply navigation cards, not
  // invented bookings, when fewer than two future listings remain.
  while (posters.length < 2) {
    posters.push({
      id: `bmc-calendar-link-${posters.length}`, band: 'BMC Show Calendar',
      tagline: 'Open the full calendar for the latest listings', date: 'Schedule information',
      time: 'See full calendar', posterStyle: POSTER_STYLES[posters.length],
      videoType: 'iframe', videoSrc: CALENDAR_URL, note: MEDIA_NOTE, tipLine: MEDIA_NOTE
    });
  }
  return posters;
}

export const shows = selectShows();
