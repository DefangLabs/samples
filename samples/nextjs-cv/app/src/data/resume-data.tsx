import {
 Logo
} from "../images/logos";
import { GitHubIcon, LinkedInIcon, XIcon } from "../components/icons";

export const RESUME_DATA = {
  name: "Your Name",
  initials: "YN",
  location: " Lorem Ipsum, DOL",
  locationLink: "https://www.google.com/maps/",
  about:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  summary: (
    <>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum vitae fringilla nulla, 
      in vehicula ligula. Morbi dignissim tempor justo, sit amet dictum purus feugiat in. 
      Interdum et malesuada fames ac ante ipsum primis.
    </>
  ),
  avatarUrl: "https://avatars.githubusercontent.com/u/1017620?v=4",
  personalWebsiteUrl: "https://defang.io/",
  contact: {
    email: "lorem.ipsum@example.com",
    tel: "+1234567890",
    social: [
      {
        name: "GitHub",
        url: "https://github.com/DefangLabs",
        icon: GitHubIcon,
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/company/defanglabs/",
        icon: LinkedInIcon,
      },
      {
        name: "X",
        url: "https://twitter.com/DefangLabs",
        icon: XIcon,
      },
    ],
  },
  education: [
    {
      school: "Faucibus Orci Luctus",
      degree: "Bachelor's Degree in Vestibulum Ante",
      start: "2007",
      end: "2010",
    },
  ],
  work: [
    {
      company: "Company",
      link: "about:blank",
      badges: ["Remote", "React", "TypeScript", "Node.js"],
      title: "Job Position",
      logo: Logo,
      start: "2024",
      end: null,
      description: (
        <>
          Sed eget felis lacus. Maecenas placerat diam a tincidunt viverra. 
          <ul className="list-inside list-disc">
            <li>
              Praesent hendrerit justo et nisl dapibus, porttitor placerat nisi efficitur.
            </li>
            <li>
              Donec viverra urna in porta dignissim, nunc suscipit aliquet elementum, 
              etiam vestibulum. 
            </li>
            <li>
              Curabitur venenatis magna lacinia, vulputate nisl ac, fermentum turpis. 
            </li>
          </ul>
        </>
      ),
    },
    {
      company: "Company",
      link: "about:blank",
      badges: [
        "Remote",
        "React",
        "TypeScript",
        "Node.js",
      ],
      title: "Job Position",
      logo: Logo,
      start: "2021",
      end: "2024",
      description: (
        <>
          Quisque vitae elementum orci. In hac habitasse platea dictumst.
          <ul className="list-inside list-disc">
            <li>
            Duis ornare ligula nec tincidunt mattis, crabitur lectus neque.
            </li>
            <li>
            Donec porttitor nec magna quis facilisis mauris, rutrum a diam vitae rhoncus 
            donec luctus.
            </li>
            <li>
            Phasellus nibh felis, scelerisque aliquet cursus a, blandit id sem, 
            nam aliquet dolor.
            </li>
          </ul>
        </>
      ),
    },
    {
      company: "Company",
      link: "about:blank",
      badges: ["Remote", "React", "TypeScript", "Node.js"],
      title: "Job Position",
      logo: Logo,
      start: "2015",
      end: "2021",
      description: (
        <>
          Sed aliquet hendrerit odio, in elementum ante convallis quis.
          <ul className="list-inside list-disc">
            <li>
            Donec blandit nibh at felis vehicula vehicula, nunc semper porttitor malesuada.
            </li>
            <li>
            Etiam rutrum dolor vel elit cursus elementum. 
            </li>
            <li>
            Curabitur urna sem, faucibus auctor dignissim a, eleifend at mauris.
            </li>
          </ul>
        </>
      ),
    }
  ],
  skills: [
    "React",
    "TypeScript",
    "Tailwind CSS",
    "Node.js",
    "GraphQL",
    "Relay",
    "System Architecture",
    "Remote Team Leadership",
  ],
  projects: [
    {
      title: "Project 1",
      techStack: ["TypeScript", "Next.js", "Browser Extension", "PostgreSQL"],
      description:
        "Nam aliquet dolor a risus pharetra placerat, praesent congue nulla dolor.",
      logo: Logo,
      link: {
        label: "blank",
        href: "about:blank",
      },
    },
    {
      title: "Project 2",
      techStack: [
        "TypeScript",
        "Next.js",
        "Vite",
        "GraphQL",
      ],
      description:
        "Pellentesque habitant morbi tristique senectus.",
      logo: Logo,
      link: {
        label: "blank",
        href: "about:blank",
      },
    },
    {
      title: "Project 3",
      techStack: ["TypeScript", "Next.js", "Tailwind CSS"],
      description:
        "Curabitur lectus neque, tempor at tortor non, viverra tempor tellus.",
      logo: Logo,
      link: {
        label: "blank",
        href: "about:blank",
      },
    },
  ],
} as const;
