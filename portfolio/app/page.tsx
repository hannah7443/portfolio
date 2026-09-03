import FlowerScene from "./components/spline/FlowerScene";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-black">
      <p className="redaction-50 pointer-events-none absolute left-1/2 top-6 z-10 -translate-x-1/2 text-3xl text-white sm:text-4xl">
        hannah shin
      </p>
      <FlowerScene />
    </div>
  );
}
