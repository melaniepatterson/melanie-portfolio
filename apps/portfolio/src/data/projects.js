import React from 'react';

export const PROJECTS = [
  {
    id: 1,
    slug: "RISD",
    title: "Rhode Island School of Design",
    disciplines: ["Interactive Design", "Design & Print", "Photography, Film & Animation"],
    topics: null,
    client: null,
    year: "2021– ",
    description: "A description of this project and your process, materials, and intent behind the work.",
    externalLink: "",
    thumbnail: () => import('../projects/RISD/Thumbnail'),
    hero: () => import('../projects/RISD/Hero'),      // or: () => import('../projects/project-one/Hero')
    images: [
  { src: "/images/projects/RISD/melanie-patterson-risd.webp", alt: "Textured blue liquid gradient with the RISD seal in the center." },
  { src: "/images/projects/RISD/Rhode-Island-School-of-Design-Viewbook-Flip.webp", alt: "A gif flipping through the RISD viewbook. It's colorful pages and white debossed cover contrast a living wall of climbing philodendrons, pothos, and spider plants.", caption: "Viewbook design by Mary Banas and Jordan Gushwa (RISD Marketing & Communications); Video by me!", size: "small", lightbox: true },
  { 
    type: "inspiration-result",
    inspirationSrc: "/images/projects/RISD/RISD-Hooray-by-Alex-Rapport.webp",
    inspirationAlt: "'Hooray' text animation spelled out of yellow, orange, pink and white confetti against a blue background. Confetti falls and resets the animation.",
    inspirationCaption: <><i>Hooray</i> banner by Alex Rapport (RISD Marketing & Communications) </>,
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
  alt: "Screenshot of...",
  size: "large",
  caption: "Text caption",
  },
  { src: "https://placehold.co/600x600/1a1a1a/FAF7F2", alt: "The full piece installed at..." },
]
  },
    {
    id: 2,
    slug: "glow-up",
    title: "Glow Up",
    disciplines: ["Interactive Design", "Design & Print"],
    topics: null,
    client: null,
    year: "2026",
    description: "Glow Up is a skincare tracking, organizing, and discovery app built to help users navigate their way through a multi-step routine safely and confidently. It walks users through phased, dermatology-inspired onboarding programs that ramp up active ingredients and exfoliants gradually, tracks routine extras like haircare and gua sha, and detects when a scheduled treatment—like a chemical peel, laser session, or microneedling—conflicts with ingredients in someone's routine. It also includes a product library with ethics/values tracking and expiry tracking, a calendar export, and a feedback system. Designed and built with React/Supabase architecture, custom typography and brand system, and accessibility incorporated from the start.",
    externalLink: "",
    thumbnail: null, // or: () => import('../projects/project-one/Thumbnail')
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
    id: 3,
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