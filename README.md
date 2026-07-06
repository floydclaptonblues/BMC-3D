# BMC Walkable Theatre

A walkable venue website prototype for Balcony Music Club-style streaming.

This is a Three.js world with:

- street exterior
- glowing theatre marquee
- poster lobby
- BMC-inspired bar room
- schedule board
- Tip Artist panel placeholder
- theatre room with clickable video/live screen
- data-driven band posters from `media.js`
- static MP4 mode
- HLS/live broadcast mode
- iframe/embed mode
- Windows BAT launcher
- GitHub Pages-friendly static files

## Run locally on Windows

Double-click:

```text
RUN-WINDOWS.bat
```

Keep the command window open while using the world.

## Manual local run

```bash
py -m http.server 8000
```

or:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Publish on GitHub Pages

1. Go to **Settings → Pages**.
2. Choose **Deploy from branch**.
3. Select `main` and `/root`.
4. Save.
5. Hard refresh the Pages URL with `Ctrl + F5`.

## Replacing posters and videos

Edit `media.js`.

Static video:

```js
{
  videoType: 'video',
  videoSrc: 'media/my-video.mp4'
}
```

Live HLS stream:

```js
{
  videoType: 'live-hls',
  videoSrc: 'https://your-live-url/live.m3u8'
}
```

Iframe/embed player:

```js
{
  videoType: 'iframe',
  videoSrc: 'https://your-player-url/embed'
}
```

## Real media folders

Put MP4 files in:

```text
media/
```

Put poster images or QR images in:

```text
posters/
```

The first prototype generates poster art procedurally from `media.js`, so it works before real artwork exists.
