import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col items-stretch gap-10 px-6 pt-24 pb-16 sm:flex-row sm:gap-12 sm:px-16">
      <div className="relative w-full shrink-0 overflow-hidden rounded-[18px] sm:w-2/5">
        <Image src="/images/Profile-picture.jpg" alt="Hannah Shin" fill className="object-cover" />
      </div>

      <div className="max-w-[640px]">
        <h1 className="redaction-50 text-[clamp(2rem,5vw,3.5rem)] not-italic">Hi, I&rsquo;m Hannah!</h1>

        <div className="font-red-hat-mono mt-6 space-y-4 text-sm leading-relaxed">
          <p>
            I&rsquo;m a rising sophomore at Duke University studying Computational Media - an interdepartmental
            major between CS and Visual/Media Studies, with a minor in Music. This summer, I worked as a full-stack
            engineering intern at Duke&rsquo;s radio station, WXDU, where I developed a new website and app for the
            station. From this internship, I excelled in shaping the design identity of the station&rsquo;s app and
            website. I realized that I really enjoyed integrating information from UX interviews with the
            station&rsquo;s DJs into the designs I made for the website and app, blending the unique culture of the
            station into each design decision. This has inspired me to recruit for Product Design internships this
            upcoming fall.
          </p>
          <p>
            My other artistic interests include blending mixed media and creative coding (p5.js, three.js,
            TouchDesigner) to create my own pieces.
          </p>
          <p>
            Finally, I am a musician at heart. I love exploring how sound and visuals work together to create
            stories. Music is an essential element to each of the artistic pieces I create for @hannahs.mosaic.
            Philosophically, I aim to grow my mosaic of creativity - the different roots of my creative passions in
            different types of art, coding, and music - into my artistic expression.
          </p>
        </div>
      </div>
    </div>
  );
}
