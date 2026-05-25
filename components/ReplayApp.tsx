"use client";

import { DragEvent, useEffect, useRef, useState } from "react";
import LibraryDashboard from "@/components/LibraryDashboard";
import { parseLibraryXml } from "@/lib/parseLibraryXml";
import type { LibraryData } from "@/lib/library";

export default function ReplayApp() {
  const input = useRef<HTMLInputElement>(null);
  const [library, setLibrary] = useState<LibraryData | null>(null);
  const [source, setSource] = useState("");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [library]);

  async function openFile(file: File | undefined) {
    if (!file) return;
    setError("");
    try {
      const imported = parseLibraryXml(await file.text());
      setSource(file.name);
      setLibrary(imported);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to read this library.");
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void openFile(event.dataTransfer.files[0]);
  }

  if (library) {
    return (
      <LibraryDashboard
        key={`${source}-${library.exportedAt}`}
        library={library}
        source={source}
        onNewLibrary={() => {
          setLibrary(null);
          setSource("");
        }}
      />
    );
  }

  return (
    <main className="uploadPage">
      <nav className="nav welcomeNav">
        <span className="brand"><span className="brandDot" /> Replay Room</span>
        <span className="export">Your XML stays in your browser</span>
      </nav>
      <section className="welcome">
        <p className="eyebrow">A private replay for your library</p>
        <h1>Upload your music. Revisit your story.</h1>
        <p className="intro">
          Bring an Apple Music or iTunes library XML export and discover your top tracks,
          listening eras, favorite artists, and last-played timeline.
        </p>
        <div
          className={`dropzone ${dragging ? "dragging" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={drop}
        >
          <span className="uploadIcon" aria-hidden="true">+</span>
          <h2>Drop your Library.xml here</h2>
          <p>or choose an Apple Music / iTunes XML export</p>
          <input
            accept=".xml,text/xml,application/xml"
            className="fileInput"
            onChange={(event) => void openFile(event.target.files?.[0])}
            ref={input}
            type="file"
          />
          <button className="primary" onClick={() => input.current?.click()}>
            Choose XML file
          </button>
          {error && <p className="uploadError" role="alert">{error}</p>}
        </div>
        <p className="privacyNote">Processed locally. Your music library is never sent anywhere.</p>
      </section>
      <section className="features" aria-label="Replay features">
        {[
          ["Replay cards", "See top artist, song, album, genre and listening time."],
          ["Timeline", "Explore latest plays or additions year by year."],
          ["Private", "Files are processed locally and never uploaded."],
        ].map(([title, text]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
