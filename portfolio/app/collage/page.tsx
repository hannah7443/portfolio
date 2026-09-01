import Image from "next/image";

const dotGrid = "/images/work-banner/dot-grid.png";
const collage1 = "/images/work-banner/collage-1.jpg";
const collage2 = "/images/work-banner/collage-2.jpg";
const collage3 = "/images/work-banner/collage-3.jpg";
const collage4 = "/images/work-banner/collage-4.jpg";
const grass = "/images/work-banner/grass.jpg";
const fabric = "/images/work-banner/fabric.jpg";
const wood = "/images/work-banner/wood.jpg";
const mask = "/images/work-banner/mask.svg";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center pt-24">
      <div className="flex w-full justify-center overflow-x-hidden px-4">
        <div className="relative aspect-[1150/360] w-full max-w-[1150px]">
          {/* textured background layers */}
          <div
            className="absolute opacity-80"
            style={{
              left: "47.3%",
              top: "13.6%",
              width: "43.7%",
              height: "87.2%",
              maskImage: `url(${mask})`,
              maskSize: "37.8% 41.4%",
              maskPosition: "2.9% 25.3%",
              maskRepeat: "no-repeat",
            }}
          >
            <Image src={grass} alt="" fill className="object-cover opacity-80" />
          </div>
          <div
            className="absolute opacity-25"
            style={{
              left: "50.6%",
              top: "-52.2%",
              width: "39.1%",
              height: "222.5%",
              maskImage: `url(${mask})`,
              maskSize: "37.8% 41.4%",
              maskPosition: "-0.4% 91.1%",
              maskRepeat: "no-repeat",
            }}
          >
            <Image src={fabric} alt="" fill className="object-cover" />
          </div>
          <div
            className="absolute flex items-center justify-center"
            style={{ left: "49.3%", top: "2.8%", width: "44.4%", height: "106.4%" }}
          >
            <div className="relative h-full w-full -scale-y-100 rotate-180">
              <div
                className="relative h-full w-full opacity-80"
                style={{
                  maskImage: `url(${mask})`,
                  maskSize: "37.8% 41.4%",
                  maskPosition: "0.9% 36.1%",
                  maskRepeat: "no-repeat",
                }}
              >
                <Image src={wood} alt="" fill className="object-cover opacity-50" />
              </div>
            </div>
          </div>

          {/* mosaic color blocks */}
          <div className="absolute bg-[#201858]" style={{ left: "31.3%", top: "43.9%", width: "6%", height: "11.9%" }} />
          <div className="absolute bg-[#2b400a] opacity-70" style={{ left: "59%", top: "46.7%", width: "15.1%", height: "23.6%" }} />
          <div className="absolute bg-[#6865b5] opacity-70" style={{ left: "49.8%", top: "47.2%", width: "5.3%", height: "14.4%" }} />
          <div className="absolute bg-[#7f7aa5]" style={{ left: "36.7%", top: "47.8%", width: "4%", height: "11.9%" }} />
          <div className="absolute bg-[#201858]" style={{ left: "27%", top: "48.6%", width: "8.7%", height: "11.9%" }} />
          <div className="absolute bg-[#130b53]" style={{ left: "43.4%", top: "48.6%", width: "2.6%", height: "26.1%" }} />
          <div className="absolute bg-[#443f69]" style={{ left: "39.2%", top: "51.4%", width: "5.2%", height: "6.7%" }} />
          <div className="absolute bg-[#5141c8]" style={{ left: "45.7%", top: "51.4%", width: "2.4%", height: "13.1%" }} />
          <div className="absolute bg-[#6865b5]" style={{ left: "52.5%", top: "51.4%", width: "5.3%", height: "14.4%" }} />
          <div className="absolute bg-[#3322b8]" style={{ left: "33%", top: "52.2%", width: "6%", height: "16.7%" }} />
          <div className="absolute bg-[#180e63]" style={{ left: "47.7%", top: "52.8%", width: "6.3%", height: "13.1%" }} />
          <div className="absolute bg-[#5c7e4f] opacity-70" style={{ left: "56.8%", top: "55.3%", width: "15.1%", height: "23.6%" }} />
          <div className="absolute bg-[#1c0b99]" style={{ left: "38.7%", top: "56.7%", width: "7.3%", height: "9.7%" }} />
          <div className="absolute bg-[#4d467f]" style={{ left: "30.1%", top: "58.3%", width: "3.5%", height: "16.1%" }} />
          <div className="absolute bg-[#443f69]" style={{ left: "44.4%", top: "64.4%", width: "7.2%", height: "3.1%" }} />
          <div className="absolute bg-[#080c38]" style={{ left: "33%", top: "64.7%", width: "7.4%", height: "8.3%" }} />
          <div className="absolute bg-[#45437e]" style={{ left: "51%", top: "65.8%", width: "9.1%", height: "8.9%" }} />
          <div className="absolute bg-[#a49aed]" style={{ left: "40.4%", top: "66.4%", width: "4%", height: "9.7%" }} />
          <div className="absolute bg-[#220cc3]" style={{ left: "44.4%", top: "67.5%", width: "7.2%", height: "4.4%" }} />

          {/* small decorative photo swatches */}
          <div className="absolute" style={{ left: "69.1%", top: "53.6%", width: "15.1%", height: "23.6%" }}>
            <Image src={collage3} alt="" fill className="object-cover" />
          </div>
          <div className="absolute" style={{ left: "71%", top: "43.6%", width: "11.1%", height: "23.6%" }}>
            <Image src={collage1} alt="" fill className="object-cover" />
          </div>
          <div className="absolute" style={{ left: "75.04%", top: "44.4%", width: "11.2%", height: "19.7%" }}>
            <Image src={collage2} alt="" fill className="object-cover" />
          </div>
          <div className="absolute" style={{ left: "62.4%", top: "62.8%", width: "16.4%", height: "18.9%" }}>
            <Image src={collage4} alt="" fill className="object-cover" />
          </div>
          <div className="absolute" style={{ left: "25.6%", top: "26.4%", width: "6.8%", height: "41.7%" }}>
            <Image src={dotGrid} alt="" fill className="object-cover" />
          </div>
          <div className="absolute" style={{ left: "25.6%", top: "40.6%", width: "8.7%", height: "27.8%" }}>
            <Image src={dotGrid} alt="" fill className="object-cover" />
          </div>

          {/* title */}
          <p
            className="-translate-x-1/2 redaction-50 absolute w-[76%] text-center leading-none text-white"
            style={{
              left: "58.4%",
              top: "44.7%",
              fontSize: "clamp(1.75rem, 8vw, 6rem)",
              fontStyle: "normal",
            }}
          >
            hannah shin
          </p>
        </div>
      </div>
    </div>
  );
}
