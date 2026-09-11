import FlowerScene from "./components/spline/FlowerScene";
import { HoverFigTreeProvider } from "./components/spline/HoverFigTreeContext";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <HoverFigTreeProvider>
        <FlowerScene />
      </HoverFigTreeProvider>
    </div>
  );
}
