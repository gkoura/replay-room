# Replay Room

### A private, interactive replay for your Apple Music library.

[Try Replay Room live](https://gkoura.github.io/replay-room/)

Replay Room turns an Apple Music or iTunes `Library.xml` export into a personal
listening dashboard. Drop in your library file and explore your top artists,
favorite tracks, albums, genres, listening time, and a year-by-year timeline in
a polished Replay-inspired experience.

## Privacy First

Your library is processed entirely in your browser.

- The XML file is never uploaded to a server.
- No account, database, or analytics pipeline stores your listening data.
- The deployed application contains no bundled personal music library.

## Features

- Upload or drag and drop an Apple Music / iTunes library XML export.
- See Replay-style highlights for top song, album, artist, genre, and estimated listening hours.
- Explore a timeline by latest play date or by date added to your library.
- Filter tracks by genre, era, artist, search term, and minimum plays.
- Browse and sort the matching track list.
- Use the app as a fully static site hosted on GitHub Pages.

## How To Use It

1. Export an XML library file from the Music app or iTunes.
2. Visit [Replay Room](https://gkoura.github.io/replay-room/).
3. Drop `Library.xml` into the upload area or choose it from your device.
4. Explore your replay dashboard locally in the browser.

## A Note On Timeline Data

Apple Music library XML exports provide cumulative play counts and each track's
latest play date, rather than a complete stream-by-stream listening history.
For that reason, the **Last played** yearly view shows lifetime totals for tracks
whose latest recorded play falls within the selected year. The app calls this
out in the interface so the visualization remains honest about the available
data.

## Local Development

Requirements: Node.js 20 or later.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload an XML export.

To verify a production build:

```bash
npm run typecheck
npm run build
```

## Deployment

Replay Room uses Next.js static export and is deployed with GitHub Actions to
GitHub Pages. Assets are built for the `/replay-room` project path during the
Pages workflow.

## Tech Stack

- Next.js
- React
- TypeScript
- GitHub Pages and GitHub Actions

---

Replay Room is an independent project and is not affiliated with Apple or Apple Music.
