import { createLibrary, type LibraryData, type Track } from "@/lib/library";

type PlistRecord = Record<string, unknown>;

function valueOf(element: Element): unknown {
  switch (element.tagName) {
    case "dict": {
      const result: PlistRecord = {};
      const entries = Array.from(element.children);
      for (let index = 0; index < entries.length; index += 2) {
        const key = entries[index]?.textContent ?? "";
        const value = entries[index + 1];
        if (key && value) result[key] = valueOf(value);
      }
      return result;
    }
    case "array":
      return Array.from(element.children).map(valueOf);
    case "integer":
    case "real":
      return Number(element.textContent ?? 0);
    case "true":
      return true;
    case "false":
      return false;
    default:
      return element.textContent ?? "";
  }
}

function text(record: PlistRecord, key: string, fallback: string) {
  const value = record[key];
  return typeof value === "string" && value ? value : fallback;
}

function amount(record: PlistRecord, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function optionalNumber(record: PlistRecord, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function date(record: PlistRecord, key: string) {
  const value = record[key];
  return typeof value === "string" && value ? value : null;
}

export function parseLibraryXml(xml: string): LibraryData {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  if (document.querySelector("parsererror")) {
    throw new Error("This file is not valid XML.");
  }

  const dictionary = document.querySelector("plist > dict");
  if (!dictionary) throw new Error("This does not look like an Apple Music library export.");
  const root = valueOf(dictionary) as PlistRecord;
  const sourceTracks = root.Tracks as PlistRecord | undefined;
  if (!sourceTracks || typeof sourceTracks !== "object") {
    throw new Error("No tracks were found in this Apple Music library export.");
  }

  const tracks = Object.values(sourceTracks)
    .filter(
      (entry): entry is PlistRecord =>
        typeof entry === "object" &&
        entry !== null &&
        (entry as PlistRecord)["Playlist Only"] !== true,
    )
    .map((entry, index): Track => ({
      id: String(entry["Track ID"] ?? index),
      name: text(entry, "Name", "Untitled"),
      artist: text(entry, "Artist", "Unknown Artist"),
      album: text(entry, "Album", "Unknown Album"),
      genre: text(entry, "Genre", "Other"),
      year: optionalNumber(entry, "Year"),
      plays: amount(entry, "Play Count"),
      skips: amount(entry, "Skip Count"),
      durationMs: amount(entry, "Total Time"),
      dateAdded: date(entry, "Date Added"),
      lastPlayed: date(entry, "Play Date UTC"),
    }));

  if (!tracks.length) throw new Error("This library does not contain any playable tracks.");
  return createLibrary(tracks, typeof root.Date === "string" ? root.Date : null);
}
