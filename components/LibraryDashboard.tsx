"use client";

import { useMemo, useState } from "react";
import type { LibraryData, Track } from "@/lib/library";

type SortKey = "plays" | "recent" | "title";
type TimelineMode = "played" | "added";

const ALL = "All";
const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const number = new Intl.NumberFormat("en");

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function hours(milliseconds: number) {
  return number.format(Math.round(milliseconds / 3_600_000));
}

function decadeOf(year: number | null) {
  return year ? `${Math.floor(year / 10) * 10}s` : "Unknown";
}

function ranked(
  tracks: Track[],
  selector: (track: Track) => string,
  value: (track: Track) => number,
) {
  const totals = new Map<string, number>();
  tracks.forEach((track) => {
    const key = selector(track);
    totals.set(key, (totals.get(key) ?? 0) + value(track));
  });
  return [...totals.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function dateFor(track: Track, mode: TimelineMode) {
  return mode === "played" ? track.lastPlayed : track.dateAdded;
}

export default function LibraryDashboard({
  library,
  source,
  onNewLibrary,
}: {
  library: LibraryData;
  source: string;
  onNewLibrary: () => void;
}) {
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState(ALL);
  const [decade, setDecade] = useState(ALL);
  const [artist, setArtist] = useState(ALL);
  const [minPlays, setMinPlays] = useState(0);
  const [sort, setSort] = useState<SortKey>("plays");
  const [timelineMode, setTimelineMode] = useState<TimelineMode>("played");
  const [timelineYear, setTimelineYear] = useState(ALL);

  const genres = useMemo(
    () =>
      ranked(library.tracks, (track) => track.genre, () => 1)
        .slice(0, 9)
        .map((entry) => entry.label),
    [library.tracks],
  );
  const decades = useMemo(
    () =>
      [...new Set(library.tracks.map((track) => decadeOf(track.year)))]
        .filter((item) => item !== "Unknown")
        .sort(),
    [library.tracks],
  );
  const timelineYears = useMemo(
    () =>
      [...new Set(
        library.tracks
          .map((track) => dateFor(track, timelineMode)?.slice(0, 4))
          .filter((year): year is string => Boolean(year)),
      )].sort().reverse(),
    [library.tracks, timelineMode],
  );

  const maxPlays = library.tracks[0]?.plays ?? 0;
  const search = query.trim().toLocaleLowerCase();
  const filtered = useMemo(
    () =>
      library.tracks.filter((track) => {
        const text = `${track.name} ${track.artist} ${track.album}`.toLocaleLowerCase();
        const timelineDate = dateFor(track, timelineMode);
        return (
          (!search || text.includes(search)) &&
          (genre === ALL || track.genre === genre) &&
          (decade === ALL || decadeOf(track.year) === decade) &&
          (artist === ALL || track.artist === artist) &&
          (timelineYear === ALL || timelineDate?.startsWith(timelineYear)) &&
          track.plays >= minPlays
        );
      }),
    [artist, decade, genre, library.tracks, minPlays, search, timelineMode, timelineYear],
  );

  const visibleTracks = useMemo(() => {
    const result = [...filtered];
    if (sort === "title") return result.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "recent") {
      return result.sort(
        (a, b) => (dateFor(b, timelineMode) ?? "").localeCompare(dateFor(a, timelineMode) ?? ""),
      );
    }
    return result.sort((a, b) => b.plays - a.plays);
  }, [filtered, sort, timelineMode]);

  const totalPlays = filtered.reduce((sum, track) => sum + track.plays, 0);
  const listeningMs = filtered.reduce((sum, track) => sum + track.durationMs * track.plays, 0);
  const artistCount = new Set(filtered.map((track) => track.artist)).size;
  const albumCount = new Set(filtered.map((track) => track.album)).size;
  const topTracks = [...filtered].sort((a, b) => b.plays - a.plays);
  const topArtists = ranked(filtered, (track) => track.artist, (track) => track.plays).slice(0, 8);
  const topAlbums = ranked(filtered, (track) => track.album, (track) => track.plays);
  const genrePlays = ranked(filtered, (track) => track.genre, (track) => track.plays);
  const genreMix = ranked(filtered, (track) => track.genre, () => 1).slice(0, 6);
  const releaseArc = ranked(
    filtered.filter((track) => track.year !== null),
    (track) => decadeOf(track.year),
    () => 1,
  ).sort((a, b) => a.label.localeCompare(b.label));
  const months = Array.from({ length: 12 }, (_, month) => {
    const prefix = timelineYear === ALL ? null : `${timelineYear}-${String(month + 1).padStart(2, "0")}`;
    const monthTracks = prefix
      ? library.tracks.filter((track) => dateFor(track, timelineMode)?.startsWith(prefix))
      : [];
    return {
      label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(2020, month)),
      count: monthTracks.reduce((sum, track) => sum + (timelineMode === "played" ? track.plays : 1), 0),
    };
  });
  const leadingPlays = Math.max(topArtists[0]?.count ?? 0, 1);
  const leadingGenre = Math.max(genreMix[0]?.count ?? 0, 1);
  const leadingEra = Math.max(...releaseArc.map((entry) => entry.count), 1);
  const leadingMonth = Math.max(...months.map((entry) => entry.count), 1);
  const isFiltered =
    search !== "" ||
    genre !== ALL ||
    decade !== ALL ||
    artist !== ALL ||
    timelineYear !== ALL ||
    minPlays !== 0;
  const highlights = [
    {
      label: "Top song",
      title: topTracks[0]?.name ?? "No track",
      detail: topTracks[0] ? `${topTracks[0].artist} - ${number.format(topTracks[0].plays)} plays` : "",
    },
    {
      label: "Top album",
      title: topAlbums[0]?.label ?? "No album",
      detail: topAlbums[0] ? `${number.format(topAlbums[0].count)} plays` : "",
    },
    {
      label: "Top genre",
      title: genrePlays[0]?.label ?? "No genre",
      detail: genrePlays[0] ? `${number.format(genrePlays[0].count)} plays` : "",
    },
    {
      label: "Estimated time",
      title: `${hours(listeningMs)} hours`,
      detail: "based on track lengths x play counts",
    },
  ];

  function reset() {
    setQuery("");
    setGenre(ALL);
    setDecade(ALL);
    setArtist(ALL);
    setMinPlays(0);
    setTimelineYear(ALL);
  }

  return (
    <main className="shell">
      <header className="hero">
        <nav className="nav">
          <span className="brand"><span className="brandDot" /> Replay Room</span>
          <div className="navActions">
            <span className="export">{source} - {formatDate(library.exportedAt)}</span>
            <button className="switchLibrary" onClick={onNewLibrary}>New library</button>
          </div>
        </nav>
        <div className="heroGrid">
          <div>
            <p className="eyebrow">Your personal music replay</p>
            <h1>Your listening history, played back visually.</h1>
            <p className="intro">
              Explore {number.format(library.summary.trackCount)} tracks collected between{" "}
              {formatDate(library.summary.firstAdded)} and {formatDate(library.summary.lastAdded)}.
              Filter your latest-play timeline, surface favorites, and revisit your library.
            </p>
          </div>
          <div className="nowPlaying">
            <p className="cardLabel">Most played artist</p>
            <h2>{topArtists[0]?.label ?? library.summary.topArtist ?? "No artist"}</h2>
            <div className="soundWave" aria-hidden="true">
              {Array.from({ length: 22 }, (_, index) => <span key={index} />)}
            </div>
            <p className="muted">{number.format(topArtists[0]?.count ?? 0)} recorded plays in this view</p>
          </div>
        </div>
      </header>

      <section className="replayCards" aria-label="Replay highlights">
        {highlights.map((highlight) => (
          <article className="replayCard" key={highlight.label}>
            <p>{highlight.label}</p>
            <h2>{highlight.title}</h2>
            <small>{highlight.detail}</small>
          </article>
        ))}
      </section>

      <section className="metrics" aria-label="Library summary">
        {[
          ["Tracks", filtered.length],
          ["Plays", totalPlays],
          ["Artists", artistCount],
          ["Albums", albumCount],
        ].map(([label, value]) => (
          <article className="metric" key={label}>
            <p>{label}</p>
            <strong>{number.format(value as number)}</strong>
            {isFiltered && <small>in selection</small>}
          </article>
        ))}
      </section>

      <section className="timeline panel" aria-label="Timeline filter">
        <div className="panelHeading timelineHeading">
          <div>
            <p className="cardLabel">Timeline</p>
            <h2>{timelineYear === ALL ? "Choose a year to replay" : `${timelineYear} at a glance`}</h2>
          </div>
          <div className="timelineControls">
            <select
              aria-label="Timeline type"
              value={timelineMode}
              onChange={(event) => {
                setTimelineMode(event.target.value as TimelineMode);
                setTimelineYear(ALL);
              }}
            >
              <option value="played">Last played</option>
              <option value="added">Added to library</option>
            </select>
            <select
              aria-label="Timeline year"
              value={timelineYear}
              onChange={(event) => setTimelineYear(event.target.value)}
            >
              <option value={ALL}>All years</option>
              {timelineYears.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
        </div>
        {timelineYear === ALL ? (
          <p className="timelinePrompt">
            Select a year to chart {timelineMode === "played" ? "the tracks most recently played" : "new library additions"} month by month.
          </p>
        ) : (
          <div className="monthChart">
            {months.map((month) => (
              <div key={month.label}>
                <b>{month.count ? compact.format(month.count) : ""}</b>
                <span style={{ height: `${Math.max((month.count / leadingMonth) * 95, 3)}px` }} />
                <small>{month.label}</small>
              </div>
            ))}
          </div>
        )}
        {timelineMode === "played" && (
          <p className="timelineNote">
            Apple Music XML records each track&apos;s latest play date and cumulative play count.
            Annual totals here are lifetime plays for tracks last played in the selected year.
          </p>
        )}
      </section>

      <section className="controls" aria-label="Track filters">
        <div className="searchField">
          <label htmlFor="search">Find a track, artist, or album</label>
          <input
            id="search"
            placeholder="Search your replay"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="rangeField">
          <label htmlFor="plays">Minimum plays <b>{minPlays}</b></label>
          <input
            id="plays"
            type="range"
            min="0"
            max={maxPlays}
            value={minPlays}
            onChange={(event) => setMinPlays(Number(event.target.value))}
          />
        </div>
        <button className="clear" disabled={!isFiltered} onClick={reset}>Clear filters</button>
        <div className="pills wide">
          <button className={genre === ALL ? "active" : ""} onClick={() => setGenre(ALL)}>All genres</button>
          {genres.map((item) => (
            <button className={genre === item ? "active" : ""} key={item} onClick={() => setGenre(item)}>{item}</button>
          ))}
        </div>
        <div className="pills decades">
          <button className={decade === ALL ? "active" : ""} onClick={() => setDecade(ALL)}>Every era</button>
          {decades.map((item) => (
            <button className={decade === item ? "active" : ""} key={item} onClick={() => setDecade(item)}>{item}</button>
          ))}
        </div>
      </section>

      <section className="charts">
        <article className="panel artistPanel">
          <div className="panelHeading">
            <div>
              <p className="cardLabel">By recorded plays</p>
              <h2>Top artists</h2>
            </div>
            {artist !== ALL && <button className="tag" onClick={() => setArtist(ALL)}>{artist} x</button>}
          </div>
          <div className="bars">
            {topArtists.map((entry, index) => (
              <button
                className={`barRow ${artist === entry.label ? "selected" : ""}`}
                key={entry.label}
                onClick={() => setArtist(artist === entry.label ? ALL : entry.label)}
              >
                <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                <span className="barName">{entry.label}</span>
                <span className="barTrack"><span style={{ width: `${(entry.count / leadingPlays) * 100}%` }} /></span>
                <b>{compact.format(entry.count)}</b>
              </button>
            ))}
          </div>
        </article>
        <article className="panel sidePanel">
          <p className="cardLabel">Track collection</p>
          <h2>Genre mix</h2>
          <div className="genreList">
            {genreMix.map((entry) => (
              <button key={entry.label} onClick={() => setGenre(entry.label)}>
                <span>{entry.label}</span><b>{entry.count}</b>
                <i style={{ width: `${(entry.count / leadingGenre) * 100}%` }} />
              </button>
            ))}
          </div>
          <div className="eraTitle"><p className="cardLabel">Release years</p><h2>Era spread</h2></div>
          <div className="eraChart">
            {releaseArc.map((entry) => (
              <button key={entry.label} onClick={() => setDecade(entry.label)}>
                <span style={{ height: `${Math.max((entry.count / leadingEra) * 82, 8)}px` }} />
                <small>{entry.label}</small>
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="panel tracksPanel">
        <div className="panelHeading tableHeading">
          <div><p className="cardLabel">Browse library</p><h2>{number.format(filtered.length)} tracks found</h2></div>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort tracks">
            <option value="plays">Most played</option>
            <option value="recent">Timeline date</option>
            <option value="title">Track title</option>
          </select>
        </div>
        <div className="tableWrap">
          <table>
            <thead>
              <tr><th>Track</th><th>Artist</th><th>Album</th><th>Genre</th><th className="numeric">Plays</th></tr>
            </thead>
            <tbody>
              {visibleTracks.slice(0, 60).map((track) => (
                <tr key={track.id}>
                  <td><strong>{track.name}</strong><small>{track.year ?? "Year unknown"}</small></td>
                  <td>{track.artist}</td>
                  <td>{track.album}</td>
                  <td><span className="genreBadge">{track.genre}</span></td>
                  <td className="numeric">{track.plays}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleTracks.length > 60 && <p className="tableNote">Showing the first 60 results. Narrow the filters to explore deeper.</p>}
          {visibleTracks.length === 0 && <div className="empty">No tracks match this selection. Clear a filter and try again.</div>}
        </div>
      </section>
      <footer>Built locally from your Apple Music XML export. Your library file never leaves this browser.</footer>
    </main>
  );
}
