import Image from "next/image";
import ArchiveLinkButton from "../components/ArchiveLinkButton";

const figTreeImage = "/images/work-buttons/fig-tree.png";
const radio2Image = "/images/work-buttons/radio-2-cover.jpg";

const dotGrid = "/images/work-banner/dot-grid.png";
const grassTexture = "/images/work-banner/grass.png";
const fabricTexture = "/images/work-banner/fabric.png";
const woodTexture = "/images/work-banner/wood.jpg";
const maskShape = "/images/work-banner/mask.svg";

export default function WorkPage() {
  return (
    <div className="flex min-h-screen flex-col items-center pt-24">
      <div className="flex w-full justify-center overflow-x-hidden px-4">
        <div className="relative aspect-[1150/360] w-full max-w-[1150px]">
          {/* green rectangle cluster */}
          <div className="absolute bg-[#5c7e4f] opacity-70" style={{ left: "48.38%", top: "55.28%", width: "15.13%", height: "23.61%" }} />
          <div className="absolute bg-[#8e9519] opacity-70" style={{ left: "60.73%", top: "53.61%", width: "15.13%", height: "23.61%" }} />
          <div className="absolute bg-[#cee6a7] opacity-70" style={{ left: "62.64%", top: "43.61%", width: "11.13%", height: "23.61%" }} />
          <div className="absolute bg-[#c3d254] opacity-70" style={{ left: "66.64%", top: "44.44%", width: "11.22%", height: "19.72%" }} />
          <div className="absolute bg-[#2b400a] opacity-70" style={{ left: "50.56%", top: "46.67%", width: "15.13%", height: "23.61%" }} />
          <div className="absolute bg-[#355631] opacity-70" style={{ left: "54.03%", top: "62.78%", width: "16.43%", height: "18.89%" }} />

          {/* mosaic color blocks */}
          <div className="absolute bg-[#201858]" style={{ left: "22.9%", top: "43.9%", width: "6%", height: "11.9%" }} />
          <div className="absolute bg-[#6865b5] opacity-70" style={{ left: "41.4%", top: "47.2%", width: "5.3%", height: "14.4%" }} />
          <div className="absolute bg-[#7f7aa5]" style={{ left: "28.3%", top: "47.8%", width: "4%", height: "11.9%" }} />
          <div className="absolute bg-[#201858]" style={{ left: "18.6%", top: "48.6%", width: "8.7%", height: "11.9%" }} />
          <div className="absolute bg-[#130b53]" style={{ left: "35%", top: "48.6%", width: "2.6%", height: "26.1%" }} />
          <div className="absolute bg-[#443f69]" style={{ left: "30.8%", top: "51.4%", width: "5.2%", height: "6.7%" }} />
          <div className="absolute bg-[#5141c8]" style={{ left: "37.3%", top: "51.4%", width: "2.4%", height: "13.1%" }} />
          <div className="absolute bg-[#6865b5]" style={{ left: "44.1%", top: "51.4%", width: "5.3%", height: "14.4%" }} />
          <div className="absolute bg-[#3322b8]" style={{ left: "24.6%", top: "52.2%", width: "6%", height: "16.7%" }} />
          <div className="absolute bg-[#180e63]" style={{ left: "39.3%", top: "52.8%", width: "6.3%", height: "13.1%" }} />
          <div className="absolute bg-[#1c0b99]" style={{ left: "30.3%", top: "56.7%", width: "7.3%", height: "9.7%" }} />
          <div className="absolute bg-[#4d467f]" style={{ left: "21.7%", top: "58.3%", width: "3.5%", height: "16.1%" }} />
          <div className="absolute bg-[#443f69]" style={{ left: "36%", top: "64.4%", width: "7.2%", height: "3.1%" }} />
          <div className="absolute bg-[#080c38]" style={{ left: "24.6%", top: "64.7%", width: "7.4%", height: "8.3%" }} />
          <div className="absolute bg-[#45437e]" style={{ left: "42.6%", top: "65.8%", width: "9.1%", height: "8.9%" }} />
          <div className="absolute bg-[#a49aed]" style={{ left: "32%", top: "66.4%", width: "4%", height: "9.7%" }} />
          <div className="absolute bg-[#220cc3]" style={{ left: "36%", top: "67.5%", width: "7.2%", height: "4.4%" }} />

          {/* masked texture overlay, sitting on top of the green rectangles */}
          <div className="absolute inset-0" style={{ transform: "scale(0.85)", transformOrigin: "62.1% 59%" }}>
            <div
              className="absolute opacity-80"
              style={{
                left: "38.9%",
                top: "13.6%",
                width: "43.7%",
                height: "87.2%",
                maskImage: `url(${maskShape})`,
                maskSize: "435px 149.363px",
                maskPosition: "33px 91px",
                maskRepeat: "no-repeat",
              }}
            >
              <Image src={grassTexture} alt="" fill className="object-cover opacity-80" />
            </div>
            <div
              className="absolute opacity-25"
              style={{
                left: "42.2%",
                top: "-52.2%",
                width: "39.1%",
                height: "222.5%",
                maskImage: `url(${maskShape})`,
                maskSize: "435px 149.363px",
                maskPosition: "-5px 328px",
                maskRepeat: "no-repeat",
              }}
            >
              <Image src={fabricTexture} alt="" fill className="object-cover" />
            </div>
            <div
              className="absolute flex items-center justify-center"
              style={{ left: "40.9%", top: "2.8%", width: "44.4%", height: "106.4%" }}
            >
              <div className="relative h-full w-full -scale-y-100 rotate-180">
                <div
                  className="relative h-full w-full opacity-80"
                  style={{
                    maskImage: `url(${maskShape})`,
                    maskSize: "435px 149.363px",
                    maskPosition: "10px 130px",
                    maskRepeat: "no-repeat",
                  }}
                >
                  <Image src={woodTexture} alt="" fill className="object-cover opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* small decorative photo swatches */}
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
              left: "50%",
              top: "44.7%",
              fontSize: "clamp(1.75rem, 8vw, 6rem)",
              fontStyle: "normal",
            }}
          >
            hannah shin
          </p>
        </div>
      </div>

      <div className="mt-16 flex w-full max-w-[1150px] flex-col gap-8 px-4 sm:flex-row">
        {/* radio button hidden for now
        <ArchiveLinkButton
          href="/work/radio"
        />
        */}
        <div className="flex w-full flex-col gap-2">
          <p className="font-red-hat-mono text-sm">WXDU: BUILDING RADIO&rsquo;S FUTURE</p>
          <ArchiveLinkButton
            href="/work/radio-2"
            backgroundImage={radio2Image}
          />
        </div>
        <div className="flex w-full flex-col gap-2">
          <p className="font-red-hat-mono text-sm">FIG TREE: NOTES APP PROTOTYPE</p>
          <ArchiveLinkButton
            href="/work/fig-tree"
            backgroundImage={figTreeImage}
          />
        </div>
      </div>
    </div>
  );
}
