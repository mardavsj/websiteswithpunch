/** The homepage product tour: files in public/video, chapters, and the VideoObject fields. */
export const TOUR = {
  name: "Websites With Punch: the 54-second product tour",
  description:
    "Add a site, see the first uptime, SSL and domain expiry check, then the dashboard, rechecks, analytics and plans.",
  seconds: 54,
  isoDuration: "PT54S",
  uploadDate: "2026-10-04",
  mp4: "/video/website-health-launch.mp4",
  mp4Small: "/video/website-health-launch-720.mp4",
  webm: "/video/website-health-launch.webm",
  captions: "/video/website-health-launch.en.vtt",
  poster: "/video/website-health-launch-poster.webp",
  posterSmall: "/video/website-health-launch-poster-640.webp",
  posterJpg: "/video/website-health-launch-poster.jpg",
} as const;

/** Chapter starts (seconds), matched to the on-screen titles in the video. */
export const TOUR_CHAPTERS = [
  { t: 0, label: "Why it matters" },
  { t: 15, label: "What it watches" },
  { t: 21, label: "Add a site" },
  { t: 25, label: "First check" },
  { t: 29, label: "The dashboard" },
  { t: 32, label: "Rechecks" },
  { t: 36, label: "Analytics" },
  { t: 40, label: "Plans" },
] as const;

export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
