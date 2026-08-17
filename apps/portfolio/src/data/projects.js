import React from 'react';

export const PROJECTS = [
  {
    id: 2,
    slug: "RISD",
    title: "Rhode Island School of Design",
    disciplines: ["Interactive Design", "Design & Print", "Photography, Film & Animation"],
    topics: null,
    client: null,
    year: "2021– ",
    description: <>As part of a lean admissions team, I work across visual design, interactive systems, and CRM infrastructure, translating brand and UX decisions into shipped, functional work. My scope spans hand-coded email systems and CRM portal builds to print collateral and cross-team brand governance.<br></br><br></br>

    <h2>Interactive & Systems Design</h2><br></br>
  
    <h3>Admitted Students Day Portal</h3>Created inline-style CRM overrides as a holdover during our multi-year identity transition. Eventually these overrides with a native, brand-matched build that gates information using conditional Liquid logic and Slate's query/filtering system (SQL). Coordinated the final identity upgrade with Admissions Operations, Digital Experience, and web dev. (Liquid · SQL · HTML/CSS)<br></br><br></br>
    <h3>"Hooray!" Confetti Animation:</h3>Custom multi-layered confetti-fall script replacing Slate's flat native effect, built from the Marketing & Communications design team's SVG assets. Plays over a student's decision letter on admit. (JavaScript)<br></br><br></br>
    <h3>Generative Canvas Email Banners:</h3>Ongoing series of interactive canvas animations used as dynamic email backdrops, keeping repetitive admissions content visually fresh. (JavaScript · Canvas)<br></br><br></br>
    <h3>Audience Segmentation:</h3>Established the population-group logic used to target physical and digital mailing campaigns by audience. (SQL / Slate query logic)<br></br><br></br>
    <h2>Web Strategy & UX</h2><br></br>
    Ongoing UX and content input on RISD's live admissions pages, from granular edits to structural recommendations.
    <ul><li>Worked with our digital content team to introduce a high-visibility "Schedule a Tour" CTA, contributing to a measurable lift in tour engagement</li>
    <li>Reordered site navigation to prioritize high-intent actions (touring, events)</li>
    <li>Defined use case for a new double-CTA pattern and introduced date-dependent content changes</li></ul><br></br>
    <h2>Content & Visual Production</h2><br></br>
    Recent print and content work: photography-based email promo for our annual viewbook, postcards for prospective families, recruitment deck, swag curation.<br></br><br></br>

    <p className="small">----
    <br></br><br></br><i>With thanks to Brian Clark (Director of Digital Experience), Ruben Rodriguez (Web Developer), Rob Albanese (Associate Director, Digital Content Production and Operations), Alex Rapport (Production Designer), and Takeya Hollant (Associate Director, Admissions Operations) for their collaboration on this work. Viewbook design by Mary Banas (Senior Visual Designer) and Jordan Gushwa (Associate Director, Design) for RISD Marketing & Communications under Huy Vu (Creative Director).</i></p>
    </>,
    externalLink: "",
    thumbnail: "/images/projects/RISD/risd_seal_grid.webm",
    thumbnailWidth: 878,
    thumbnailHeight: 518,
    // Shown on Home's WORK hover chaser instead of the hero image
    // Supports transparent PNGs
    hoverImage: "/images/projects/RISD/RISD_Seal.svg",
    hero: () => import('../projects/RISD/Hero'),      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "/images/projects/RISD/melanie-patterson-risd.webm", width: 1200, height: 800, alt: "Textured blue liquid gradient with the RISD seal in the center." },
  { src: "/images/projects/RISD/Rhode-Island-School-of-Design-Viewbook-Flip.webm", width: 1200, height: 674, alt: "A video flipping through the RISD viewbook. It's colorful pages and white debossed cover contrast a living wall of climbing philodendrons, pothos, and spider plants.", caption: "Photography for a promotional campaign of our annual viewbook. Viewbook design by Mary Banas and Jordan Gushwa (RISD Marketing & Communications.)", size: "small" },
  {
    type: "inspiration-result",
    inspirationSrc: "/images/projects/RISD/RISD-Hooray-by-Alex-Rapport-mobile.webp",
    inspirationWidth: 300,
    inspirationHeight: 169,
    inspirationAlt: "'Hooray' text animation spelled out of yellow, orange, pink and white confetti against a blue background. Confetti falls and resets the animation.",
    inspirationCaption: <><i>Hooray!</i> banner by Alex Rapport (RISD Marketing & Communications) </>,
    resultRatio: "1200 / 1406",
    resultAlt: "Admissions admit decision letter screenshot with confetti in orange, pink, yellow and white and falling RISD seals in javascript",
    resultCaption: "Confetti script for RISD admitted students decision letter",
    dominates: "result",
    resultComponent: () => import('../projects/RISD/ConfettiDemo.jsx'),
    showRefresh: false,
    hoverHint: true,
  },
  {
  type: "browser-frame",
  src: "/images/projects/RISD/melanie-patterson-risd-admitted-student-portal.webp",
  width: 1500,
  height: 4034,
  alt: "The Admitted Students Day event portal screenshot displaying a program of events, custom event Google map, and other event details designed in the RISD identity.",
  size: "small",
  caption: "The shipped Admitted Students Day event portal, built over Slate's native portal framework.",
  },
  {
    type: "applet-result",
    appletComponent: () => import('../applets/GridFisheye.jsx'),
    appletRatio: "3 / 2",
    appletAlt: "A blue grid on black that bulges toward the cursor, like a fisheye lens following the pointer.",
    appletCaption: "Cursor-following fisheye grid—one of a small series of interactive canvas experiments.",
    showRefresh: false,
    bannerSrc: "/images/projects/RISD/Fisheye-Grid-Applet-This-Week-Header.webm",
    bannerWidth: 878,
    bannerHeight: 518,
    bannerAlt: "The same blue grid now has text that reads 'This Week' over top.",
    bannerCaption: "A lo-fi screen recording of the canvas grid animation used as a backdrop for email banners.",
  },
  {
  type: "banner-stack",
  images: [{ src: "/images/projects/RISD/Banner-1-RISD-Portolio-Day.webp", width: 878, height: 518, alt: "Banner reading 'RISD Portfolio Days' with photos of a blue paint brush and students holding up a large, human-scale piece." }, { src: "/images/projects/RISD/Banner-2-Grad_Campus_Tour.webp", width: 878, height: 518, alt: "Text reads 'Grad Campus Tours' over top an image of the RISD Nature Lab with a blue filter, and one of the windows cut out in full color." }, { src: "/images/projects/RISD/Banner-3-This-Week.webm", width: 876, height: 516, alt: "A banner reading 'This Week' over top a scrolling selection of images of students, artwork, and other campus life photos." }, { src: "/images/projects/RISD/Banner-3-This-Week.webm", width: 876, height: 516, alt: "A banner reading 'This Week' over top a scrolling selection of images of students, artwork, and other campus life photos." }],
  caption: "Email banners incorporating cut-out styling as part of our image treatment system.",
},
{
    type: "applet-result",
    appletComponent: () => import('../applets/FallingRectangles.jsx'),
    appletRatio: "3 / 2",
    appletAlt: "Blue rectangles fall and stack on each other, accumulating on the right side and spreading left.",
    appletCaption: "Canvas animation featuring blue stacking rectangles, informed by physics.",
    showRefresh: true,
    bannerSrc: "/images/projects/RISD/Falling-Blocks-Applet-This-Week-Header.webm",
    bannerWidth: 900,
    bannerHeight: 596,
    bannerAlt: "The same falling rectangle now has text that reads 'This Week' over top.",
    bannerCaption: "The canvas animation with added noise for email banners.",
  },
]
  },
    {
    id: 1,
    slug: "glow-up",
    title: "Glow Up",
    disciplines: ["Interactive Design", "Design & Print"],
    topics: null,
    client: null,
    year: "2026",
    description: "Glow Up (beta) is a skincare tracking, organizing, and discovery app built to help users navigate their way through a multi-step routine safely and confidently. It walks users through phased, dermatology-inspired onboarding programs that ramp up active ingredients and exfoliants gradually, tracks routine extras like haircare and gua sha, and detects when a scheduled treatment—like a chemical peel, laser session, or microneedling—conflicts with ingredients in someone's routine. It also includes a product library with ethics/values tracking and expiry tracking, a calendar export, and a feedback system. Designed and built with React/Supabase architecture, custom typography and brand system, and accessibility incorporated from the start.",
    externalLink: "https://glowupdemo.melanie.studio/",
    externalLinkLabel: "View demo",
    thumbnail: "/images/projects/GlowUp/glow_up_thumbnail.webm", // or: () => import('../projects/project-one/Thumbnail')
    thumbnailWidth: 1200,
    thumbnailHeight: 770,
    hoverImage: "/images/projects/GlowUp/glow-up-app.webp",
    // Desktop/mobile calendar comparison, moved here from the gallery
    // array below — stronger as the first thing visitors see than as one
    // grid item among several. images[0] stays put; WorkDetail.jsx's
    // LazyHero still needs it as the Suspense fallback shown while this
    // chunk loads.
    hero: () => import('../projects/GlowUp/Hero'),
    images: [
    { src: "/images/projects/GlowUp/melanie-patterson-glow-up-calendar-desktop.webp", width: 1400, height: 1590, alt: "The Glow Up calendar on desktop, showing a month grid with AM/PM routine slots colored by day type and an active Tretinoin Onboarding program banner." },
    {
      // Desktop half of the hero pairing — split out to only appear
      // here on mobile, where the hero itself shows the phone frame
      // alone (see Hero.jsx). Desktop viewports still get it as part of
      // the DeviceCompare hero, so this would be a duplicate there.
      type: "browser-frame",
      mobileOnly: true,
      src: "/images/projects/GlowUp/melanie-patterson-glow-up-calendar-desktop.webp",
      alt: "The Glow Up calendar on desktop, showing a month grid with AM/PM routine slots colored by day type and an active Tretinoin Onboarding program banner.",
      caption: "The same calendar view on desktop.",
    },
    {
      type: "browser-frame",
      src: "/images/projects/GlowUp/melanie-patterson-glow-up-products-desktop.webp",
      alt: "The Glow Up product library, showing a filterable grid of skincare products with brand, finish count, and affiliate links.",
      caption: "The product library, with brand, product type, and ethics/values filtering.",
    },
    {
      type: "component",
      component: () => import('../projects/GlowUp/GlowUpMobileLoader.jsx'),
      ratio: "927.98 / 1920",
      caption: "The loading screen, with rolling color progress bar and cute skincare-themed load phrases.",
    },
    {
      type: "component",
      component: () => import('../projects/GlowUp/GlowUpBrandPair.jsx'),
      ratio: "8 / 3",
      size: "large",
      caption: "The Glow Up wordmark (set in Naskle) and brand colors.",
    },
  ]
  },
  /* {
  id: 4,
  slug: "DARE-body-count",
  title: "D.O.D.",
  disciplines: ["Interactive Design"],
  topics: ["Memory & Archive"],
  client: ["Direct Action for Rights and Equality (DARE)"],
  year: "2026",
  description: "Coming soon.",
  externalLink: "",
  comingSoon: true,
  thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
  hero: null,      // or: () => import('../projects/project-one/Hero')
  images: [
    { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", width: 1200, height: 800, alt: "Placeholder — project content coming soon." },
  ]
  }, */ /* {
    id: 3,
    slug: "brightline",
    title: "Brightline Maps",
    disciplines: ["Fine Art", "Design & Print"],
    topics: null,
    client: { name: "Brightline", url: "https://www.gobrightline.com/" },
    year: "2017",
    description: "Mural-scale illustrated maps of South Florida, combining digital illustration with traditional techniques, including hand-lettering and painted texture work, installed across Brightline's Miami, Fort Lauderdale, and West Palm Beach stations. Each map depicts train routes, stations, landmarks, and highways within Brightline's brand color system.",
    externalLink: "",
    thumbnail: "/images/projects/Brightline/Brightline_Maps_Melanie_Patterson_Crop.webp", // or: () => import('../projects/project-one/Thumbnail')
    thumbnailSrcSet: "/images/projects/Brightline/Brightline_Maps_Melanie_Patterson_Crop-700w.webp 700w, /images/projects/Brightline/Brightline_Maps_Melanie_Patterson_Crop.webp 1279w",
    thumbnailSizes: "(max-width: 640px) 350px, 533px",
    thumbnailWidth: 1279,
    thumbnailHeight: 853,
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", width: 1200, height: 800, alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", width: 800, height: 1000, alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", width: 600, height: 600, alt: "The full piece installed at..." },
]
  } ,
  {
    id: 9,
    slug: "project-two",
    title: "Project Two",
    disciplines: ["Design & Print"],
    topics: ["Memory & Archive"],
    client: null,
    year: "2024",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
  {
    id: 10,
    slug: "project-three",
    title: "Project Three",
    disciplines: ["Fine Art"],
    topics: ["Activism & Advocacy"],
    client: { name: "DARE", url: "https://dareri.org" },
    year: "2023",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
  {
    id: 11,
    slug: "project-four",
    title: "Project Four",
    disciplines: ["Fine Art"],
    topics: ["Form & Process"],
    client: null,
    year: "2023",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "https://example.com",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
  {
    id: 5,
    slug: "project-five",
    title: "Project Five",
    disciplines: ["Fine Art", "Design & Print"],
    topics: ["Memory & Archive", "Personal Narrative"],
    client: null,
    year: "2023",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
  {
    id: 6,
    slug: "project-six",
    title: "Project Six",
    disciplines: ["Photography, Film & Animation"],
    topics: ["Activism & Advocacy"],
    client: { name: "DARE", url: "https://dareri.org" },
    year: "2022",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
  {
    id: 7,
    slug: "project-seven",
    title: "Project Seven",
    disciplines: ["Documentary & Writing"],
    topics: ["Memory & Archive"],
    client: null,
    year: "2022",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
  {
    id: 8,
    slug: "project-eight",
    title: "Project Eight",
    disciplines: ["Interactive Design", "Documentary & Writing"],
    topics: ["Form & Process"],
    client: null,
    year: "2022",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },*/
];