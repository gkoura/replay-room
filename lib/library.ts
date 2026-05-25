export type Track = {
  id: string;
  name: string;
  artist: string;
  album: string;
  genre: string;
  year: number | null;
  plays: number;
  skips: number;
  durationMs: number;
  dateAdded: string | null;
  lastPlayed: string | null;
};

export type LibraryData = {
  exportedAt: string | null;
  summary: {
    trackCount: number;
    artistCount: number;
    albumCount: number;
    totalPlays: number;
    totalSkips: number;
    listeningMs: number;
    firstAdded: string | null;
    lastAdded: string | null;
    topArtist: string | null;
  };
  tracks: Track[];
};

function earliest(values: Array<string | null>) {
  return values.filter((value): value is string => Boolean(value)).sort()[0] ?? null;
}

function latest(values: Array<string | null>) {
  return values.filter((value): value is string => Boolean(value)).sort().at(-1) ?? null;
}

export function createLibrary(tracks: Track[], exportedAt: string | null): LibraryData {
  const artistPlays = new Map<string, number>();
  tracks.forEach((track) => {
    artistPlays.set(track.artist, (artistPlays.get(track.artist) ?? 0) + track.plays);
  });

  const topArtist =
    [...artistPlays.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const sortedTracks = [...tracks].sort(
    (a, b) => b.plays - a.plays || a.name.localeCompare(b.name),
  );

  return {
    exportedAt,
    summary: {
      trackCount: tracks.length,
      artistCount: new Set(tracks.map((track) => track.artist)).size,
      albumCount: new Set(tracks.map((track) => track.album)).size,
      totalPlays: tracks.reduce((sum, track) => sum + track.plays, 0),
      totalSkips: tracks.reduce((sum, track) => sum + track.skips, 0),
      listeningMs: tracks.reduce(
        (sum, track) => sum + track.durationMs * track.plays,
        0,
      ),
      firstAdded: earliest(tracks.map((track) => track.dateAdded)),
      lastAdded: latest(tracks.map((track) => track.dateAdded)),
      topArtist,
    },
    tracks: sortedTracks,
  };
}
