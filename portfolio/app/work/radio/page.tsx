import { Sidebar, Section, type NavItem } from "../../components/ArchiveColumn";

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", id: "overview" },
  { label: "Team Members", id: "team-members" },
  { label: "Background", id: "background" },
  { label: "Problem", id: "problem" },
  { label: "UX Research", id: "ux-research" },
  { label: "Design Identity", id: "design-identity" },
  {
    label: "Solutions",
    id: "solutions",
    children: [
      { label: "Website", id: "solutions-website" },
      { label: "Mobile App", id: "solutions-mobile-app" },
      { label: "Vision Language Model", id: "solutions-vision-language-model" },
    ],
  },
  { label: "Reflection", id: "reflection" },
  { label: "Next Steps", id: "next-steps" },
];

export default function RadioPage() {
  return (
    <div className="flex min-h-screen">
      <Sidebar items={NAV_ITEMS} />
      <main className="ml-56 flex-1 px-12 pt-24">
        <h1 className="font-red-hat-mono text-4xl">Building Radio&rsquo;s Future</h1>
        <Section id="overview" title="Overview" />
        <Section id="team-members" title="Team Members" />
        <Section id="background" title="Background" />
        <Section id="problem" title="Problem" />
        <Section id="ux-research" title="UX Research" />
        <Section id="design-identity" title="Design Identity" />
        <Section id="solutions" title="Solutions">
          <Section id="solutions-website" title="Website" />
          <Section id="solutions-mobile-app" title="Mobile App" />
          <Section id="solutions-vision-language-model" title="Vision Language Model" />
        </Section>
        <Section id="reflection" title="Reflection" />
        <Section id="next-steps" title="Next Steps" />
      </main>
    </div>
  );
}
