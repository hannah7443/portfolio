import FlowerScene from "./components/spline/FlowerScene";
import HomeTitle from "./components/HomeTitle";
import { HoverFigTreeProvider } from "./components/spline/HoverFigTreeContext";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <HoverFigTreeProvider>
        <HomeTitle />
        <FlowerScene />
      </HoverFigTreeProvider>
    </div>
  );
}
