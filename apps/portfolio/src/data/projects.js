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
<b>Admitted Students Day Portal</b><br></br><br></br>
Slate's CRM had been running on my own inline-style overrides for a few years (a stopgap that kept our portals usable while official brand assets caught up to RISD's 2022 identity refresh.) I proposed and coordinated a native CRM upgrade with our Associate Director of Admissions Operations, MarComm Director of Digital Experience and a web developer, replacing the overrides with a fully brand-matched build.<br></br><br></br>

The portal uses conditional Liquid logic (built through Slate's query and filtering system, which generates the underlying SQL) to change what a student sees based on registration state: general event info before registering, specific time and location details after.<br></br><br></br>
<b>Admitted Student "Hooray!" Confetti Animation</b><br></br><br></br>
Slate's native celebratory effect was a snowfall-style script that was functional, but visually flat and out of step with a design school's brand standards. When our production designer created new "Hooray!" confetti graphics as part of an admitted student visual refresh, I saw the opportunity to build something more considered than the built-in option.<br></br><br></br>

I took the SVG assets and built a custom confetti-fall script, layering multiple pieces at different fall speeds to create real depth rather than a flat, uniform drop. When an admitted student logs into their portal and their status has changed to admitted, the animation plays over their decision letter on load, adding to the emotion of the celebratory occasion.<br></br><br></br>
<b>Generative Canvas Animations for Email Banners</b><br></br><br></br>
A recurring challenge in admissions email design: much of what we communicate is necessarily repetitive (deadlines, next steps, program details), and static banners made that redundancy feel even flatter. I built a series of interactive canvas animations to use as dynamic motion backdrops, alternating them with animated photographic banners to keep repeat communications visually alive rather than duplicated.<br></br><br></br>

Animations are viewable and replayable here alongside the finished banner it was built for. This is an ongoing series and more are in development.<br></br><br></br>

<b>Audience Segmentation for Mailing Campaigns</b>
I established RISD Admissions' population groups. This is the segmentation logic used to organize prospective students for both physical and digital mailings, enabling the team to target campaigns by audience rather than treating our list as one undifferentiated pool. This structure runs year-round, with heavier use during summer mailing cycles, and reflects the same data-filtering skill set behind the CRM portal work above.<br></br><br></br>


<h2>Web Strategy & UX Collaboration</h2><br></br>
Beyond print and email, I actively shape UX and content strategy on RISD's live admissions pages — working alongside MarComm Digital Content Operations lead and his team. My input ranges from granular content edits (some I make directly; others I hand off with specific direction, including cases that require cross-department consultation to implement correctly) to structural recommendations that shape how prospective students navigate the site.<br></br><br></br>

A few examples:<br></br><br></br>

<ul>
  <li><b>Restoring a high-visibility CTA:</b> Identified an opportunity to reintroduce a prominent "Schedule a Tour" call-to-action into the new brand system—a small change that contributed to a measurable lift in tour engagement.</li>
<li><b>Menu reordering:</b> Pushed to prioritize touring and events higher in site navigation, surfacing the actions prospective students are most likely to take.</li>
<li><b>Contextual CTA design:</b> Proposed and helped define use specs for double-CTA button treatments (a new pattern in the brand system) and date-dependent CTA content that adjusts messaging around key deadlines.</li></ul>

<br></br>I've also been developing a complementary email and content strategy including new header treatments and increased promotional cadence, aimed at building visibility and engagement earlier in a prospective student's journey.<br></br><br></br>


<h2>Content & Visual Production</h2><br></br>
Alongside the interactive work above, I contribute to RISD Admissions' print and content ecosystem: an animated email promo built from viewbook photography, postcards accompanying MarComm's print collateral, our recruitment presentation deck, and swag curation (including sketchbooks from Uglybooks).<br></br><br></br>----
<br></br><br></br>

With thanks to Brian Clark (Director of Digital Experience), Ruben Rodriguez (Web Developer), Rob Albanese (Associate Director, Digital Content Production and Operations), Alex Rapport (Production Designer), and Takeya Hollant (Associate Director, Admissions Operations) for their collaboration on this work. Viewbook design by Mary Banas (Senior Visual Designer) and Jordan Gushwa (Associate Director, Design) for RISD Marketing & Communications under Huy Vu (Creative Director).
</>,
    externalLink: "",
    thumbnail: () => import('../projects/RISD/Thumbnail'),
    hero: () => import('../projects/RISD/Hero'),      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "/images/projects/RISD/melanie-patterson-risd.webp", alt: "Textured blue liquid gradient with the RISD seal in the center." },
  { src: "/images/projects/RISD/Rhode-Island-School-of-Design-Viewbook-Flip.webp", alt: "A gif flipping through the RISD viewbook. It's colorful pages and white debossed cover contrast a living wall of climbing philodendrons, pothos, and spider plants.", caption: "Photography for a promotional campaign of our annual viewbook. Viewbook design by Mary Banas and Jordan Gushwa (RISD Marketing & Communications.)", size: "small", lightbox: true },
  { 
    type: "inspiration-result",
    inspirationSrc: "/images/projects/RISD/RISD-Hooray-by-Alex-Rapport.webp",
    inspirationAlt: "'Hooray' text animation spelled out of yellow, orange, pink and white confetti against a blue background. Confetti falls and resets the animation.",
    inspirationCaption: <><i>Hooray!</i> banner by Alex Rapport (RISD Marketing & Communications) </>,
    resultSrc: "/images/projects/melanie-patterson-risd-admissions-decision-letter.webp",
    resultAlt: "Admissions admit decision letter screenshot with confetti in orange, pink, yellow and white and falling RISD seals in javascript",
    resultCaption: "Confetti script for RISD admitted students decision letter",
    dominates: "result",
    resultComponent: () => import('../projects/RISD/ConfettiDemo.jsx'),
    hoverHint: true,
  },
  { 
  type: "browser-frame",
  src: "/images/projects/RISD/melanie-patterson-risd-admitted-student-portal.webp",
  alt: "The Admitted Students Day event portal screenshot displaying a program of events, custom event Google map, and other event details designed in the RISD identity.",
  size: "small",
  caption: "Scrollable screenshot of the Admitted Students Day event portal, including a program of events, custom event Google map for wayfinding, and other day-of extras.",
  },
  {
    type: "applet-result",
    appletComponent: () => import('../applets/GridFisheye.jsx'),
    appletAlt: "A blue grid on black that bulges toward the cursor, like a fisheye lens following the pointer.",
    appletCaption: "Cursor-following fisheye grid — one of a small series of interactive canvas experiments.",
    showRefresh: false,
    bannerSrc: "/images/projects/RISD/Fisheye-Grid-Applet-This-Week-Header.webp",
    bannerAlt: "The same blue grid now has text that reads 'This Week' over top.",
    bannerCaption: "A lo-fi screen recording of the canvas grid animation used as a backdrop for email banners.",
  },
  {
  type: "banner-stack",
  images: [{ src: "/images/projects/RISD/Banner-1-RISD-Portolio-Day.webp", alt: "Banner reading 'RISD Portfolio Days' with photos of a blue paint brush and students holding up a large, human-scale piece." }, { src: "/images/projects/RISD/Banner-2-Grad_Campus_Tour.webp", alt: "Text reads 'Grad Campus Tours' over top an image of the RISD Nature Lab with a blue filter, and one of the windows cut out in full color." }, { src: "/images/projects/RISD/Banner-3-This-Week.webp", alt: "A banner reading 'This Week' over top a scrolling selection of images of students, artwork, and other campus life photos." }, { src: "/images/projects/RISD/Banner-3-This-Week.webp", alt: "A banner reading 'This Week' over top a scrolling selection of images of students, artwork, and other campus life photos." }],
  caption: "New email banners incorporating cut-out styling as part of our image treatment system.",
},
]
  },
    {
    id: 1,
    slug: "glow-up",
    title: "Glow Up App",
    disciplines: ["Interactive Design", "Design & Print"],
    topics: null,
    client: null,
    year: "2026",
    description: "Glow Up (beta) is a skincare tracking, organizing, and discovery app built to help users navigate their way through a multi-step routine safely and confidently. It walks users through phased, dermatology-inspired onboarding programs that ramp up active ingredients and exfoliants gradually, tracks routine extras like haircare and gua sha, and detects when a scheduled treatment—like a chemical peel, laser session, or microneedling—conflicts with ingredients in someone's routine. It also includes a product library with ethics/values tracking and expiry tracking, a calendar export, and a feedback system. Designed and built with React/Supabase architecture, custom typography and brand system, and accessibility incorporated from the start.",
    externalLink: "https://glowupdemo.melanie.studio/",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
    { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
    { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
    { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
    {
      type: "component",
      component: () => import('../projects/GlowUp/GlowUpFloat.jsx'),
      caption: "The Glow Up wordmark, in its native floating treatment from the app's own loading screen — set in Naskle.",
    },
  ]
  },   {
    id: 3,
    slug: "brightline",
    title: "Brightline Maps",
    disciplines: ["Fine Art", "Design & Print"],
    topics: null,
    client: { name: "Brightline", url: "https://www.gobrightline.com/" },
    year: "2017",
    description: "Mural-scale illustrated maps of South Florida, combining digital illustration with traditional techniques — hand-lettering and painted texture work — installed across Brightline's Miami, Fort Lauderdale, and West Palm Beach stations. Each map depicts train routes, stations, landmarks, and highways within Brightline's brand color system.",
    externalLink: "",
    thumbnail: "/images/projects/Brightline/Brightline_Maps_Melanie_Patterson_Crop.webp", // or: () => import('../projects/project-one/Thumbnail')
    hero: null,      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "https://placehold.co/1200x800/1a1a1a/FAF7F2", alt: "A watercolor painting of..." },
  { src: "https://placehold.co/800x1000/1a1a1a/FAF7F2", alt: "Detail shot of the upper left corner showing..." },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  } /*,
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
    id: 4,
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