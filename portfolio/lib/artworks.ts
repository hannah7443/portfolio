// Shared artwork video list — used by app/playground/PlaygroundBoard.tsx (orbit layout)
// and components/scene/ArtworkScreen.tsx (in-scene one-at-a-time viewer).
export type ArtworkClip = {
  id: string;
  src: string;
  label: string;
};

export const ARTWORK_CLIPS: ArtworkClip[] = [
  { id: "Coffee-Cup", src: "/artwork/Coffee-Cup.MOV", label: "Coffee Cup" },
  { id: "Weird-Fishes", src: "/artwork/Weird-Fishes.mov", label: "Weird Fishes" },
  { id: "September-Rain", src: "/artwork/September-Rain.MP4", label: "September Rain" },
  { id: "Cowboys-Angels", src: "/artwork/Cowboys-Angels.mov", label: "Cowboys & Angels" },
  { id: "Rilkean-Heart", src: "/artwork/Rilkean-Heart.mov", label: "Rilkean Heart" },
  { id: "Mary-Oliver", src: "/artwork/Mary-Oliver.MOV", label: "Mary Oliver" },
  { id: "Memories", src: "/artwork/Memories.mov", label: "Memories" },
  { id: "Shadow-Puppets", src: "/artwork/Shadow-Puppets.MP4", label: "Shadow Puppets" },
];
