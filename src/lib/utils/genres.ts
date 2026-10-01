export interface GenreDefinition {
  id: string;
  name: string;
  tag: string;
  color: string;
  description: string;
}

export const GENRES: GenreDefinition[] = [
  {
    id: "electronic",
    name: "Electronic",
    tag: "electronic",
    color: "#7358FF",
    description: "Synthesizers, beats, and forward-thinking soundscapes.",
  },
  {
    id: "rock",
    name: "Rock",
    tag: "rock",
    color: "#E91429",
    description: "Raw guitars, heavy drums, and high-energy anthems.",
  },
  {
    id: "chillout",
    name: "Chillout & Lofi",
    tag: "chillout",
    color: "#509BF5",
    description: "Laid-back vibes, relaxing grooves, and gentle melodies.",
  },
  {
    id: "ambient",
    name: "Ambient",
    tag: "ambient",
    color: "#477D95",
    description: "Atmospheric textures and meditative sound design.",
  },
  {
    id: "hiphop",
    name: "Hip-Hop",
    tag: "hiphop",
    color: "#BA5D07",
    description: "Punchy 808s, lyrical rhythm, and urban grooves.",
  },
  {
    id: "pop",
    name: "Pop",
    tag: "pop",
    color: "#148A08",
    description: "Catchy hooks, vibrant production, and upbeat rhythm.",
  },
  {
    id: "jazz",
    name: "Jazz & Blues",
    tag: "jazz",
    color: "#1E3264",
    description: "Improvisation, brass soul, and timeless grooves.",
  },
  {
    id: "classical",
    name: "Classical",
    tag: "classical",
    color: "#8D67AB",
    description:
      "Orchestral compositions, piano elegance, and timeless grandeur.",
  },
  {
    id: "indie",
    name: "Indie",
    tag: "indierock",
    color: "#608108",
    description:
      "Independent sounds, authentic emotion, and creative expression.",
  },
  {
    id: "acoustic",
    name: "Acoustic",
    tag: "acoustic",
    color: "#B02897",
    description: "Stripped-back instruments, heartfelt vocals, and warmth.",
  },
  {
    id: "metal",
    name: "Metal",
    tag: "metal",
    color: "#535353",
    description: "Distorted riffs, blistering tempos, and intense energy.",
  },
  {
    id: "soundtrack",
    name: "Soundtracks",
    tag: "soundtrack",
    color: "#0D73EC",
    description: "Cinematic scores, sweeping strings, and epic sound journeys.",
  },
];

export function getGenreBySlug(slug: string): GenreDefinition | undefined {
  const clean = slug.toLowerCase().trim();
  return GENRES.find((g) => g.id === clean || g.tag === clean);
}
