import React, { useState, useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";
import {
  Radio,
  Gauge,
  Send,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  GitCompare,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  ZoomIn,
  Camera,
  Settings2,
  Bot,
  X,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Layers,
  Globe,
  Sun,
  Sunset,
  Moon,
  Flame,
  Disc,
  Flag,
  Clock
} from "lucide-react";

const SEASONS = [2025, 2024, 2023, 2022];

const SPRINT_CALENDAR = {
  2022: ["Emilia Romagna", "Austria", "Brazil"],
  2023: ["Azerbaijan", "Austria", "Belgium", "Qatar", "United States", "Brazil"],
  2024: ["China", "Miami", "Austria", "United States", "Brazil", "Qatar"],
  2025: ["China", "Miami", "Belgium", "United States", "Brazil", "Qatar"]
};

const ALL_SESSIONS = [
  { id: "R", name: "Grand Prix (Race)", category: "RACE", requiresSprint: false },
  { id: "Q", name: "Qualifying (Full Session)", category: "QUALIFYING", requiresSprint: false },
  { id: "Q1", name: "Qualifying 1 (Q1 Knockout)", category: "QUALIFYING", requiresSprint: false },
  { id: "Q2", name: "Qualifying 2 (Q2 Knockout)", category: "QUALIFYING", requiresSprint: false },
  { id: "Q3", name: "Qualifying 3 (Q3 Pole Shootout)", category: "QUALIFYING", requiresSprint: false },
  { id: "S", name: "Sprint Race (100km)", category: "SPRINT", requiresSprint: true },
  { id: "SQ", name: "Sprint Qualifying (Full SQ)", category: "SPRINT", requiresSprint: true },
  { id: "SQ1", name: "Sprint Qualifying 1 (SQ1)", category: "SPRINT", requiresSprint: true },
  { id: "SQ2", name: "Sprint Qualifying 2 (SQ2)", category: "SPRINT", requiresSprint: true },
  { id: "SQ3", name: "Sprint Qualifying 3 (SQ3)", category: "SPRINT", requiresSprint: true },
  { id: "FP1", name: "Free Practice 1 (FP1)", category: "PRACTICE", requiresSprint: false },
  { id: "FP2", name: "Free Practice 2 (FP2)", category: "PRACTICE", requiresSprint: false, hideOnSprint: true },
  { id: "FP3", name: "Free Practice 3 (FP3)", category: "PRACTICE", requiresSprint: false, hideOnSprint: true }
];

const SEASON_CALENDARS = {
  2025: [
    "Australia", "China", "Japan", "Bahrain", "Saudi Arabia", "Miami",
    "Emilia Romagna", "Monaco", "Spain", "Canada", "Austria", "Silverstone",
    "Belgium", "Hungary", "Netherlands", "Italy", "Azerbaijan", "Singapore",
    "United States", "Mexico", "Brazil", "Las Vegas", "Qatar", "Abu Dhabi"
  ],
  2024: [
    "Bahrain", "Saudi Arabia", "Australia", "Japan", "China", "Miami",
    "Emilia Romagna", "Monaco", "Canada", "Spain", "Austria", "Silverstone",
    "Hungary", "Belgium", "Netherlands", "Italy", "Azerbaijan", "Singapore",
    "United States", "Mexico", "Brazil", "Las Vegas", "Qatar", "Abu Dhabi"
  ],
  2023: [
    "Bahrain", "Saudi Arabia", "Australia", "Azerbaijan", "Miami", "Monaco",
    "Spain", "Canada", "Austria", "Silverstone", "Hungary", "Belgium",
    "Netherlands", "Italy", "Singapore", "Japan", "Qatar", "United States",
    "Mexico", "Brazil", "Las Vegas", "Abu Dhabi"
  ],
  2022: [
    "Bahrain", "Saudi Arabia", "Australia", "Emilia Romagna", "Miami", "Spain",
    "Monaco", "Azerbaijan", "Canada", "Silverstone", "Austria", "Hungary",
    "Belgium", "Netherlands", "Italy", "Singapore", "Japan", "United States",
    "Mexico", "Brazil", "Abu Dhabi"
  ]
};

// ── 24 REAL-WORLD CIRCUIT LANDMARK ATTRACTIONS & PROXIMITY METADATA ──
const CIRCUIT_ATTRACTIONS = {
  "Monaco": {
    name: "Casino de Monte-Carlo & Port Hercules",
    subtitle: "Monte Carlo Street Perimeter • Sector 1 & Harbor",
    proximity: "Cars race directly through Casino Square past the Beaux-Arts casino steps, while Sector 3 lines the mega-yacht harbor of Port Hercules.",
    type: "MONACO_CASINO_HARBOR",
    tPos: 0.28,
    offsetDist: 7.5
  },
  "Singapore": {
    name: "Marina Bay Sands & The Singapore Flyer",
    subtitle: "Marina Bay Street Circuit • Infield & Skyline",
    proximity: "The world's largest observation wheel sits directly inside the track perimeter, while the tri-tower Marina Bay Sands Skypark anchors the night backdrop.",
    type: "SINGAPORE_MBS_FLYER",
    tPos: 0.55,
    offsetDist: -8.0
  },
  "Miami": {
    name: "Hard Rock Stadium & Miami Gondolas",
    subtitle: "Miami International Autodrome • Centerpiece Arena",
    proximity: "The circuit wraps directly around the home arena of the Miami Dolphins inside the stadium complex.",
    type: "MIAMI_STADIUM",
    tPos: 0.48,
    offsetDist: -9.5
  },
  "Azerbaijan": {
    name: "The Flame Towers & Baku Old City (Icherisheher)",
    subtitle: "Baku City Circuit • Castle Section Turn 8",
    proximity: "Drivers thread a 7.6-meter medieval fortress needle alongside historic walls while the LED Flame Towers dominate the horizon.",
    type: "BAKU_FLAME_CASTLE",
    tPos: 0.42,
    offsetDist: 7.0
  },
  "Australia": {
    name: "Albert Park Lake & Melbourne Skyline",
    subtitle: "Albert Park Circuit • Central Urban Lake",
    proximity: "The street track completely encircles the central urban park lake with palm trees and reflections of the Melbourne CBD skyline.",
    type: "MELBOURNE_LAKE_SKYLINE",
    tPos: 0.5,
    offsetDist: -7.5
  },
  "Japan": {
    name: "The Suzuka Circuit Ferris Wheel",
    subtitle: "Suzuka International Racing Course • Main Straight",
    proximity: "The giant observation wheel overlooks the figure-8 crossover and main straightaway as the global symbol of Suzuka.",
    type: "SUZUKA_WHEEL",
    tPos: 0.14,
    offsetDist: 8.0
  },
  "United States": {
    name: "The COTA Observation Tower",
    subtitle: "Circuit of the Americas (Austin) • Turns 16–18",
    proximity: "A striking 76-meter architectural tower with a sweeping red-neon canopy stands directly over the triple-apex right-hander.",
    type: "AUSTIN_COTA_TOWER",
    tPos: 0.74,
    offsetDist: -6.8
  },
  "Abu Dhabi": {
    name: "Yas Marina & The W Abu Dhabi Hotel",
    subtitle: "Yas Marina Circuit • Sector 3 Track Bridge",
    proximity: "The futuristic W Hotel arches directly over the racetrack with a color-shifting LED grid shell bridging both sides of the marina.",
    type: "ABU_DHABI_WHOTEL",
    tPos: 0.78,
    offsetDist: 0.0
  },
  "Canada": {
    name: "The Montreal Biosphere & Olympic Rowing Basin",
    subtitle: "Circuit Gilles-Villeneuve • Île Notre-Dame",
    proximity: "Situated next to Buckminster Fuller's geodesic Expo 67 dome and running parallel to the Olympic rowing straightaway.",
    type: "CANADA_BIOSPHERE",
    tPos: 0.35,
    offsetDist: 8.2
  },
  "Austria": {
    name: "The Bull of Spielberg Sculpture",
    subtitle: "Red Bull Ring • Center Infield Hill",
    proximity: "A massive 15-meter-tall steel arch and charging bull sculpture dominates the center of the infield hill overlooking the circuit.",
    type: "AUSTRIA_BULL",
    tPos: 0.46,
    offsetDist: -6.5
  },
  "Saudi Arabia": {
    name: "The Jeddah Corniche & The Red Sea",
    subtitle: "Jeddah Corniche Circuit • Red Sea Waterfront",
    proximity: "The fastest street circuit in the world is framed by the Red Sea shoreline, luxury waterfront pavilions, and illuminated palms.",
    type: "JEDDAH_CORNICHE",
    tPos: 0.62,
    offsetDist: 8.5
  },
  "Spain": {
    name: "IFEMA Madrid Exhibition Centre & Pavilions",
    subtitle: "Spanish GP Circuit • Convention Campus",
    proximity: "Wraps dynamically around the ultra-modern indoor exhibition halls and futuristic plaza arches.",
    type: "SPAIN_IFEMA",
    tPos: 0.32,
    offsetDist: 8.0
  },
  "Netherlands": {
    name: "The North Sea Dunes & Coastal Resort",
    subtitle: "Circuit Zandvoort • Banked Hugenholtz & Luyendyk",
    proximity: "Carved directly out of sweeping coastal sand dunes along the North Sea shoreline beside the 18-degree banked curves.",
    type: "ZANDVOORT_DUNES",
    tPos: 0.68,
    offsetDist: 8.0
  },
  "Bahrain": {
    name: "The Sakhir VIP Tower",
    subtitle: "Bahrain International Circuit • Main Pit Straight",
    proximity: "An 8-story circular luxury glass tower at the heart of the infield, lit with neon bands during the desert night race.",
    type: "BAHRAIN_TOWER",
    tPos: 0.12,
    offsetDist: -6.8
  },
  "Emilia Romagna": {
    name: "San Donato Fortress & Ayrton Senna Monument",
    subtitle: "Autodromo Enzo e Dino Ferrari (Imola) • Tamburello Park",
    proximity: "Sits alongside historic Italian fortress walls and the memorial park dedicated to Ayrton Senna inside the circuit.",
    type: "IMOLA_FORTRESS",
    tPos: 0.24,
    offsetDist: 7.5
  },
  "Italy": {
    name: "Parco di Monza & Reggia di Monza (Royal Palace)",
    subtitle: "Autodromo Nazionale Monza • Historic Banking & Park",
    proximity: "The Temple of Speed is embedded within Europe's largest walled park alongside the 18th-century Royal Palace estate.",
    type: "MONZA_PALACE",
    tPos: 0.52,
    offsetDist: 8.8
  },
  "Silverstone": {
    name: "The Silverstone Museum & Hilton Garden Inn Bridge",
    subtitle: "Silverstone Circuit • Hamilton Straight",
    proximity: "Features the interactive Silverstone Museum and the Hilton viewing bridge arching directly across the start/finish straight.",
    type: "SILVERSTONE_BRIDGE",
    tPos: 0.08,
    offsetDist: 0.0
  },
  "Hungary": {
    name: "The Mogyoród Valley & Aquarena Water Park",
    subtitle: "Hungaroring • Back Straight Valley Amphitheater",
    proximity: "Sits adjacent to the natural valley amphitheater visible as cars climb through the back sector.",
    type: "HUNGARY_WATERPARK",
    tPos: 0.58,
    offsetDist: 8.5
  },
  "Belgium": {
    name: "The Ardennes Forest & Eau Rouge River",
    subtitle: "Circuit de Spa-Francorchamps • Eau Rouge / Raidillon",
    proximity: "Climbs steeply through the dense Ardennes pine hills directly over the iron-red Eau Rouge stream.",
    type: "SPA_EAU_ROUGE",
    tPos: 0.18,
    offsetDist: -6.5
  },
  "Qatar": {
    name: "Lusail VIP Oasis & Iconic Stadium Complex",
    subtitle: "Lusail International Circuit • Illuminated Desert Corridor",
    proximity: "Runs parallel to the futuristic golden bowl stadium architecture and neon-lit desert VIP pavilions.",
    type: "QATAR_OASIS",
    tPos: 0.42,
    offsetDist: 8.5
  },
  "Brazil": {
    name: "The Interlagos Lakes (Represa de Guarapiranga)",
    subtitle: "Autódromo José Carlos Pace • Between Two Urban Lakes",
    proximity: "Interlagos literally translates to 'between lakes', framed by massive urban reservoirs on the horizon.",
    type: "BRAZIL_LAKES",
    tPos: 0.64,
    offsetDist: 9.0
  },
  "Mexico": {
    name: "The Foro Sol Stadium (GNP Seguros Stadium)",
    subtitle: "Autódromo Hermanos Rodríguez • Turns 12–15",
    proximity: "Drivers exit the high-speed Esses and drive directly through a packed 30,000-seat amphitheater stadium.",
    type: "MEXICO_FORO_SOL",
    tPos: 0.82,
    offsetDist: 0.0
  },
  "China": {
    name: "The Grand Wing Architecture Pavilions",
    subtitle: "Shanghai International Circuit • Main Straight Bridge",
    proximity: "Features dual futuristic winged sky-bridges spanning the full width of the main straightaway.",
    type: "CHINA_WINGS",
    tPos: 0.06,
    offsetDist: 0.0
  },
  "Las Vegas": {
    name: "The Sphere (Exosphere LED Arena)",
    subtitle: "Las Vegas Strip Circuit • Turns 5–9",
    proximity: "The 366-foot tall programmable LED Exosphere sits directly inside the Turns 5–9 complex, illuminating the entire street circuit.",
    type: "VEGAS_SPHERE",
    tPos: 0.34,
    offsetDist: -6.8
  }
};

// ── WORLD GLOBE F1 HOST COUNTRIES & MULTI-SEGMENT REGIONS (USA = 3 SEGMENTS, ITALY = 2 SEGMENTS) ──
const GLOBE_F1_LOCATIONS = [
  // United States divided into 3 distinct clickable regional segments
  {
    id: "USA_VEGAS",
    country: "United States (West • Segment 1/3)",
    circuit: "Las Vegas",
    gpTitle: "Las Vegas Grand Prix",
    attraction: "The Sphere (Turns 5–9)",
    lat: 36.1699,
    lon: -115.1398,
    color: "#f43f5e",
    segmentBadge: "USA SEGMENT 1/3 • WEST"
  },
  {
    id: "USA_AUSTIN",
    country: "United States (Central • Segment 2/3)",
    circuit: "United States",
    gpTitle: "United States Grand Prix (Austin, TX)",
    attraction: "The COTA Observation Tower",
    lat: 30.1328,
    lon: -97.6411,
    color: "#f97316",
    segmentBadge: "USA SEGMENT 2/3 • CENTRAL"
  },
  {
    id: "USA_MIAMI",
    country: "United States (East • Segment 3/3)",
    circuit: "Miami",
    gpTitle: "Miami Grand Prix",
    attraction: "Hard Rock Stadium",
    lat: 25.958,
    lon: -80.2389,
    color: "#06b6d4",
    segmentBadge: "USA SEGMENT 3/3 • EAST"
  },
  // Italy divided into 2 distinct clickable regional segments
  {
    id: "ITALY_MONZA",
    country: "Italy (North Lombardy • Segment 1/2)",
    circuit: "Italy",
    gpTitle: "Italian Grand Prix (Monza)",
    attraction: "Parco di Monza & Royal Palace",
    lat: 45.6156,
    lon: 9.2811,
    color: "#22c55e",
    segmentBadge: "ITALY SEGMENT 1/2 • MONZA"
  },
  {
    id: "ITALY_IMOLA",
    country: "Italy (Emilia-Romagna • Segment 2/2)",
    circuit: "Emilia Romagna",
    gpTitle: "Emilia Romagna Grand Prix (Imola)",
    attraction: "San Donato Fortress & Senna Statue",
    lat: 44.3439,
    lon: 11.7167,
    color: "#ef4444",
    segmentBadge: "ITALY SEGMENT 2/2 • IMOLA"
  },
  // Other 19 F1 Host Countries
  { id: "MON", country: "Monaco", circuit: "Monaco", gpTitle: "Monaco Grand Prix", attraction: "Casino de Monte-Carlo & Port Hercules", lat: 43.7347, lon: 7.4206, color: "#e11d48" },
  { id: "GBR", country: "United Kingdom", circuit: "Silverstone", gpTitle: "British Grand Prix", attraction: "Silverstone Museum & Hilton Bridge", lat: 52.0786, lon: -1.0169, color: "#38bdf8" },
  { id: "BEL", country: "Belgium", circuit: "Belgium", gpTitle: "Belgian Grand Prix", attraction: "Ardennes Forest & Eau Rouge River", lat: 50.4372, lon: 5.9714, color: "#facc15" },
  { id: "NLD", country: "Netherlands", circuit: "Netherlands", gpTitle: "Dutch Grand Prix", attraction: "North Sea Dunes & Zandvoort Coast", lat: 52.3888, lon: 4.5409, color: "#fb923c" },
  { id: "ESP", country: "Spain", circuit: "Spain", gpTitle: "Spanish Grand Prix", attraction: "IFEMA Madrid Exhibition Centre", lat: 40.465, lon: -3.616, color: "#f59e0b" },
  { id: "AUT", country: "Austria", circuit: "Austria", gpTitle: "Austrian Grand Prix", attraction: "The Bull of Spielberg Sculpture", lat: 47.2197, lon: 14.7647, color: "#dc2626" },
  { id: "HUN", country: "Hungary", circuit: "Hungary", gpTitle: "Hungarian Grand Prix", attraction: "Aquarell Water Park & Valley", lat: 47.5789, lon: 19.2486, color: "#10b981" },
  { id: "AZE", country: "Azerbaijan", circuit: "Azerbaijan", gpTitle: "Azerbaijan Grand Prix", attraction: "Flame Towers & Baku Old City", lat: 40.3725, lon: 49.8533, color: "#0ea5e9" },
  { id: "BHR", country: "Bahrain", circuit: "Bahrain", gpTitle: "Bahrain Grand Prix", attraction: "The Sakhir VIP Tower", lat: 26.0325, lon: 50.5106, color: "#ef4444" },
  { id: "SAU", country: "Saudi Arabia", circuit: "Saudi Arabia", gpTitle: "Saudi Arabian Grand Prix", attraction: "Jeddah Corniche & Red Sea", lat: 21.6319, lon: 39.1044, color: "#34d399" },
  { id: "QAT", country: "Qatar", circuit: "Qatar", gpTitle: "Qatar Grand Prix", attraction: "Lusail VIP Oasis & Stadium", lat: 25.49, lon: 51.4542, color: "#a855f7" },
  { id: "ARE", country: "United Arab Emirates", circuit: "Abu Dhabi", gpTitle: "Abu Dhabi Grand Prix", attraction: "Yas Marina & W Hotel Bridge", lat: 24.4672, lon: 54.6031, color: "#2dd4bf" },
  { id: "SGP", country: "Singapore", circuit: "Singapore", gpTitle: "Singapore Grand Prix", attraction: "Marina Bay Sands & Singapore Flyer", lat: 1.2914, lon: 103.864, color: "#f43f5e" },
  { id: "JPN", country: "Japan", circuit: "Japan", gpTitle: "Japanese Grand Prix", attraction: "Suzuka Circuit Ferris Wheel", lat: 34.8431, lon: 136.5407, color: "#fb7185" },
  { id: "CHN", country: "China", circuit: "China", gpTitle: "Chinese Grand Prix", attraction: "Grand Wing Architecture Pavilions", lat: 31.3389, lon: 121.2197, color: "#ef4444" },
  { id: "AUS", country: "Australia", circuit: "Australia", gpTitle: "Australian Grand Prix", attraction: "Albert Park Lake & Skyline", lat: -37.8497, lon: 144.968, color: "#eab308" },
  { id: "CAN", country: "Canada", circuit: "Canada", gpTitle: "Canadian Grand Prix", attraction: "Montreal Biosphere & Rowing Basin", lat: 45.5, lon: -73.5228, color: "#f87171" },
  { id: "MEX", country: "Mexico", circuit: "Mexico", gpTitle: "Mexican Grand Prix", attraction: "Foro Sol Stadium (GNP Seguros)", lat: 19.4042, lon: -99.0907, color: "#22c55e" },
  { id: "BRA", country: "Brazil", circuit: "Brazil", gpTitle: "São Paulo Grand Prix", attraction: "Interlagos Lakes (Guarapiranga)", lat: -23.7036, lon: -46.6997, color: "#facc15" }
];

const CIRCUIT_GEOMETRIES = {
  "Silverstone": [
    { x: -18, z: -14 }, { x: -8, z: -18 }, { x: 4, z: -20 }, { x: 14, z: -16 },
    { x: 10, z: -8 },  { x: 4, z: -6 },   { x: 8, z: 0 },    { x: 18, z: 2 },
    { x: 24, z: 8 },   { x: 22, z: 16 },  { x: 14, z: 20 },  { x: 6, z: 16 },
    { x: 2, z: 19 },   { x: -4, z: 17 },  { x: -8, z: 21 },  { x: -16, z: 22 },
    { x: -24, z: 16 }, { x: -26, z: 4 },  { x: -24, z: -6 }, { x: -20, z: -10 }
  ],
  "Monaco": [
    { x: -16, z: 10 }, { x: -12, z: -4 }, { x: -10, z: -14 }, { x: -2, z: -16 },
    { x: 8, z: -14 },  { x: 16, z: -10 }, { x: 20, z: -4 },   { x: 15, z: 0 },
    { x: 19, z: 4 },   { x: 24, z: 8 },   { x: 20, z: 14 },   { x: 8, z: 12 },
    { x: -2, z: 10 },  { x: -8, z: 12 },  { x: -12, z: 16 },  { x: -18, z: 18 },
    { x: -22, z: 14 }, { x: -19, z: 11 }
  ],
  "Italy": [
    { x: -24, z: -10 }, { x: 16, z: -10 }, { x: 22, z: -8 },  { x: 24, z: -2 },
    { x: 22, z: 6 },    { x: 18, z: 14 },  { x: 12, z: 14 },  { x: 8, z: 6 },
    { x: -4, z: 4 },    { x: -6, z: 8 },   { x: -18, z: 12 }, { x: -26, z: 8 },
    { x: -28, z: 0 },   { x: -26, z: -8 }
  ],
  "Belgium": [
    { x: -22, z: -12 }, { x: -18, z: -18 }, { x: -6, z: -10 }, { x: 4, z: -6 },
    { x: 18, z: -4 },   { x: 24, z: 2 },    { x: 20, z: 10 },  { x: 10, z: 8 },
    { x: 4, z: 14 },    { x: 12, z: 20 },   { x: 4, z: 24 },   { x: -8, z: 18 },
    { x: -16, z: 10 },  { x: -24, z: 4 },   { x: -20, z: -4 }
  ],
  "Bahrain": [
    { x: -18, z: -18 }, { x: -18, z: 14 }, { x: -12, z: 18 }, { x: -6, z: 12 },
    { x: 4, z: 16 },    { x: 16, z: 18 },  { x: 20, z: 10 },  { x: 12, z: 4 },
    { x: 6, z: 8 },     { x: 2, z: 2 },    { x: 14, z: -4 },  { x: 22, z: -12 },
    { x: 16, z: -18 },  { x: 0, z: -14 },  { x: -10, z: -18 }
  ],
  "Saudi Arabia": [
    { x: -26, z: -6 }, { x: -16, z: -8 }, { x: -6, z: -6 },  { x: 4, z: -8 },
    { x: 14, z: -6 },  { x: 24, z: -8 },  { x: 28, z: -2 },  { x: 22, z: 4 },
    { x: 12, z: 2 },   { x: 2, z: 4 },    { x: -8, z: 2 },   { x: -18, z: 4 },
    { x: -26, z: 2 }
  ],
  "Australia": [
    { x: -16, z: -14 }, { x: 8, z: -16 },  { x: 14, z: -12 }, { x: 22, z: -6 },
    { x: 24, z: 4 },    { x: 18, z: 14 },  { x: 6, z: 16 },   { x: -6, z: 12 },
    { x: -16, z: 14 },  { x: -22, z: 8 },  { x: -20, z: 0 },  { x: -24, z: -6 },
    { x: -20, z: -12 }
  ],
  "Japan": [
    { x: -20, z: -8 }, { x: -10, z: -14 }, { x: -2, z: -10 }, { x: 4, z: -14 },
    { x: 10, z: -6 },  { x: 2, z: 0 },     { x: 8, z: 8 },    { x: 18, z: 12 },
    { x: 24, z: 18 },  { x: 16, z: 22 },   { x: 4, z: 14 },   { x: -2, z: 2 },
    { x: -12, z: 6 },  { x: -22, z: 10 },  { x: -24, z: 0 }
  ],
  "China": [
    { x: -20, z: -14 }, { x: 10, z: -14 }, { x: 18, z: -8 },  { x: 14, z: 0 },
    { x: 8, z: -2 },    { x: 6, z: 4 },    { x: 18, z: 12 },  { x: 22, z: 18 },
    { x: 10, z: 20 },   { x: -6, z: 16 },  { x: -12, z: 8 },  { x: -4, z: 2 },
    { x: -20, z: 2 },   { x: -24, z: -6 }
  ],
  "Miami": [
    { x: -24, z: -6 }, { x: -10, z: -10 }, { x: 4, z: -8 },   { x: 18, z: -12 },
    { x: 26, z: -4 },  { x: 22, z: 6 },    { x: 14, z: 8 },   { x: 10, z: 2 },
    { x: -8, z: 4 },   { x: -22, z: 8 },   { x: -26, z: 2 }
  ],
  "Emilia Romagna": [
    { x: -22, z: -4 }, { x: -8, z: -10 }, { x: 8, z: -12 },  { x: 22, z: -8 },
    { x: 24, z: 2 },   { x: 16, z: 10 },  { x: 6, z: 6 },    { x: -4, z: 10 },
    { x: -14, z: 12 }, { x: -24, z: 6 }
  ],
  "Canada": [
    { x: -24, z: -6 }, { x: -18, z: -12 }, { x: -4, z: -10 }, { x: 10, z: -8 },
    { x: 24, z: -6 },  { x: 26, z: 2 },    { x: 20, z: 8 },   { x: 4, z: 6 },
    { x: -12, z: 6 },  { x: -22, z: 4 }
  ],
  "Spain": [
    { x: -20, z: -14 }, { x: 16, z: -14 }, { x: 22, z: -6 },  { x: 18, z: 4 },
    { x: 8, z: 2 },     { x: 4, z: 10 },   { x: 16, z: 14 },  { x: 12, z: 20 },
    { x: -8, z: 18 },   { x: -18, z: 10 }, { x: -12, z: 2 },  { x: -22, z: -4 }
  ],
  "Austria": [
    { x: -20, z: -12 }, { x: 12, z: -16 }, { x: 22, z: -4 },  { x: 18, z: 12 },
    { x: 6, z: 8 },     { x: -2, z: 2 },   { x: -8, z: 10 },  { x: -18, z: 14 },
    { x: -24, z: 2 }
  ],
  "Hungary": [
    { x: -18, z: -14 }, { x: 12, z: -14 }, { x: 18, z: -6 },  { x: 8, z: 0 },
    { x: 16, z: 8 },    { x: 12, z: 16 },  { x: 2, z: 12 },   { x: -4, z: 18 },
    { x: -14, z: 16 },  { x: -20, z: 6 },  { x: -12, z: -2 }, { x: -22, z: -6 }
  ],
  "Netherlands": [
    { x: -18, z: -14 }, { x: 8, z: -16 },  { x: 16, z: -8 },  { x: 6, z: -2 },
    { x: 18, z: 4 },    { x: 22, z: 14 },  { x: 10, z: 18 },  { x: -2, z: 12 },
    { x: -12, z: 16 },  { x: -20, z: 6 },  { x: -16, z: -4 }
  ],
  "Azerbaijan": [
    { x: -24, z: -12 }, { x: 18, z: -12 }, { x: 18, z: -2 },  { x: 6, z: -2 },
    { x: 6, z: 8 },     { x: 22, z: 10 },  { x: 24, z: 18 },  { x: 8, z: 18 },
    { x: -6, z: 12 },   { x: -16, z: 6 },  { x: -24, z: 0 }
  ],
  "Singapore": [
    { x: -20, z: -12 }, { x: 8, z: -14 },  { x: 18, z: -8 },  { x: 18, z: 6 },
    { x: 10, z: 14 },   { x: 0, z: 10 },   { x: -6, z: 16 },  { x: -18, z: 16 },
    { x: -22, z: 6 },   { x: -14, z: 0 },  { x: -22, z: -4 }
  ],
  "United States": [
    { x: -22, z: -12 }, { x: -8, z: -18 }, { x: 2, z: -10 },  { x: 12, z: -6 },
    { x: 24, z: 2 },    { x: 20, z: 8 },   { x: 2, z: 4 },    { x: -4, z: 12 },
    { x: 6, z: 16 },    { x: 2, z: 22 },   { x: -12, z: 18 }, { x: -18, z: 6 }
  ],
  "Mexico": [
    { x: -22, z: -12 }, { x: 16, z: -12 }, { x: 20, z: -4 },  { x: 8, z: -2 },
    { x: 10, z: 6 },    { x: 22, z: 10 },  { x: 18, z: 18 },  { x: 4, z: 16 },
    { x: -6, z: 8 },    { x: -14, z: 12 }, { x: -10, z: 2 },  { x: -22, z: 0 }
  ],
  "Brazil": [
    { x: -18, z: -14 }, { x: 12, z: -16 }, { x: 20, z: -6 },  { x: 14, z: 8 },
    { x: 2, z: 4 },     { x: -4, z: -4 },  { x: -10, z: 2 },  { x: -2, z: 14 },
    { x: -12, z: 18 },  { x: -22, z: 8 },  { x: -20, z: -4 }
  ],
  "Las Vegas": [
    { x: -22, z: -10 }, { x: -14, z: -16 }, { x: -4, z: -10 }, { x: 16, z: -12 },
    { x: 24, z: -4 },   { x: 22, z: 10 },   { x: 14, z: 14 },  { x: -20, z: 12 },
    { x: -24, z: 2 }
  ],
  "Qatar": [
    { x: -18, z: -16 }, { x: 14, z: -16 }, { x: 20, z: -8 },  { x: 10, z: -2 },
    { x: 20, z: 4 },    { x: 18, z: 14 },  { x: 6, z: 10 },   { x: 2, z: 18 },
    { x: -10, z: 16 },  { x: -18, z: 8 },  { x: -10, z: 0 },  { x: -20, z: -6 }
  ],
  "Abu Dhabi": [
    { x: -18, z: -14 }, { x: 4, z: -16 },  { x: 8, z: -6 },   { x: 22, z: -6 },
    { x: 24, z: 4 },    { x: 6, z: 6 },    { x: 8, z: 16 },   { x: -6, z: 18 },
    { x: -16, z: 12 },  { x: -12, z: 2 },  { x: -20, z: -4 }
  ]
};

const HISTORICAL_GRIDS = {
  2025: {
    LEC: { name: "Charles Leclerc", number: "16", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#ffffff", secondary: "#fde047", accent: "#ffffff", hpLogo: true, tireBand: "#ef4444", sponsors: ["HP", "SHELL", "UNICREDIT"], roughness: 0.18, metalness: 0.6 },
    HAM: { name: "Lewis Hamilton", number: "44", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#ffffff", secondary: "#fde047", accent: "#ffffff", hpLogo: true, tireBand: "#fde047", sponsors: ["HP", "SHELL", "PERONI"], roughness: 0.18, metalness: 0.6 },
    NOR: { name: "Lando Norris", number: "4", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#111827", accent: "#00f0ff", chromeWheels: true, tireBand: "#ef4444", sponsors: ["GOOGLE", "OKX", "CHROME"], roughness: 0.22, metalness: 0.45 },
    PIA: { name: "Oscar Piastri", number: "81", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#111827", accent: "#00f0ff", chromeWheels: true, tireBand: "#fde047", sponsors: ["GOOGLE", "OKX", "ANDROID"], roughness: 0.22, metalness: 0.45 },
    VER: { name: "Max Verstappen", number: "1", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["ORACLE", "RED BULL", "MOBIL 1"], roughness: 0.35, metalness: 0.25 },
    LAW: { name: "Liam Lawson", number: "30", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#fde047", sponsors: ["ORACLE", "RED BULL", "HONDA"], roughness: 0.35, metalness: 0.25 },
    RUS: { name: "George Russell", number: "63", team: "Mercedes-AMG", primary: "#121417", deckColor: "#d1d5db", secondary: "#00a19c", accent: "#d1d5db", tireBand: "#ef4444", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.75 },
    ANT: { name: "Kimi Antonelli", number: "12", team: "Mercedes-AMG", primary: "#121417", deckColor: "#d1d5db", secondary: "#00a19c", accent: "#d1d5db", tireBand: "#fde047", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.75 },
    ALO: { name: "Fernando Alonso", number: "14", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#fde047", sponsors: ["ARAMCO", "HONDA", "VALVOLINE"], roughness: 0.18, metalness: 0.65 },
    STR: { name: "Lance Stroll", number: "18", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#f8fafc", sponsors: ["ARAMCO", "BOSS", "COGNIZANT"], roughness: 0.18, metalness: 0.65 },
    SAI: { name: "Carlos Sainz", number: "55", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#f97316", tireBand: "#ef4444", sponsors: ["KOMATSU", "DURACELL", "GULF"], roughness: 0.2, metalness: 0.6 },
    ALB: { name: "Alex Albon", number: "23", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#f97316", tireBand: "#fde047", sponsors: ["KOMATSU", "DURACELL", "KRAKEN"], roughness: 0.2, metalness: 0.6 },
    GAS: { name: "Pierre Gasly", number: "10", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#111827", tireBand: "#ef4444", sponsors: ["BWT", "RENAULT", "CASTROL"], roughness: 0.22, metalness: 0.5 },
    DOO: { name: "Jack Doohan", number: "7", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#111827", tireBand: "#fde047", sponsors: ["BWT", "RENAULT", "ALPINE"], roughness: 0.22, metalness: 0.5 },
    OCO: { name: "Esteban Ocon", number: "31", team: "Haas F1 Team", primary: "#f8fafc", deckColor: "#0b0f19", secondary: "#dc2626", accent: "#0f172a", tireBand: "#ef4444", sponsors: ["MONEYGRAM", "HAAS", "TOYOTA"], roughness: 0.2, metalness: 0.35 },
    BEA: { name: "Oliver Bearman", number: "87", team: "Haas F1 Team", primary: "#f8fafc", deckColor: "#0b0f19", secondary: "#dc2626", accent: "#0f172a", tireBand: "#fde047", sponsors: ["MONEYGRAM", "HAAS", "TOYOTA"], roughness: 0.2, metalness: 0.35 },
    TSU: { name: "Yuki Tsunoda", number: "22", team: "Racing Bulls", primary: "#1e40af", deckColor: "#ffffff", secondary: "#ffffff", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["VISA", "CASH APP", "HONDA"], roughness: 0.16, metalness: 0.65 },
    HAD: { name: "Isack Hadjar", number: "6", team: "Racing Bulls", primary: "#1e40af", deckColor: "#ffffff", secondary: "#ffffff", accent: "#ef4444", tireBand: "#fde047", sponsors: ["VISA", "CASH APP", "RED BULL"], roughness: 0.16, metalness: 0.65 },
    HUL: { name: "Nico Hulkenberg", number: "27", team: "Kick Sauber", primary: "#111827", deckColor: "#22c55e", secondary: "#22c55e", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["STAKE", "KICK", "PIRELLI"], roughness: 0.2, metalness: 0.5 },
    BOR: { name: "Gabriel Bortoleto", number: "5", team: "Kick Sauber", primary: "#111827", deckColor: "#22c55e", secondary: "#22c55e", accent: "#ffffff", tireBand: "#fde047", sponsors: ["STAKE", "KICK", "SAUBER"], roughness: 0.2, metalness: 0.5 }
  },
  2024: {
    VER: { name: "Max Verstappen", number: "1", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["ORACLE", "RED BULL", "BYBIT"], roughness: 0.35, metalness: 0.25 },
    PER: { name: "Sergio Perez", number: "11", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#fde047", sponsors: ["ORACLE", "RED BULL", "TELCEL"], roughness: 0.35, metalness: 0.25 },
    NOR: { name: "Lando Norris", number: "4", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#111827", accent: "#00f0ff", chromeWheels: true, tireBand: "#ef4444", sponsors: ["GOOGLE", "OKX", "CHROME"], roughness: 0.22, metalness: 0.45 },
    PIA: { name: "Oscar Piastri", number: "81", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#111827", accent: "#00f0ff", chromeWheels: true, tireBand: "#fde047", sponsors: ["GOOGLE", "OKX", "CISCO"], roughness: 0.22, metalness: 0.45 },
    LEC: { name: "Charles Leclerc", number: "16", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#ffffff", secondary: "#fde047", accent: "#ffffff", hpLogo: true, tireBand: "#ef4444", sponsors: ["HP", "SHELL", "SANTANDER"], roughness: 0.18, metalness: 0.6 },
    SAI: { name: "Carlos Sainz", number: "55", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#ffffff", secondary: "#fde047", accent: "#ffffff", hpLogo: true, tireBand: "#fde047", sponsors: ["HP", "SHELL", "SANTANDER"], roughness: 0.18, metalness: 0.6 },
    HAM: { name: "Lewis Hamilton", number: "44", team: "Mercedes-AMG", primary: "#121417", deckColor: "#d1d5db", secondary: "#00a19c", accent: "#d1d5db", tireBand: "#ef4444", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.75 },
    RUS: { name: "George Russell", number: "63", team: "Mercedes-AMG", primary: "#121417", deckColor: "#d1d5db", secondary: "#00a19c", accent: "#d1d5db", tireBand: "#fde047", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.75 },
    ALO: { name: "Fernando Alonso", number: "14", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["ARAMCO", "COGNIZANT", "VALVOLINE"], roughness: 0.18, metalness: 0.65 },
    STR: { name: "Lance Stroll", number: "18", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#fde047", sponsors: ["ARAMCO", "COGNIZANT", "BOSS"], roughness: 0.18, metalness: 0.65 },
    GAS: { name: "Pierre Gasly", number: "10", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#111827", tireBand: "#ef4444", sponsors: ["BWT", "RENAULT", "BP"], roughness: 0.22, metalness: 0.5 },
    OCO: { name: "Esteban Ocon", number: "31", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#111827", tireBand: "#fde047", sponsors: ["BWT", "RENAULT", "CASTROL"], roughness: 0.22, metalness: 0.5 },
    ALB: { name: "Alex Albon", number: "23", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#f97316", tireBand: "#ef4444", sponsors: ["KOMATSU", "DURACELL", "GULF"], roughness: 0.2, metalness: 0.6 },
    COL: { name: "Franco Colapinto", number: "43", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#f97316", tireBand: "#fde047", sponsors: ["KOMATSU", "GLOBANT", "MERCADO"], roughness: 0.2, metalness: 0.6 },
    TSU: { name: "Yuki Tsunoda", number: "22", team: "RB F1 Team", primary: "#1e40af", deckColor: "#ffffff", secondary: "#ffffff", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["VISA", "CASH APP", "HONDA"], roughness: 0.16, metalness: 0.65 },
    RIC: { name: "Daniel Ricciardo", number: "3", team: "RB F1 Team", primary: "#1e40af", deckColor: "#ffffff", secondary: "#ffffff", accent: "#ef4444", tireBand: "#fde047", sponsors: ["VISA", "CASH APP", "TUDOR"], roughness: 0.16, metalness: 0.65 },
    HUL: { name: "Nico Hulkenberg", number: "27", team: "Haas F1 Team", primary: "#111827", deckColor: "#f8fafc", secondary: "#dc2626", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["MONEYGRAM", "HAAS", "CHIPOTLE"], roughness: 0.2, metalness: 0.35 },
    MAG: { name: "Kevin Magnussen", number: "20", team: "Haas F1 Team", primary: "#111827", deckColor: "#f8fafc", secondary: "#dc2626", accent: "#ffffff", tireBand: "#fde047", sponsors: ["MONEYGRAM", "HAAS", "PALM"], roughness: 0.2, metalness: 0.35 },
    BOT: { name: "Valtteri Bottas", number: "77", team: "Kick Sauber", primary: "#111827", deckColor: "#22c55e", secondary: "#22c55e", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["STAKE", "KICK", "SINGHA"], roughness: 0.2, metalness: 0.5 },
    ZHO: { name: "Zhou Guanyu", number: "24", team: "Kick Sauber", primary: "#111827", deckColor: "#22c55e", secondary: "#22c55e", accent: "#ffffff", tireBand: "#fde047", sponsors: ["STAKE", "KICK", "SENSE"], roughness: 0.2, metalness: 0.5 }
  },
  2023: {
    VER: { name: "Max Verstappen", number: "1", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["ORACLE", "RED BULL", "BYBIT"], roughness: 0.35, metalness: 0.25 },
    PER: { name: "Sergio Perez", number: "11", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#fde047", sponsors: ["ORACLE", "RED BULL", "HONDA"], roughness: 0.35, metalness: 0.25 },
    HAM: { name: "Lewis Hamilton", number: "44", team: "Mercedes-AMG", primary: "#121417", deckColor: "#121417", secondary: "#00a19c", accent: "#d1d5db", tireBand: "#ef4444", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.75 },
    RUS: { name: "George Russell", number: "63", team: "Mercedes-AMG", primary: "#121417", deckColor: "#121417", secondary: "#00a19c", accent: "#d1d5db", tireBand: "#fde047", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.75 },
    LEC: { name: "Charles Leclerc", number: "16", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#111827", secondary: "#fde047", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["SHELL", "SANTANDER", "CEVA"], roughness: 0.18, metalness: 0.6 },
    SAI: { name: "Carlos Sainz", number: "55", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#111827", secondary: "#fde047", accent: "#ffffff", tireBand: "#fde047", sponsors: ["SHELL", "SANTANDER", "AWS"], roughness: 0.18, metalness: 0.6 },
    NOR: { name: "Lando Norris", number: "4", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#38bdf8", accent: "#00f0ff", chromeWheels: true, tireBand: "#ef4444", sponsors: ["GOOGLE", "OKX", "CHROME"], roughness: 0.22, metalness: 0.45 },
    PIA: { name: "Oscar Piastri", number: "81", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#38bdf8", accent: "#00f0ff", chromeWheels: true, tireBand: "#fde047", sponsors: ["GOOGLE", "OKX", "DELL"], roughness: 0.22, metalness: 0.45 },
    ALO: { name: "Fernando Alonso", number: "14", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["ARAMCO", "COGNIZANT", "PERONI"], roughness: 0.18, metalness: 0.65 },
    STR: { name: "Lance Stroll", number: "18", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#fde047", sponsors: ["ARAMCO", "COGNIZANT", "BOSS"], roughness: 0.18, metalness: 0.65 },
    GAS: { name: "Pierre Gasly", number: "10", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#111827", tireBand: "#ef4444", sponsors: ["BWT", "ALPINE", "CASTROL"], roughness: 0.22, metalness: 0.5 },
    OCO: { name: "Esteban Ocon", number: "31", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#111827", tireBand: "#fde047", sponsors: ["BWT", "ALPINE", "RENAULT"], roughness: 0.22, metalness: 0.5 },
    ALB: { name: "Alex Albon", number: "23", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#f97316", tireBand: "#ef4444", sponsors: ["DURACELL", "GULF", "STEPHENS"], roughness: 0.2, metalness: 0.6 },
    SAR: { name: "Logan Sargeant", number: "2", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#f97316", tireBand: "#fde047", sponsors: ["DURACELL", "GULF", "ACRONIS"], roughness: 0.2, metalness: 0.6 },
    TSU: { name: "Yuki Tsunoda", number: "22", team: "AlphaTauri", primary: "#1e293b", deckColor: "#ffffff", secondary: "#dc2626", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["ORLEN", "ALPHATAURI", "HONDA"], roughness: 0.2, metalness: 0.5 },
    RIC: { name: "Daniel Ricciardo", number: "3", team: "AlphaTauri", primary: "#1e293b", deckColor: "#ffffff", secondary: "#dc2626", accent: "#ffffff", tireBand: "#fde047", sponsors: ["ORLEN", "ALPHATAURI", "FLEXBOX"], roughness: 0.2, metalness: 0.5 },
    BOT: { name: "Valtteri Bottas", number: "77", team: "Alfa Romeo", primary: "#991b1b", deckColor: "#111827", secondary: "#f8fafc", accent: "#dc2626", tireBand: "#ef4444", sponsors: ["STAKE", "ALFA ROMEO", "SINGHA"], roughness: 0.2, metalness: 0.55 },
    ZHO: { name: "Zhou Guanyu", number: "24", team: "Alfa Romeo", primary: "#991b1b", deckColor: "#111827", secondary: "#f8fafc", accent: "#dc2626", tireBand: "#fde047", sponsors: ["STAKE", "ALFA ROMEO", "AMX"], roughness: 0.2, metalness: 0.55 },
    HUL: { name: "Nico Hulkenberg", number: "27", team: "Haas F1 Team", primary: "#111827", deckColor: "#f8fafc", secondary: "#dc2626", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["MONEYGRAM", "HAAS", "OAKBERRY"], roughness: 0.2, metalness: 0.35 },
    MAG: { name: "Kevin Magnussen", number: "20", team: "Haas F1 Team", primary: "#111827", deckColor: "#f8fafc", secondary: "#dc2626", accent: "#ffffff", tireBand: "#fde047", sponsors: ["MONEYGRAM", "HAAS", "CHIPOTLE"], roughness: 0.2, metalness: 0.35 }
  },
  2022: {
    VER: { name: "Max Verstappen", number: "1", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["ORACLE", "RED BULL", "BYBIT"], roughness: 0.35, metalness: 0.25 },
    PER: { name: "Sergio Perez", number: "11", team: "Red Bull Racing", primary: "#06142e", deckColor: "#06142e", secondary: "#fcd34d", accent: "#ef4444", tireBand: "#fde047", sponsors: ["ORACLE", "RED BULL", "TELCEL"], roughness: 0.35, metalness: 0.25 },
    LEC: { name: "Charles Leclerc", number: "16", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#111827", secondary: "#111827", accent: "#fde047", tireBand: "#ef4444", sponsors: ["SHELL", "SANTANDER", "VELAS"], roughness: 0.18, metalness: 0.6 },
    SAI: { name: "Carlos Sainz", number: "55", team: "Scuderia Ferrari", primary: "#dc2626", deckColor: "#111827", secondary: "#111827", accent: "#fde047", tireBand: "#fde047", sponsors: ["SHELL", "SANTANDER", "AWS"], roughness: 0.18, metalness: 0.6 },
    RUS: { name: "George Russell", number: "63", team: "Mercedes-AMG", primary: "#94a3b8", deckColor: "#1e293b", secondary: "#00a19c", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.8 },
    HAM: { name: "Lewis Hamilton", number: "44", team: "Mercedes-AMG", primary: "#94a3b8", deckColor: "#1e293b", secondary: "#00a19c", accent: "#fde047", tireBand: "#fde047", sponsors: ["PETRONAS", "AMG", "INEOS"], roughness: 0.15, metalness: 0.8 },
    NOR: { name: "Lando Norris", number: "4", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#38bdf8", accent: "#00f0ff", chromeWheels: true, tireBand: "#ef4444", sponsors: ["GOOGLE", "VELO", "ANDROID"], roughness: 0.22, metalness: 0.45 },
    RIC: { name: "Daniel Ricciardo", number: "3", team: "McLaren", primary: "#ff8000", deckColor: "#111827", secondary: "#38bdf8", accent: "#00f0ff", chromeWheels: true, tireBand: "#fde047", sponsors: ["GOOGLE", "VELO", "SPLUNK"], roughness: 0.22, metalness: 0.45 },
    ALO: { name: "Fernando Alonso", number: "14", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["BWT", "ALPINE", "CASTROL"], roughness: 0.22, metalness: 0.5 },
    OCO: { name: "Esteban Ocon", number: "31", team: "Alpine", primary: "#0072bb", deckColor: "#f472b6", secondary: "#f472b6", accent: "#ffffff", tireBand: "#fde047", sponsors: ["BWT", "ALPINE", "RENAULT"], roughness: 0.22, metalness: 0.5 },
    VET: { name: "Sebastian Vettel", number: "5", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#ef4444", sponsors: ["ARAMCO", "COGNIZANT", "PERONI"], roughness: 0.18, metalness: 0.65 },
    STR: { name: "Lance Stroll", number: "18", team: "Aston Martin", primary: "#00594f", deckColor: "#00594f", secondary: "#a3e635", accent: "#ffffff", tireBand: "#fde047", sponsors: ["ARAMCO", "COGNIZANT", "JCB"], roughness: 0.18, metalness: 0.65 },
    BOT: { name: "Valtteri Bottas", number: "77", team: "Alfa Romeo", primary: "#991b1b", deckColor: "#ffffff", secondary: "#ffffff", accent: "#16a34a", tireBand: "#ef4444", sponsors: ["ORLEN", "ALFA ROMEO", "SINGHA"], roughness: 0.2, metalness: 0.55 },
    ZHO: { name: "Zhou Guanyu", number: "24", team: "Alfa Romeo", primary: "#991b1b", deckColor: "#ffffff", secondary: "#ffffff", accent: "#16a34a", tireBand: "#fde047", sponsors: ["ORLEN", "ALFA ROMEO", "AMX"], roughness: 0.2, metalness: 0.55 },
    GAS: { name: "Pierre Gasly", number: "10", team: "AlphaTauri", primary: "#1e293b", deckColor: "#ffffff", secondary: "#ffffff", accent: "#38bdf8", tireBand: "#ef4444", sponsors: ["ALPHATAURI", "HONDA", "FANTOM"], roughness: 0.2, metalness: 0.5 },
    TSU: { name: "Yuki Tsunoda", number: "22", team: "AlphaTauri", primary: "#1e293b", deckColor: "#ffffff", secondary: "#ffffff", accent: "#38bdf8", tireBand: "#fde047", sponsors: ["ALPHATAURI", "HONDA", "BUZZ"], roughness: 0.2, metalness: 0.5 },
    MAG: { name: "Kevin Magnussen", number: "20", team: "Haas F1 Team", primary: "#ffffff", deckColor: "#dc2626", secondary: "#dc2626", accent: "#111827", tireBand: "#ef4444", sponsors: ["HAAS", "1&1", "UNDER ARMOUR"], roughness: 0.2, metalness: 0.35 },
    MSC: { name: "Mick Schumacher", number: "47", team: "Haas F1 Team", primary: "#ffffff", deckColor: "#dc2626", secondary: "#dc2626", accent: "#111827", tireBand: "#fde047", sponsors: ["HAAS", "1&1", "IONOS"], roughness: 0.2, metalness: 0.35 },
    ALB: { name: "Alex Albon", number: "23", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#ef4444", tireBand: "#ef4444", sponsors: ["DURACELL", "LAVAZZA", "SOFINA"], roughness: 0.2, metalness: 0.6 },
    LAT: { name: "Nicholas Latifi", number: "6", team: "Williams", primary: "#004fd4", deckColor: "#0a1128", secondary: "#38bdf8", accent: "#ef4444", tireBand: "#fde047", sponsors: ["DURACELL", "LAVAZZA", "SOFINA"], roughness: 0.2, metalness: 0.6 }
  }
};

export default function App() {
  const [selectedSeason, setSelectedSeason] = useState(2024);
  const [selectedSession, setSelectedSession] = useState("Q");
  const [selectedCircuit, setSelectedCircuit] = useState("Silverstone");

  const [sessionInfoOpen, setSessionInfoOpen] = useState(true);
  const [scrubberOpen, setScrubberOpen] = useState(true);
  const [telemetryOpen, setTelemetryOpen] = useState(true);

  const activeCalendar = useMemo(
    () => SEASON_CALENDARS[selectedSeason] || SEASON_CALENDARS[2024],
    [selectedSeason]
  );

  const isSprintWeekend = useMemo(() => {
    const sprintList = SPRINT_CALENDAR[selectedSeason] || [];
    return sprintList.includes(selectedCircuit);
  }, [selectedSeason, selectedCircuit]);

  const availableSessions = useMemo(() => {
    return ALL_SESSIONS.filter((sess) => {
      if (sess.requiresSprint && !isSprintWeekend) return false;
      if (sess.hideOnSprint && isSprintWeekend) return false;
      return true;
    });
  }, [isSprintWeekend]);

  const currentGrid = useMemo(
    () => HISTORICAL_GRIDS[selectedSeason] || HISTORICAL_GRIDS[2024],
    [selectedSeason]
  );
  const driverKeys = useMemo(() => Object.keys(currentGrid), [currentGrid]);

  const [driverA, setDriverA] = useState("LEC");
  const [driverB, setDriverB] = useState("NOR");
  const [comparing, setComparing] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showGlobeModal, setShowGlobeModal] = useState(false);

  // Lap selection & Time of Day state
  const [availableLaps, setAvailableLaps] = useState(Array.from({ length: 52 }, (_, i) => i + 1));
  const [selectedLap, setSelectedLap] = useState("FASTEST"); // "FASTEST" or integer lap number (1..N)
  const [timeOfDay, setTimeOfDay] = useState("AFTERNOON"); // "MORNING", "AFTERNOON", "EVENING", "NIGHT"
  const [gantryLightsCount, setGantryLightsCount] = useState(0); // 0=Off/Green, 1..5=Red Lights, 6=LIGHTS OUT!
  const [hoveredAttraction, setHoveredAttraction] = useState(null);

// ── 22-CAR LIVE BROADCAST MODE, FIA FLAGS & PDF REPORT GENERATOR ──
  const [isLive22CarMode, setIsLive22CarMode] = useState(false);
  const [liveFlagStatus, setLiveFlagStatus] = useState("GREEN"); // "GREEN", "FORMATION_START", "SAFETY_CAR", "RED_FLAG", "CRASH"
  const [liveBroadcastState, setLiveBroadcastState] = useState(null);
  const liveBroadcastRef = useRef(null);
  const isLive22Ref = useRef(false);

  useEffect(() => {
    isLive22Ref.current = isLive22CarMode;
  }, [isLive22CarMode]);

  useEffect(() => {
    liveBroadcastRef.current = liveBroadcastState;
  }, [liveBroadcastState]);

  // Poll /api/live_grid when 22-Car Live Broadcast Mode is active
  useEffect(() => {
    if (!isLive22CarMode) return;
    let tickCounter = 0;
    const fetchLiveGrid = async () => {
      tickCounter += 0.45;
      try {
        const res = await fetch("http://127.0.0.1:8000/api/live_grid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grand_prix: selectedCircuit,
            year: 2026,
            tick: tickCounter,
            override_flag: liveFlagStatus
          })
        });
        const data = await res.json();
        if (res.ok && data.cars) {
          setLiveBroadcastState(data);
        }
      } catch (err) {
        console.warn("Live 22-car grid sync error:", err);
      }
    };
    fetchLiveGrid();
    const intervalId = setInterval(fetchLiveGrid, 350);
    return () => clearInterval(intervalId);
  }, [isLive22CarMode, selectedCircuit, liveFlagStatus]);

// ── DYNAMIC FIA ENGINEERING PDF REPORT GENERATOR (FROM AI AGENT CHAT) ──
  const downloadRaceReportPDF = (reportTitle, reportContent) => {
    const printWin = window.open("", "_blank", "width=960,height=1080");
    if (!printWin) return;
    const timestamp = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

    // Clean up markdown asterisks or formatting from chat text for a cleaner PDF printout
    const formattedContent = reportContent
      .replace(/[*_#]/g, "")
      .split("\n")
      .map(line => `<p style="margin: 0 0 10px 0; text-align: justify;">${line}</p>`)
      .join("");

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FIA Pitwall Technical Report — ${selectedSeason} ${selectedCircuit} GP</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Titillium+Web:wght@400;600;700&display=swap');
            body {
              font-family: 'Titillium Web', sans-serif;
              background: #0b0e17;
              color: #e2e8f0;
              margin: 0;
              padding: 36px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              border-bottom: 3px solid #e10600;
              padding-bottom: 16px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-family: 'Orbitron', sans-serif;
              font-size: 20px;
              font-weight: 900;
              color: #ffffff;
              text-transform: uppercase;
            }
            .badge {
              background: #e10600;
              color: #fff;
              font-family: 'Orbitron', sans-serif;
              font-size: 11px;
              padding: 6px 12px;
              border-radius: 6px;
              font-weight: 700;
            }
            .meta-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 24px;
            }
            .meta-card {
              background: #141926;
              border: 1px solid #262f45;
              padding: 12px;
              border-radius: 10px;
            }
            .meta-label {
              font-size: 10px;
              color: #38bdf8;
              font-weight: 700;
              text-transform: uppercase;
            }
            .meta-val {
              font-size: 14px;
              font-weight: 700;
              color: #ffffff;
              margin-top: 4px;
            }
            .section {
              background: #121723;
              border: 1px solid #1f293d;
              border-radius: 12px;
              padding: 22px;
              margin-bottom: 20px;
              line-height: 1.7;
              font-size: 14px;
              color: #cbd5e1;
            }
            .footer {
              margin-top: 32px;
              font-size: 11px;
              color: #64748b;
              text-align: center;
              border-top: 1px solid #1e293b;
              padding-top: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">F1 PITWALL TECHNICAL DOSSIER — ${reportTitle}</div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                Generated by Pitwall AI Race Engineer • ${timestamp} IST
              </div>
            </div>
            <div class="badge">OFFICIAL TELEMETRY PDF</div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">Season & Circuit</div>
              <div class="meta-val">${selectedSeason} ${selectedCircuit} GP</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Session & Lap</div>
              <div class="meta-val">${selectedSession} • Lap: ${selectedLap}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Active Driver Duel</div>
              <div class="meta-val">${driverA} vs ${driverB}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">Fastest Lap / Delta</div>
              <div class="meta-val">${telemetry.lapTime}</div>
            </div>
          </div>

          <div class="section">
            <h3 style="margin-top:0; color:#facc15; font-family:'Orbitron',sans-serif; font-size:15px; margin-bottom: 14px; border-bottom: 1px solid #1f293d; padding-bottom: 8px;">
              AI RACE ENGINEER RESPONSE & ANALYSIS
            </h3>
            ${formattedContent}
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-label">${driverA} Live Speed / Gear</div>
              <div class="meta-val">${telemetry.speed} KM/H • Gear ${telemetry.gear}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">${driverB} Live Speed / Gear</div>
              <div class="meta-val">${telemetry.speedB} KM/H • Gear ${telemetry.gearB}</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">${driverA} Tyre Compound</div>
              <div class="meta-val">${statsA.compound} (${statsA.tyre_life_laps} Laps)</div>
            </div>
            <div class="meta-card">
              <div class="meta-label">${driverB} Tyre Compound</div>
              <div class="meta-val">${statsB.compound} (${statsB.tyre_life_laps} Laps)</div>
            </div>
          </div>

          <div class="footer">
            F1 Multi-Season Telemetry & Strategy Engine • FastF1 v3.9 + Groq AI Pitwall Orchestrator
          </div>
          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const [sessionLoading, setSessionLoading] = useState(false);
  const [dataSourceBadge, setDataSourceBadge] = useState("FASTF1 ARCHIVE SYNCED");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [isAgentMaximized, setIsAgentMaximized] = useState(false);

  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [speechPitch, setSpeechPitch] = useState(0.95);
  const [speechRate, setSpeechRate] = useState(1.05);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [scrubProgress, setScrubProgress] = useState(0);
  const [liveDelta, setLiveDelta] = useState("+0.000s");
  const [cameraMode, setCameraMode] = useState("ORBIT");

  const [messages, setMessages] = useState([
    {
      sender: "PITWALL",
      text: "Multi-Season FastF1 Telemetry Engine online. Switch Seasons (2022–2025), Sessions, Grand Prix circuits, Laps, or open the 3D World Globe from the top command bar.",
      specialist: "SUPERVISOR",
      time: "ONLINE"
    }
  ]);

  const [telemetry, setTelemetry] = useState({
    // Driver A Telemetry Channels
    speed: 312,
    throttle: 98,
    brake: 0,
    gear: 8,
    rpm: 11850,
    drs: "OPEN",
    // Driver B Telemetry Channels
    speedB: 309,
    throttleB: 96,
    brakeB: 0,
    gearB: 8,
    rpmB: 11720,
    drsB: "OPEN",
    // Session Meta
    lapTime: "1:25.819 (NOR)",
    topSpeed: 336.8
  });

  const [comparisonData, setComparisonData] = useState(null);
  const [sessionTrace, setSessionTrace] = useState(null);

  const comparisonRef = useRef(null);
  const sessionTraceRef = useRef(null);
  const selectedLapRef = useRef("FASTEST");

  useEffect(() => {
    comparisonRef.current = comparisonData;
  }, [comparisonData]);

  useEffect(() => {
    sessionTraceRef.current = sessionTrace;
  }, [sessionTrace]);

  useEffect(() => {
    selectedLapRef.current = selectedLap;
  }, [selectedLap]);

  const speedRef = useRef(null);
  const canvasRef = useRef(null);
  const globeCanvasRef = useRef(null);
  const chatScrollRef = useRef(null);
  const recognitionRef = useRef(null);

  const playbackRef = useRef({
    isPlaying: true,
    speed: 1.0,
    progress: 0.0,
    cameraMode: "ORBIT",
    lap1HoldTimer: 0.0
  });

  const threeState = useRef({
    scene: null,
    renderer: null,
    camera: null,
    controls: null,
    ambientLight: null,
    sunLight: null,
    trackGroup: null,
    environmentGroup: null,
    attractionMesh: null,
    gantryLights: [],
    carA: null,
    carB: null,
    curve: null,
    rawPoints: null,
    balloons: [],
    animId: null
  });

  useEffect(() => {
    if (!activeCalendar.includes(selectedCircuit)) {
      setSelectedCircuit(activeCalendar[0]);
    }
  }, [activeCalendar, selectedCircuit]);

  useEffect(() => {
    if (!availableSessions.some((s) => s.id === selectedSession)) {
      setSelectedSession("Q");
    }
  }, [availableSessions, selectedSession]);

  useEffect(() => {
    const keys = Object.keys(currentGrid);
    if (!keys.includes(driverA)) setDriverA(keys[0] || "VER");
    if (!keys.includes(driverB)) setDriverB(keys[1] || keys[0] || "LEC");
  }, [currentGrid]);

  useEffect(() => {
    playbackRef.current.isPlaying = isPlaying;
    playbackRef.current.speed = playbackSpeed;
    playbackRef.current.cameraMode = cameraMode;
  }, [isPlaying, playbackSpeed, cameraMode]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, loading, isAgentOpen]);

  useEffect(() => {
    const updateVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
        const defaultVoice = voices.find(
          (v) => v.lang.includes("en-GB") || v.name.toLowerCase().includes("british")
        );
        if (defaultVoice && !selectedVoiceURI) setSelectedVoiceURI(defaultVoice.voiceURI);
      }
    };
    updateVoices();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const playRadioBeep = (freqStart = 880, freqEnd = 1760, duration = 0.12) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freqStart, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + duration * 0.7);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  };

  const speakRadioMessage = (text) => {
    if (!audioEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    playRadioBeep(880, 1760, 0.12);
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, "").slice(0, 300));
      utterance.rate = speechRate;
      utterance.pitch = speechPitch;
      if (selectedVoiceURI) {
        const v = availableVoices.find((vo) => vo.voiceURI === selectedVoiceURI);
        if (v) utterance.voice = v;
      }
      window.speechSynthesis.speak(utterance);
    }, 140);
  };

  const stopAgentSpeakingImmediately = () => {
    if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      playRadioBeep(440, 220, 0.08);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = "en-US";
      recognizer.onstart = () => {
        stopAgentSpeakingImmediately();
        setIsListening(true);
        setIsAgentOpen(true);
      };
      recognizer.onresult = (e) => {
        const transcript = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join("");
        setQuery(transcript);
      };
      recognizer.onerror = () => setIsListening(false);
      recognizer.onend = () => setIsListening(false);
      recognitionRef.current = recognizer;
    }
  }, []);

  const togglePushToTalk = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      stopAgentSpeakingImmediately();
      setIsAgentOpen(true);
      setQuery("");
      recognitionRef.current.start();
    }
  };

  // ── DYNAMIC TIME-OF-DAY LIGHTING & SKYBOX ATMOSPHERE CONTROLLER ──
  const applyTimeOfDayAtmosphere = (tod) => {
    const { scene, ambientLight, sunLight, renderer } = threeState.current;
    if (!scene || !ambientLight || !sunLight) return;

    if (tod === "NIGHT") {
      scene.background = new THREE.Color(0x050811);
      scene.fog = new THREE.FogExp2(0x050811, 0.0045);
      ambientLight.color.setHex(0x64748b);
      ambientLight.intensity = 0.55;
      sunLight.color.setHex(0x38bdf8);
      sunLight.intensity = 1.15;
      sunLight.position.set(20, 65, -30);
      if (renderer) renderer.toneMappingExposure = 1.45;
    } else if (tod === "EVENING") {
      scene.background = new THREE.Color(0x2a1b3d);
      scene.fog = new THREE.FogExp2(0x44223a, 0.0035);
      ambientLight.color.setHex(0xfdba74);
      ambientLight.intensity = 0.78;
      sunLight.color.setHex(0xf97316);
      sunLight.intensity = 2.2;
      sunLight.position.set(-75, 28, 40);
      if (renderer) renderer.toneMappingExposure = 1.3;
    } else if (tod === "MORNING") {
      scene.background = new THREE.Color(0xbae6fd);
      scene.fog = new THREE.FogExp2(0xe0f2fe, 0.0025);
      ambientLight.color.setHex(0xfef3c7);
      ambientLight.intensity = 0.92;
      sunLight.color.setHex(0xfde68a);
      sunLight.intensity = 2.1;
      sunLight.position.set(70, 50, 50);
      if (renderer) renderer.toneMappingExposure = 1.25;
    } else {
      // AFTERNOON
      scene.background = new THREE.Color(0x60a5fa);
      scene.fog = new THREE.FogExp2(0x93c5fd, 0.0022);
      ambientLight.color.setHex(0xffffff);
      ambientLight.intensity = 1.0;
      sunLight.color.setHex(0xfffbeb);
      sunLight.intensity = 2.5;
      sunLight.position.set(45, 105, 35);
      if (renderer) renderer.toneMappingExposure = 1.3;
    }
  };

  useEffect(() => {
    applyTimeOfDayAtmosphere(timeOfDay);
  }, [timeOfDay]);

  const bakePhotorealisticLivery = (driverKey) => {
    const cfg = currentGrid[driverKey] || Object.values(currentGrid)[0];
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = cfg.primary;
    ctx.fillRect(0, 0, 2048, 1024);

    ctx.fillStyle = cfg.deckColor || "#ffffff";
    ctx.beginPath();
    ctx.moveTo(1050, 180);
    ctx.lineTo(2048, 260);
    ctx.lineTo(2048, 760);
    ctx.lineTo(1200, 680);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = cfg.secondary;
    ctx.beginPath();
    ctx.moveTo(0, 410);
    ctx.bezierCurveTo(450, 310, 950, 350, 2048, 440);
    ctx.lineTo(2048, 575);
    ctx.bezierCurveTo(950, 490, 450, 460, 0, 540);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = cfg.accent || "#ffffff";
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.bezierCurveTo(450, 300, 950, 340, 2048, 430);
    ctx.stroke();

    if (cfg.hpLogo) {
      ctx.beginPath();
      ctx.arc(1620, 500, 110, 0, Math.PI * 2);
      ctx.fillStyle = "#0096d6";
      ctx.fill();
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
      ctx.font = "italic 900 125px Arial, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.fillText("hp", 1620, 545);
    }

    const sponsors = cfg.sponsors || ["FIA", "PIRELLI"];
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 72px Arial, sans-serif";
    ctx.textAlign = "center";
    sponsors.forEach((sp, i) => {
      ctx.fillText(sp, 420 + i * 440, 300);
    });

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#090d16";
    ctx.lineWidth = 14;
    ctx.font = "900 250px Impact, sans-serif";
    ctx.textAlign = "center";
    ctx.strokeText(cfg.number, 980, 790);
    ctx.fillText(cfg.number, 980, 790);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  };

  const buildPhotorealisticF1Car = (driverKey) => {
    const cfg = currentGrid[driverKey] || Object.values(currentGrid)[0];
    const carGroup = new THREE.Group();
    const liveryTex = bakePhotorealisticLivery(driverKey);

    const bodyMat = new THREE.MeshStandardMaterial({
      map: liveryTex,
      roughness: cfg.roughness ?? 0.2,
      metalness: cfg.metalness ?? 0.55
    });
    const primaryMat = new THREE.MeshStandardMaterial({
      color: cfg.primary,
      roughness: cfg.roughness ?? 0.2,
      metalness: cfg.metalness ?? 0.55
    });
    const secondaryMat = new THREE.MeshStandardMaterial({
      color: cfg.secondary,
      roughness: 0.25,
      metalness: 0.45
    });
    const carbonMat = new THREE.MeshStandardMaterial({
      color: 0x111317,
      roughness: 0.8,
      metalness: 0.25
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x15171c,
      roughness: 0.92
    });
    const tireBandMat = new THREE.MeshBasicMaterial({
      color: cfg.tireBand || "#ef4444"
    });

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1.45, 28), bodyMat);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0.19, 1.6);
    carGroup.add(nose);

    const fwMain = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.035, 0.44), carbonMat);
    fwMain.position.set(0, 0.085, 1.92);
    carGroup.add(fwMain);

    const fwFlap = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.028, 0.22), secondaryMat);
    fwFlap.rotation.x = -0.18;
    fwFlap.position.set(0, 0.125, 1.82);
    carGroup.add(fwFlap);

    [-0.91, 0.91].forEach((xPos) => {
      const fwEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.52), primaryMat);
      fwEndplate.position.set(xPos, 0.16, 1.9);
      carGroup.add(fwEndplate);
    });

    const tub = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.35, 2.35), bodyMat);
    tub.position.set(0, 0.23, 0.05);
    carGroup.add(tub);

    [-0.46, 0.46].forEach((xPos) => {
      const sidepod = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.29, 1.65), bodyMat);
      sidepod.position.set(xPos, 0.2, -0.12);
      carGroup.add(sidepod);

      const inlet = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.12), carbonMat);
      inlet.position.set(xPos, 0.24, 0.72);
      carGroup.add(inlet);
    });

    const engineCover = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.55, 20), bodyMat);
    engineCover.rotation.x = -Math.PI / 2;
    engineCover.position.set(0, 0.42, -0.62);
    carGroup.add(engineCover);

    const sharkFin = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.95), secondaryMat);
    sharkFin.position.set(0, 0.54, -0.78);
    carGroup.add(sharkFin);

    const tCam = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.04, 0.07),
      new THREE.MeshBasicMaterial({ color: cfg.tireBand === "#fde047" ? 0xfacc15 : 0x111111 })
    );
    tCam.position.set(0, 0.72, -0.12);
    carGroup.add(tCam);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.035, 2.65), carbonMat);
    floor.position.set(0, 0.055, -0.05);
    carGroup.add(floor);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.27, 0.036, 12, 28, Math.PI),
      carbonMat
    );
    halo.rotation.x = -Math.PI / 2.3;
    halo.position.set(0, 0.45, 0.36);
    carGroup.add(halo);

    const haloPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 12), carbonMat);
    haloPillar.rotation.x = 0.35;
    haloPillar.position.set(0, 0.41, 0.58);
    carGroup.add(haloPillar);

    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 24, 24),
      new THREE.MeshStandardMaterial({ color: cfg.secondary, metalness: 0.65, roughness: 0.18 })
    );
    helmet.position.set(0, 0.42, 0.22);
    carGroup.add(helmet);

    const visor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.138, 0.138, 0.07, 20, 1, false, -0.8, 1.6),
      new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.95, roughness: 0.05 })
    );
    visor.position.set(0, 0.43, 0.23);
    carGroup.add(visor);

    const rwMain = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.05, 0.32), carbonMat);
    rwMain.position.set(0, 0.56, -1.36);
    carGroup.add(rwMain);

    const rwFlap = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.22, 0.06), bodyMat);
    rwFlap.rotation.x = 0.25;
    rwFlap.position.set(0, 0.69, -1.44);
    carGroup.add(rwFlap);

    [-0.64, 0.64].forEach((xPos) => {
      const rwEndplate = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.52, 0.44), primaryMat);
      rwEndplate.position.set(xPos, 0.52, -1.36);
      carGroup.add(rwEndplate);
    });

    const rainLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.12, 0.05),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    rainLight.position.set(0, 0.22, -1.46);
    carGroup.add(rainLight);

    [
      { x: 0.84, z: 1.28, r: 0.33, w: 0.36 },
      { x: -0.84, z: 1.28, r: 0.33, w: 0.36 },
      { x: 0.88, z: -1.08, r: 0.35, w: 0.44 },
      { x: -0.88, z: -1.08, r: 0.35, w: 0.44 }
    ].forEach((pos) => {
      const upperArm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, Math.abs(pos.x), 8), carbonMat);
      upperArm.rotation.z = Math.PI / 2;
      upperArm.position.set(pos.x * 0.5, 0.29, pos.z);
      carGroup.add(upperArm);

      const lowerArm = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, Math.abs(pos.x), 8), carbonMat);
      lowerArm.rotation.z = Math.PI / 2;
      lowerArm.position.set(pos.x * 0.5, 0.16, pos.z);
      carGroup.add(lowerArm);

      const wheel = new THREE.Group();
      const tireMesh = new THREE.Mesh(new THREE.CylinderGeometry(pos.r, pos.r, pos.w, 32), tireMat);
      tireMesh.rotation.z = Math.PI / 2;
      wheel.add(tireMesh);

      const sidewallRing = new THREE.Mesh(
        new THREE.TorusGeometry(pos.r * 0.76, 0.018, 12, 32),
        tireBandMat
      );
      sidewallRing.rotation.y = Math.PI / 2;
      sidewallRing.position.x = pos.x > 0 ? pos.w / 2 + 0.005 : -pos.w / 2 - 0.005;
      wheel.add(sidewallRing);

      const rim = new THREE.Mesh(
        new THREE.CylinderGeometry(pos.r * 0.58, pos.r * 0.58, pos.w + 0.012, 24),
        cfg.chromeWheels
          ? new THREE.MeshStandardMaterial({ color: 0x00f0ff, metalness: 0.9, roughness: 0.15 })
          : carbonMat
      );
      rim.rotation.z = Math.PI / 2;
      wheel.add(rim);

      const nut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.05, pos.w + 0.03, 12),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      nut.rotation.z = Math.PI / 2;
      wheel.add(nut);

      wheel.position.set(pos.x, 0.25, pos.z);
      carGroup.add(wheel);
    });

    return carGroup;
  };

  // ── 3D ARCHITECTURAL LANDMARK BUILDER FOR ALL 24 CIRCUITS ──
  const buildCircuitLandmark3D = (circuitName, curve) => {
    const attr = CIRCUIT_ATTRACTIONS[circuitName] || CIRCUIT_ATTRACTIONS["Silverstone"];
    const landmarkGroup = new THREE.Group();
    landmarkGroup.userData = { isAttraction: true, attractionData: attr };

    const pt = curve.getPointAt(attr.tPos || 0.35);
    const tan = curve.getTangentAt(attr.tPos || 0.35).normalize();
    const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
    const anchorPos = pt.clone().add(norm.clone().multiplyScalar(attr.offsetDist || 0));

    const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.75, roughness: 0.2 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1, emissive: 0x0284c7, emissiveIntensity: 0.35 });
    const neonRedMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
    const neonCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.65 });

    switch (attr.type) {
      case "VEGAS_SPHERE": {
        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(5.2, 36, 36),
          new THREE.MeshStandardMaterial({
            color: 0xff0055,
            emissive: 0xec4899,
            emissiveIntensity: 0.85,
            roughness: 0.15,
            metalness: 0.5
          })
        );
        sphere.position.y = 4.6;
        landmarkGroup.add(sphere);
        for (let r = 0; r < 3; r++) {
          const ring = new THREE.Mesh(new THREE.TorusGeometry(5.28, 0.09, 12, 48), neonCyanMat);
          ring.rotation.x = Math.PI / 2 + (r - 1) * 0.35;
          ring.position.y = 4.6;
          landmarkGroup.add(ring);
        }
        break;
      }
      case "SINGAPORE_MBS_FLYER": {
        // 3 Marina Bay Sands Towers + Skypark Boat + Singapore Flyer Wheel
        [-3.6, 0, 3.6].forEach((tx) => {
          const tower = new THREE.Mesh(new THREE.BoxGeometry(1.6, 9.5, 1.4), glassMat);
          tower.position.set(tx, 4.75, -2.2);
          landmarkGroup.add(tower);
        });
        const skypark = new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.65, 2.2), goldMat);
        skypark.position.set(0, 9.8, -2.2);
        landmarkGroup.add(skypark);

        const flyerRim = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.16, 16, 48), neonCyanMat);
        flyerRim.position.set(6.5, 5.2, 2.5);
        landmarkGroup.add(flyerRim);
        break;
      }
      case "MONACO_CASINO_HARBOR": {
        // Casino de Monte-Carlo domes + Superyachts in Port Hercules
        const casinoMain = new THREE.Mesh(new THREE.BoxGeometry(7.5, 3.8, 4.2), stoneMat);
        casinoMain.position.set(0, 1.9, 0);
        landmarkGroup.add(casinoMain);
        [-2.2, 2.2].forEach((dx) => {
          const dome = new THREE.Mesh(new THREE.SphereGeometry(1.35, 20, 20), goldMat);
          dome.position.set(dx, 4.2, 0);
          landmarkGroup.add(dome);
        });
        // Harbor Superyachts
        [-3.5, 0, 3.5].forEach((yx, idx) => {
          const hull = new THREE.Mesh(new THREE.ConeGeometry(0.65, 3.2, 4), new THREE.MeshStandardMaterial({ color: 0xffffff }));
          hull.rotation.x = Math.PI / 2;
          hull.position.set(yx, 0.35, 4.8 + (idx % 2) * 1.4);
          landmarkGroup.add(hull);
        });
        break;
      }
      case "AUSTIN_COTA_TOWER": {
        const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.75, 13.5, 16), stoneMat);
        shaft.position.set(0, 6.75, 0);
        landmarkGroup.add(shaft);
        const obsDeck = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.2, 1.1, 24), glassMat);
        obsDeck.position.set(0, 12.2, 0);
        landmarkGroup.add(obsDeck);
        for (let i = -3; i <= 3; i++) {
          const veil = new THREE.Mesh(new THREE.BoxGeometry(0.12, 11.5, 3.8), neonRedMat);
          veil.position.set(i * 0.38, 6.2, -1.6);
          veil.rotation.x = 0.22;
          landmarkGroup.add(veil);
        }
        break;
      }
      case "MIAMI_STADIUM": {
        const bowl = new THREE.Mesh(new THREE.CylinderGeometry(6.4, 5.2, 3.6, 32, 1, true), stoneMat);
        bowl.position.set(0, 1.8, 0);
        landmarkGroup.add(bowl);
        const canopy = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.35, 11.5), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
        canopy.position.set(0, 3.8, 0);
        landmarkGroup.add(canopy);
        [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]].forEach(([sx, sz]) => {
          const spire = new THREE.Mesh(new THREE.ConeGeometry(0.35, 6.8, 12), new THREE.MeshBasicMaterial({ color: 0x06b6d4 }));
          spire.position.set(sx, 3.4, sz);
          landmarkGroup.add(spire);
        });
        break;
      }
      case "BAKU_FLAME_CASTLE": {
        // 3 Flame Towers + Icherisheher Medieval Battlement Walls
        [-2.4, 0, 2.4].forEach((fx, i) => {
          const flame = new THREE.Mesh(new THREE.ConeGeometry(1.25, 9.2 + i * 1.1, 16), glassMat);
          flame.position.set(fx, 4.6, -2.0);
          flame.rotation.z = (i - 1) * 0.08;
          landmarkGroup.add(flame);
        });
        const wall = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.6, 1.1), stoneMat);
        wall.position.set(0, 1.3, 2.6);
        landmarkGroup.add(wall);
        break;
      }
      case "ABU_DHABI_WHOTEL": {
        // W Abu Dhabi Hotel LED Grid-Shell Canopy + Dual Resort Wings over Track
        const ledCanopy = new THREE.Mesh(
          new THREE.TorusGeometry(6.2, 1.45, 20, 48, Math.PI),
          new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x0284c7,
            emissiveIntensity: 0.75,
            metalness: 0.85,
            roughness: 0.15,
            wireframe: false
          })
        );
        ledCanopy.position.set(0, 0.2, 0);
        landmarkGroup.add(ledCanopy);

        const wireframeShell = new THREE.Mesh(
          new THREE.TorusGeometry(6.28, 1.48, 14, 36, Math.PI),
          neonCyanMat
        );
        wireframeShell.material.wireframe = true;
        wireframeShell.position.set(0, 0.2, 0);
        landmarkGroup.add(wireframeShell);

        [-4.8, 4.8].forEach((hx) => {
          const hotelWing = new THREE.Mesh(
            new THREE.CylinderGeometry(1.8, 2.1, 4.2, 24),
            glassMat
          );
          hotelWing.position.set(hx, 2.1, 0);
          landmarkGroup.add(hotelWing);
        });

        const skyBridge = new THREE.Mesh(
          new THREE.BoxGeometry(10.6, 0.95, 2.8),
          glassMat
        );
        skyBridge.position.set(0, 4.4, 0);
        landmarkGroup.add(skyBridge);
        break;
      }
      case "SILVERSTONE_BRIDGE": {
        // Silverstone Museum Curved Hangar + Hilton Garden Inn Viewing Bridge
        [-5.2, 5.2].forEach((px) => {
          const hotelBlock = new THREE.Mesh(
            new THREE.BoxGeometry(2.6, 5.2, 3.8),
            stoneMat
          );
          hotelBlock.position.set(px, 2.6, 0);
          landmarkGroup.add(hotelBlock);
        });

        const viewingBridge = new THREE.Mesh(
          new THREE.BoxGeometry(11.4, 1.15, 2.4),
          glassMat
        );
        viewingBridge.position.set(0, 4.5, 0);
        landmarkGroup.add(viewingBridge);

        const roofTrim = new THREE.Mesh(
          new THREE.BoxGeometry(11.6, 0.22, 2.6),
          neonRedMat
        );
        roofTrim.position.set(0, 5.15, 0);
        landmarkGroup.add(roofTrim);

        // Silverstone Interactive Museum Wave Roof beside the bridge
        const museumHall = new THREE.Mesh(
          new THREE.CylinderGeometry(2.8, 2.8, 6.4, 24, 1, false, 0, Math.PI),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.25 })
        );
        museumHall.rotation.z = Math.PI / 2;
        museumHall.position.set(-7.5, 0.2, -4.2);
        landmarkGroup.add(museumHall);
        break;
      }
      case "CHINA_WINGS": {
        // Shanghai International Circuit Twin Elevated Grand Wing Pavilions
        [-4.6, 4.6].forEach((tx) => {
          const mainPillar = new THREE.Mesh(
            new THREE.CylinderGeometry(0.65, 0.85, 6.8, 16),
            stoneMat
          );
          mainPillar.position.set(tx, 3.4, 0);
          landmarkGroup.add(mainPillar);
        });

        // Twin Floating Wing Decks spanning across the Main Straight
        [-1.4, 1.4].forEach((wz, idx) => {
          const wingPod = new THREE.Mesh(
            new THREE.BoxGeometry(12.4, 0.85, 1.8),
            idx === 0 ? glassMat : goldMat
          );
          wingPod.position.set(0, 5.6 + idx * 0.6, wz);
          landmarkGroup.add(wingPod);
        });

        // Sweeping Aero Wing Tips on Left & Right
        [-6.4, 6.4].forEach((wx, i) => {
          const wingTip = new THREE.Mesh(
            new THREE.ConeGeometry(1.6, 4.8, 4),
            neonRedMat
          );
          wingTip.rotation.z = i === 0 ? Math.PI / 3 : -Math.PI / 3;
          wingTip.position.set(wx, 6.8, 0);
          landmarkGroup.add(wingTip);
        });
        break;
      }
      case "SUZUKA_WHEEL": {
        const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(5.0, 0.22, 16, 48), neonRedMat);
        wheelRim.position.set(0, 5.8, 0);
        landmarkGroup.add(wheelRim);
        const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 6.5, 12), stoneMat);
        leg1.position.set(-1.5, 3.0, 0);
        leg1.rotation.z = -0.22;
        landmarkGroup.add(leg1);
        const leg2 = leg1.clone();
        leg2.position.set(1.5, 3.0, 0);
        leg2.rotation.z = 0.22;
        landmarkGroup.add(leg2);
        break;
      }
      case "AUSTRIA_BULL": {
        const steelArch = new THREE.Mesh(new THREE.BoxGeometry(0.9, 8.2, 4.8), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 }));
        steelArch.position.set(0, 4.1, 0);
        landmarkGroup.add(steelArch);
        const bullBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.5, 1.1), goldMat);
        bullBody.position.set(0, 6.2, 0);
        landmarkGroup.add(bullBody);
        break;
      }
      case "CANADA_BIOSPHERE": {
        const geodesic = new THREE.Mesh(
          new THREE.IcosahedronGeometry(4.8, 2),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true })
        );
        geodesic.position.set(0, 4.6, 0);
        landmarkGroup.add(geodesic);
        break;
      }
      case "BAHRAIN_TOWER": {
        const vipCyl = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 10.5, 28), glassMat);
        vipCyl.position.set(0, 5.25, 0);
        landmarkGroup.add(vipCyl);
        for (let b = 1; b <= 4; b++) {
          const band = new THREE.Mesh(new THREE.TorusGeometry(2.35, 0.1, 12, 32), neonRedMat);
          band.rotation.x = Math.PI / 2;
          band.position.y = b * 2.3;
          landmarkGroup.add(band);
        }
        break;
      }
      case "MEXICO_FORO_SOL": {
        const leftGrandstand = new THREE.Mesh(new THREE.CylinderGeometry(6.8, 5.0, 3.4, 24, 1, true, 0, Math.PI), stoneMat);
        leftGrandstand.position.set(0, 1.7, 0);
        landmarkGroup.add(leftGrandstand);
        break;
      }
      default: {
        // Monumental Pavilion / Palace / Skyline Landmark
        const centerTower = new THREE.Mesh(new THREE.BoxGeometry(5.8, 5.4, 3.8), glassMat);
        centerTower.position.set(0, 2.7, 0);
        landmarkGroup.add(centerTower);
        const crown = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.6, 4), goldMat);
        crown.position.set(0, 6.7, 0);
        crown.rotation.y = Math.PI / 4;
        landmarkGroup.add(crown);
        break;
      }
    }

    // Floating holographic beacon pin above the attraction so it is immediately spotlit on track
    const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 12, 32), neonCyanMat);
    beaconRing.rotation.x = Math.PI / 2;
    beaconRing.position.y = 11.2;
    landmarkGroup.add(beaconRing);

    // Propagate userData to all child meshes for Raycaster hover detection
    landmarkGroup.traverse((child) => {
      child.userData = { isAttraction: true, attractionData: attr };
    });

    landmarkGroup.position.set(anchorPos.x, 0.0, anchorPos.z);
    landmarkGroup.lookAt(pt.x, 0.0, pt.z);
    return landmarkGroup;
  };

// ── GOOGLE EARTH SATELLITE ORTHOPHOTO & ASPHALT PBR TEXTURE GENERATORS ──
  const buildSatelliteEarthTexture = (circuitName, isNight) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");

    const isDesert = ["Bahrain", "Saudi Arabia", "Qatar", "Abu Dhabi", "Las Vegas"].includes(circuitName);
    const isStreet = ["Monaco", "Singapore", "Azerbaijan", "Las Vegas", "Miami", "Australia", "Canada", "Saudi Arabia"].includes(circuitName);

    // 1. Base Satellite Orthophoto Biome Layer
    const grad = ctx.createRadialGradient(512, 512, 60, 512, 512, 720);
    if (isNight) {
      grad.addColorStop(0, "#0b101b");
      grad.addColorStop(0.55, "#070b12");
      grad.addColorStop(1, "#030508");
    } else if (isDesert) {
      grad.addColorStop(0, "#bfa07a");
      grad.addColorStop(0.5, "#a6845e");
      grad.addColorStop(1, "#7d5f3e");
    } else {
      grad.addColorStop(0, "#2d3b28");
      grad.addColorStop(0.55, "#23301e");
      grad.addColorStop(1, "#162013");
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // 2. Photogrammetry Topographical Contour & Soil Grain
    for (let i = 0; i < 4500; i++) {
      const x = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1 * 1024;
      const y = (Math.cos(i * 78.233) * 23421.631 % 1 + 1) % 1 * 1024;
      const r = 1 + (i % 4);
      ctx.fillStyle = isNight
        ? i % 9 === 0 ? "rgba(251, 191, 36, 0.22)" : "rgba(30, 41, 59, 0.25)"
        : isDesert
        ? "rgba(120, 85, 50, 0.14)"
        : "rgba(18, 32, 14, 0.18)";
      ctx.fillRect(x, y, r, r);
    }

    // 3. Google Earth 3D Urban City Grid, Arterial Roads & Satellite Blocks
    ctx.strokeStyle = isNight
      ? "rgba(245, 158, 11, 0.22)"
      : isDesert
      ? "rgba(214, 190, 160, 0.26)"
      : "rgba(148, 163, 184, 0.18)";
    ctx.lineWidth = isStreet ? 2.5 : 1.5;

    for (let gx = 40; gx < 1024; gx += 64) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + (gx % 128 === 0 ? 18 : -12), 1024);
      ctx.stroke();
    }
    for (let gy = 40; gy < 1024; gy += 64) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(1024, gy + (gy % 128 === 0 ? -16 : 14));
      ctx.stroke();
    }

    // 4. Satellite Rooftops / Paddock Compounds / Night Streetlight Clusters
    for (let b = 0; b < 220; b++) {
      const bx = ((b * 97) % 940) + 40;
      const by = ((b * 173) % 940) + 40;
      const distCenter = Math.hypot(bx - 512, by - 512);
      if (distCenter > 170) {
        const bw = 8 + (b % 14);
        const bh = 8 + ((b * 3) % 16);
        ctx.fillStyle = isNight
          ? b % 3 === 0 ? "rgba(56, 189, 248, 0.35)" : "rgba(251, 191, 36, 0.38)"
          : "rgba(203, 213, 225, 0.28)";
        ctx.fillRect(bx, by, bw, bh);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  };

  const buildWeatheredAsphaltTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#1c1f26";
    ctx.fillRect(0, 0, 512, 512);

    // Aggregate bitumen stone grain
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = 22 + Math.floor(Math.random() * 26);
      ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Dark rubberized racing groove in center of track
    const groove = ctx.createLinearGradient(0, 0, 512, 0);
    groove.addColorStop(0, "rgba(255,255,255,0.06)");
    groove.addColorStop(0.25, "rgba(10,12,16,0.1)");
    groove.addColorStop(0.5, "rgba(5,6,8,0.55)");
    groove.addColorStop(0.75, "rgba(10,12,16,0.1)");
    groove.addColorStop(1, "rgba(255,255,255,0.06)");
    ctx.fillStyle = groove;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  };

  // ── GOOGLE EARTH 3D PHOTOGRAMMETRY ENVIRONMENT & SURROUNDING CITYSCAPE BUILDER ──
  const buildDetailedEnvironment = (curve, circuitName, isNight) => {
    const group = new THREE.Group();
    const satTexture = buildSatelliteEarthTexture(circuitName, isNight);

    // 1. Sculpted Digital Elevation Model (DEM) Photogrammetry Terrain
    const terrainGeom = new THREE.PlaneGeometry(620, 620, 96, 96);
    const pos = terrainGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const dist = Math.sqrt(vx * vx + vy * vy);
      if (dist > 38) {
        const factor = Math.min(1, (dist - 38) / 36);
        const ridge =
          Math.sin(vx * 0.032) * Math.cos(vy * 0.032) * 5.2 +
          Math.sin(vx * 0.08 + vy * 0.06) * 1.6;
        pos.setZ(i, Math.max(-0.2, ridge * factor));
      } else {
        pos.setZ(i, 0);
      }
    }
    terrainGeom.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      map: satTexture,
      roughness: 0.86,
      metalness: 0.08
    });
    const terrain = new THREE.Mesh(terrainGeom, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -0.32;
    group.add(terrain);

    // 2. Photorealistic Specular Water Basin / Harbor / Coastal Bay
    const waterGeom = new THREE.CircleGeometry(8.5, 48);
    const waterMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x082f49 : 0x0369a1,
      roughness: 0.06,
      metalness: 0.78,
      emissive: isNight ? 0x0c4a6e : 0x000000,
      emissiveIntensity: 0.25
    });
    const lake = new THREE.Mesh(waterGeom, waterMat);
    lake.rotation.x = -Math.PI / 2;
    lake.position.set(-4.5, -0.22, 5.2);
    group.add(lake);

    if (curve) {
      // 3. Circuit's Real-World 3D Landmark Attraction
      const attractionGroup = buildCircuitLandmark3D(circuitName, curve);
      group.add(attractionGroup);
      threeState.current.attractionMesh = attractionGroup;

      // 4. FIA Paddock Club, Pit Garages & Media Broadcast Complex along Main Straight
      const pitPt = curve.getPointAt(0.02);
      const pitTan = curve.getTangentAt(0.02).normalize();
      const pitNorm = new THREE.Vector3(-pitTan.z, 0, pitTan.x).normalize();
      const pitBuildingPos = pitPt.clone().add(pitNorm.clone().multiplyScalar(-4.6));

      const paddockBuilding = new THREE.Group();
      const garageBase = new THREE.Mesh(
        new THREE.BoxGeometry(11.5, 1.8, 2.6),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35, metalness: 0.6 })
      );
      garageBase.position.set(0, 0.9, 0);
      paddockBuilding.add(garageBase);

      const hospitalityGlass = new THREE.Mesh(
        new THREE.BoxGeometry(11.8, 1.3, 2.9),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.1,
          metalness: 0.9,
          emissive: isNight ? 0x0284c7 : 0x000000,
          emissiveIntensity: isNight ? 0.55 : 0.1
        })
      );
      hospitalityGlass.position.set(0, 2.45, 0);
      paddockBuilding.add(hospitalityGlass);

      const roofDeck = new THREE.Mesh(
        new THREE.BoxGeometry(12.2, 0.24, 3.3),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 })
      );
      roofDeck.position.set(0, 3.2, 0);
      paddockBuilding.add(roofDeck);

      paddockBuilding.position.set(pitBuildingPos.x, 0, pitBuildingPos.z);
      paddockBuilding.lookAt(pitPt.x, 0, pitPt.z);
      group.add(paddockBuilding);

      // 5. Architectural Multi-Tier Grandstands
      const standConfigs = [
        { t: 0.05, bannerColor: 0xdc2626 },
        { t: 0.22, bannerColor: 0xff8000 },
        { t: 0.44, bannerColor: 0x00a19c },
        { t: 0.66, bannerColor: 0x004fd4 },
        { t: 0.86, bannerColor: 0xeab308 }
      ];

      standConfigs.forEach(({ t, bannerColor }) => {
        const pt = curve.getPointAt(t);
        const outDir = new THREE.Vector3(pt.x, 0, pt.z).normalize();
        const standPos = pt.clone().add(outDir.multiplyScalar(7.8));

        const standGroup = new THREE.Group();
        const base = new THREE.Mesh(
          new THREE.BoxGeometry(10.5, 1.2, 4.4),
          new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.7 })
        );
        base.position.set(0, 0.6, 0);
        standGroup.add(base);

        const tierColors = [0x334155, 0x475569, 0x1e293b, 0x64748b];
        for (let tier = 0; tier < 4; tier++) {
          const stepMesh = new THREE.Mesh(
            new THREE.BoxGeometry(10.2, 0.45, 0.85),
            new THREE.MeshStandardMaterial({ color: tierColors[tier], roughness: 0.55 })
          );
          stepMesh.position.set(0, 1.35 + tier * 0.45, 1.3 - tier * 0.85);
          standGroup.add(stepMesh);
        }

        const canopy = new THREE.Mesh(
          new THREE.BoxGeometry(11.2, 0.18, 5.2),
          new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.6 })
        );
        canopy.rotation.x = 0.08;
        canopy.position.set(0, 3.95, -0.1);
        standGroup.add(canopy);

        const banner = new THREE.Mesh(
          new THREE.BoxGeometry(11.2, 0.32, 0.12),
          new THREE.MeshBasicMaterial({ color: bannerColor })
        );
        banner.position.set(0, 3.75, 2.45);
        standGroup.add(banner);

        standGroup.position.set(standPos.x, 0.0, standPos.z);
        standGroup.lookAt(pt.x, 0.0, pt.z);
        group.add(standGroup);
      });

      // 6. Trackside Floodlight Pylons
      for (let i = 0; i < 16; i++) {
        const t = i / 16;
        const pt = curve.getPointAt(t);
        const tan = curve.getTangentAt(t).normalize();
        const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
        const lightPos = pt.clone().add(norm.multiplyScalar(i % 2 === 0 ? 3.3 : -3.3));

        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.05, 0.09, 4.8, 8),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85 })
        );
        pole.position.set(lightPos.x, 2.4, lightPos.z);
        group.add(pole);

        const fixture = new THREE.Mesh(
          new THREE.BoxGeometry(0.75, 0.2, 0.35),
          new THREE.MeshBasicMaterial({ color: isNight ? 0xfffbeb : 0xcbd5e1 })
        );
        fixture.position.set(lightPos.x, 4.85, lightPos.z);
        fixture.lookAt(pt.x, 0.5, pt.z);
        group.add(fixture);
      }
    }

    // 7. Google Earth 3D Photogrammetry Context Buildings & Urban Skyline Blocks
    const buildingMatDark = new THREE.MeshStandardMaterial({
      color: isNight ? 0x111827 : 0x64748b,
      roughness: 0.4,
      metalness: 0.55,
      emissive: isNight ? 0x1e293b : 0x000000,
      emissiveIntensity: isNight ? 0.45 : 0
    });
    const buildingMatGlass = new THREE.MeshStandardMaterial({
      color: isNight ? 0x1e3a8a : 0x94a3b8,
      roughness: 0.2,
      metalness: 0.8,
      emissive: isNight ? 0x38bdf8 : 0x000000,
      emissiveIntensity: isNight ? 0.3 : 0
    });

    for (let i = 0; i < 75; i++) {
      const angle = (i / 75) * Math.PI * 2 + (i % 3) * 0.04;
      const rad = 38 + (i % 7) * 6.5;
      const bx = Math.cos(angle) * rad;
      const bz = Math.sin(angle) * rad;
      const bw = 2.2 + (i % 4) * 1.1;
      const bd = 2.2 + ((i * 2) % 4) * 1.1;
      const bh = 2.5 + ((i * 7) % 14) * 0.95;

      const bMesh = new THREE.Mesh(
        new THREE.BoxGeometry(bw, bh, bd),
        i % 3 === 0 ? buildingMatGlass : buildingMatDark
      );
      bMesh.position.set(bx, bh / 2 - 0.2, bz);
      bMesh.rotation.y = angle;
      group.add(bMesh);
    }

    // 8. Natural Biome Vegetation Clusters
    const treeCount = 85;
    for (let i = 0; i < treeCount; i++) {
      const angle = (i / treeCount) * Math.PI * 2;
      const rad = 34 + (i % 5) * 4.8;
      const tx = Math.cos(angle) * rad;
      const tz = Math.sin(angle) * rad;

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8),
        new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 })
      );
      trunk.position.set(tx, 0.5, tz);
      group.add(trunk);

      const canopy = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.45, 1),
        new THREE.MeshStandardMaterial({ color: 0x2e4c21, roughness: 0.88 })
      );
      canopy.position.set(tx, 2.0, tz);
      group.add(canopy);
    }

    threeState.current.balloons = [];
    return group;
  };

  // ── REALISTIC WEATHERED ASPHALT, RUNOFF APRONS, BARRIERS & STARTING GANTRY ──
  const buildRealisticTrack = (rawPoints, dominanceMap = null) => {
    const { scene, trackGroup, environmentGroup, carA, carB } = threeState.current;
    if (!scene || !rawPoints || rawPoints.length < 4) return;

    if (trackGroup) scene.remove(trackGroup);
    if (environmentGroup) scene.remove(environmentGroup);

    const newTrackGroup = new THREE.Group();
    threeState.current.rawPoints = rawPoints;

    const vectorPoints = rawPoints.map((p) => new THREE.Vector3(p.x, 0, p.z));
    const curve = new THREE.CatmullRomCurve3(vectorPoints, true, "centripetal", 0.5);
    threeState.current.curve = curve;

    const asphaltTex = buildWeatheredAsphaltTexture();
    const segmentsCount = 220;
    const trackWidth = 1.48;
    const runoffWidth = 1.15;
    const kerbWidth = 0.26;
    const runoffY = 0.06;
    const trackY = 0.12;
    const kerbY = 0.145;

    const colorS1 = new THREE.Color(0xe10600);
    const colorS2 = new THREE.Color(0x00f0ff);
    const darkAsphalt = new THREE.Color(0xffffff);

    for (let i = 0; i < segmentsCount; i++) {
      const t1 = i / segmentsCount;
      const t2 = (i + 1) / segmentsCount;
      const p1 = curve.getPointAt(t1);
      const p2 = curve.getPointAt(t2);
      const tan1 = curve.getTangentAt(t1).normalize();
      const tan2 = curve.getTangentAt(t2).normalize();
      const norm1 = new THREE.Vector3(-tan1.z, 0, tan1.x).normalize();
      const norm2 = new THREE.Vector3(-tan2.z, 0, tan2.x).normalize();

      // 1. Paved FIA Runoff Apron & Gravel Perimeter
      const rL1 = p1.clone().add(norm1.clone().multiplyScalar(trackWidth + runoffWidth));
      const rR1 = p1.clone().add(norm1.clone().multiplyScalar(-(trackWidth + runoffWidth)));
      const rL2 = p2.clone().add(norm2.clone().multiplyScalar(trackWidth + runoffWidth));
      const rR2 = p2.clone().add(norm2.clone().multiplyScalar(-(trackWidth + runoffWidth)));

      const runoffGeom = new THREE.BufferGeometry();
      runoffGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            rL1.x, runoffY, rL1.z, rR1.x, runoffY, rR1.z, rL2.x, runoffY, rL2.z,
            rR1.x, runoffY, rR1.z, rR2.x, runoffY, rR2.z, rL2.x, runoffY, rL2.z
          ]),
          3
        )
      );
      runoffGeom.computeVertexNormals();
      newTrackGroup.add(
        new THREE.Mesh(
          runoffGeom,
          new THREE.MeshStandardMaterial({
            color: i % 8 < 4 ? 0x334155 : 0x1e293b,
            roughness: 0.88,
            side: THREE.DoubleSide
          })
        )
      );

      // 2. Main PBR Weathered Asphalt Ribbon with UVs
      const vL1 = p1.clone().add(norm1.clone().multiplyScalar(trackWidth));
      const vR1 = p1.clone().add(norm1.clone().multiplyScalar(-trackWidth));
      const vL2 = p2.clone().add(norm2.clone().multiplyScalar(trackWidth));
      const vR2 = p2.clone().add(norm2.clone().multiplyScalar(-trackWidth));

      const asphaltGeom = new THREE.BufferGeometry();
      asphaltGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            vL1.x, trackY, vL1.z, vR1.x, trackY, vR1.z, vL2.x, trackY, vL2.z,
            vR1.x, trackY, vR1.z, vR2.x, trackY, vR2.z, vL2.x, trackY, vL2.z
          ]),
          3
        )
      );
      asphaltGeom.setAttribute(
        "uv",
        new THREE.BufferAttribute(
          new Float32Array([0, 0, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1]),
          2
        )
      );
      asphaltGeom.computeVertexNormals();

      let surfaceColor = darkAsphalt;
      if (dominanceMap && dominanceMap.length > 0) {
        const domIdx = Math.floor(t1 * (dominanceMap.length - 1));
        surfaceColor = dominanceMap[domIdx] === "A" ? colorS1 : colorS2;
      }
      const asphaltMat = new THREE.MeshStandardMaterial({
        map: asphaltTex,
        color: surfaceColor,
        roughness: 0.62,
        metalness: 0.12,
        side: THREE.DoubleSide
      });
      newTrackGroup.add(new THREE.Mesh(asphaltGeom, asphaltMat));

      // 3. White Track Boundary Lines & Red/White FIA Serrated Kerbs
      const isRed = i % 2 === 0;
      const kerbMat = new THREE.MeshStandardMaterial({
        color: isRed ? 0xb91c1c : 0xe2e8f0,
        roughness: 0.5,
        side: THREE.DoubleSide
      });

      const kL1 = vL1.clone().add(norm1.clone().multiplyScalar(kerbWidth));
      const kL2 = vL2.clone().add(norm2.clone().multiplyScalar(kerbWidth));
      const leftKerbGeom = new THREE.BufferGeometry();
      leftKerbGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            vL1.x, kerbY, vL1.z, kL1.x, kerbY, kL1.z, vL2.x, kerbY, vL2.z,
            kL1.x, kerbY, kL1.z, kL2.x, kerbY, kL2.z, vL2.x, kerbY, vL2.z
          ]),
          3
        )
      );
      leftKerbGeom.computeVertexNormals();
      newTrackGroup.add(new THREE.Mesh(leftKerbGeom, kerbMat));

      const kR1 = vR1.clone().add(norm1.clone().multiplyScalar(-kerbWidth));
      const kR2 = vR2.clone().add(norm2.clone().multiplyScalar(-kerbWidth));
      const rightKerbGeom = new THREE.BufferGeometry();
      rightKerbGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(
          new Float32Array([
            kR1.x, kerbY, kR1.z, vR1.x, kerbY, vR1.z, kR2.x, kerbY, kR2.z,
            vR1.x, kerbY, vR1.z, vR2.x, kerbY, vR2.z, kR2.x, kerbY, kR2.z
          ]),
          3
        )
      );
      rightKerbGeom.computeVertexNormals();
      newTrackGroup.add(new THREE.Mesh(rightKerbGeom, kerbMat));
    }

    // 4. Staggered Formation Grid Boxes & Overhead FIA Starting Gantry
    const startPt = curve.getPointAt(0);
    const startTan = curve.getTangentAt(0).normalize();

    for (let g = 0; g < 8; g++) {
      const gridT = (1.0 - (g + 1) * 0.008) % 1.0;
      const gp = curve.getPointAt(gridT);
      const gTan = curve.getTangentAt(gridT).normalize();
      const gNorm = new THREE.Vector3(-gTan.z, 0, gTan.x).normalize();
      const sideOffset = g % 2 === 0 ? 0.55 : -0.55;
      const boxPos = gp.clone().add(gNorm.multiplyScalar(sideOffset));

      const gridBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.02, 1.35),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      gridBox.position.set(boxPos.x, trackY + 0.025, boxPos.z);
      gridBox.lookAt(boxPos.x + gTan.x, trackY + 0.025, boxPos.z + gTan.z);
      newTrackGroup.add(gridBox);
    }

    const gantry = new THREE.Group();
    const pillarL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.16, 3.4, 12),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
    );
    pillarL.position.set(-2.1, 1.7, 0);
    gantry.add(pillarL);

    const pillarR = pillarL.clone();
    pillarR.position.set(2.1, 1.7, 0);
    gantry.add(pillarR);

    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.55, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 })
    );
    crossbar.position.set(0, 3.2, 0);
    gantry.add(crossbar);

    const lightMeshes = [];
    for (let l = 0; l < 5; l++) {
      const lx = (l - 2) * 0.62;
      const pod = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.68, 0.25),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
      );
      pod.position.set(lx, 2.65, 0.18);
      gantry.add(pod);

      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x27272a })
      );
      lens.position.set(lx, 2.65, 0.32);
      gantry.add(lens);
      lightMeshes.push(lens);
    }
    threeState.current.gantryLights = lightMeshes;

    gantry.position.set(startPt.x, 0, startPt.z);
    gantry.lookAt(startPt.x + startTan.x, 0, startPt.z + startTan.z);
    newTrackGroup.add(gantry);

    scene.add(newTrackGroup);
    threeState.current.trackGroup = newTrackGroup;

    const envGroup = buildDetailedEnvironment(curve, selectedCircuit, timeOfDay === "NIGHT");
    scene.add(envGroup);
    threeState.current.environmentGroup = envGroup;

    if (carA) carA.position.set(vectorPoints[0].x, 0.28, vectorPoints[0].z);
    if (carB) carB.position.set(vectorPoints[0].x, 0.28, vectorPoints[0].z);
  };

  // ── TRIGGER LAP 1 STARTING GANTRY LIGHTS-OUT SEQUENCE ──
  const startFormationGridLightsSequence = () => {
    playbackRef.current.progress = 0.0;
    playbackRef.current.lap1HoldTimer = 3.2; // Hold cars on Formation Grid for 3.2 seconds while 5 red lights illuminate
    setScrubProgress(0);
    setGantryLightsCount(1);
    playRadioBeep(660, 660, 0.14);

    [1, 2, 3, 4, 5].forEach((count, idx) => {
      setTimeout(() => {
        setGantryLightsCount(count);
        playRadioBeep(660, 660, 0.12);
        const lights = threeState.current.gantryLights || [];
        lights.forEach((mesh, mIdx) => {
          mesh.material.color.setHex(mIdx < count ? 0xff0000 : 0x27272a);
        });
      }, idx * 520);
    });

    // LIGHTS OUT AND AWAY WE GO!
    setTimeout(() => {
      setGantryLightsCount(6);
      playRadioBeep(1320, 1760, 0.25);
      const lights = threeState.current.gantryLights || [];
      lights.forEach((mesh) => mesh.material.color.setHex(0x10b981));
      setTimeout(() => setGantryLightsCount(0), 1800);
    }, 2900);
  };

  // ── FETCH DUEL COMPARISON TELEMETRY (SUPPORTS SPECIFIC LAP SELECTION & OPENS MODAL) ──
  const triggerDirectComparison = async (lapOverride = undefined, openModal = false) => {
    setComparing(true);
    if (openModal) setShowCompareModal(true);

    const activeLapVal = lapOverride !== undefined ? lapOverride : selectedLap;
    const numericLap = activeLapVal === "FASTEST" ? null : Number(activeLapVal);

    if (numericLap === 1) {
      startFormationGridLightsSequence();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grand_prix: selectedCircuit,
          year: Number(selectedSeason),
          session: String(selectedSession),
          driver_a: driverA,
          driver_b: driverB,
          lap_number: numericLap
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const payload = await res.json();
      if (res.ok && payload.chart_points) {
        setComparisonData(payload);
        comparisonRef.current = payload;
        if (payload.available_laps && payload.available_laps.length > 0) {
          setAvailableLaps(payload.available_laps);
        }
        if (payload.time_of_day) {
          setTimeOfDay(payload.time_of_day);
        }
        if (payload.fastest_lap) {
          setTelemetry((prev) => ({
            ...prev,
            lapTime: payload.fastest_lap,
            topSpeed: Math.max(payload.top_speed_a || 0, payload.top_speed_b || 0, prev.topSpeed)
          }));
        }
        if (threeState.current.rawPoints && payload.dominance_map) {
          buildRealisticTrack(threeState.current.rawPoints, payload.dominance_map);
        }
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.warn("FastF1 compare fallback active:", e);
    } finally {
      setComparing(false);
    }
  };

  const handleLapChange = (newLapValue) => {
    setSelectedLap(newLapValue);
    selectedLapRef.current = newLapValue;
    triggerDirectComparison(newLapValue, false);
  };

  const loadCircuitGeometry = async (circuitName, season, session) => {
    setSessionLoading(true);
    const builtinPoints = CIRCUIT_GEOMETRIES[circuitName] || CIRCUIT_GEOMETRIES["Silverstone"];
    buildRealisticTrack(builtinPoints, null);

    const circuitSeed = circuitName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const baseSec = 74 + (circuitSeed % 28) + ((circuitSeed * 7) % 1000) / 1000;
    const bm = Math.floor(baseSec / 60);
    const bs = (baseSec % 60).toFixed(3).padStart(6, "0");
    setTelemetry((prev) => ({
      ...prev,
      lapTime: `${bm}:${bs} (${driverA})`
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/circuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grand_prix: circuitName,
          year: Number(season),
          session: String(session),
          driver_a: driverA,
          driver_b: driverB
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.time_of_day) {
        setTimeOfDay(data.time_of_day);
      }
      if (data.available_laps && data.available_laps.length > 0) {
        setAvailableLaps(data.available_laps);
      }
      if (data.points && data.points.length > 15) {
        buildRealisticTrack(data.points, comparisonRef.current?.dominance_map || null);
        setDataSourceBadge(`FASTF1 LIVE ARCHIVE • ${season} ${session}`);
      } else {
        setDataSourceBadge(`FIA GEOMETRY • ${season} ${session}`);
      }
      if (data.telemetry_trace && data.telemetry_trace.length > 0) {
        setSessionTrace(data.telemetry_trace);
        sessionTraceRef.current = data.telemetry_trace;
      } else {
        setSessionTrace(null);
        sessionTraceRef.current = null;
      }
      if (data.lap_time) {
        const ownerSuffix = data.lap_time.includes("(")
          ? data.lap_time
          : `${data.lap_time} (${data.fastest_driver || driverA})`;
        setTelemetry((prev) => ({
          ...prev,
          lapTime: ownerSuffix,
          topSpeed: data.top_speed || prev.topSpeed
        }));
      }
    } catch (e) {
      clearTimeout(timeoutId);
      setDataSourceBadge(`FIA GEOMETRY • ${season} ${session}`);
      setSessionTrace(null);
      sessionTraceRef.current = null;
    } finally {
      setSessionLoading(false);
    }

    triggerDirectComparison(selectedLapRef.current, false);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x60a5fa);
    scene.fog = new THREE.FogExp2(0x93c5fd, 0.0022);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1500);
    camera.position.set(0, 44, 60);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    canvasRef.current.replaceChildren(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xfffbeb, 2.4);
    sunLight.position.set(60, 95, 45);
    scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0xbae6fd, 1.1);
    skyFill.position.set(-60, 40, -40);
    scene.add(skyFill);

    const carA = buildPhotorealisticF1Car(driverA);
    const carB = buildPhotorealisticF1Car(driverB);
    scene.add(carA);
    scene.add(carB);

// ── 22-CAR LIVE BROADCAST FLEET, SAFETY CAR & CRASH HAZARD MESHES ──
    const liveFleetGroup = new THREE.Group();
    const fleetMeshes = [];
    const fleetPalette = [
      0x06142e, 0xff8000, 0xdc2626, 0xdc2626, 0xff8000, 0x00a19c, 0x00a19c,
      0x004fd4, 0x06142e, 0x00594f, 0x004fd4, 0x0072bb, 0x1e40af, 0x22c55e,
      0xf8fafc, 0x00594f, 0xf8fafc, 0x1e40af, 0x0072bb, 0x22c55e, 0xeab308, 0xeab308
    ];
    for (let c = 0; c < 22; c++) {
      const miniCar = new THREE.Group();
      const chassis = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.24, 1.35),
        new THREE.MeshStandardMaterial({ color: fleetPalette[c], metalness: 0.6, roughness: 0.2 })
      );
      chassis.position.y = 0.16;
      miniCar.add(chassis);
      const wing = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.08, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x111827 })
      );
      wing.position.set(0, 0.32, -0.58);
      miniCar.add(wing);
      liveFleetGroup.add(miniCar);
      fleetMeshes.push(miniCar);
    }
    liveFleetGroup.visible = false;
    scene.add(liveFleetGroup);

    // FIA Official Safety Car with Flashing Roof Lightbar
    const safetyCarMesh = new THREE.Group();
    const scBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.34, 1.48),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.75, roughness: 0.15 })
    );
    scBody.position.y = 0.2;
    safetyCarMesh.add(scBody);
    const scLightBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.09, 0.14),
      new THREE.MeshBasicMaterial({ color: 0xfacc15 })
    );
    scLightBar.position.set(0, 0.44, 0);
    safetyCarMesh.add(scLightBar);
    safetyCarMesh.visible = false;
    scene.add(safetyCarMesh);

    // Crash Incident Hazard Ring & Plume
    const crashMarkerGroup = new THREE.Group();
    const hazardRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.65, 0.12, 12, 32),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    hazardRing.rotation.x = Math.PI / 2;
    hazardRing.position.y = 0.25;
    crashMarkerGroup.add(hazardRing);
    crashMarkerGroup.visible = false;
    scene.add(crashMarkerGroup);

    threeState.current = {
      scene,
      renderer,
      camera,
      controls,
      ambientLight,
      sunLight,
      trackGroup: null,
      environmentGroup: null,
      attractionMesh: null,
      gantryLights: [],
      carA,
      carB,
      curve: null,
      rawPoints: null,
      balloons: [],
      animId: null
    };

    applyTimeOfDayAtmosphere(timeOfDay);
    loadCircuitGeometry(selectedCircuit, selectedSeason, selectedSession);

    // Raycaster for 3D Landmark Attraction Cursor Hover Pop-up
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const handlePointerMove = (evt) => {
      if (!canvasRef.current || !threeState.current.attractionMesh) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObject(threeState.current.attractionMesh, true);
      if (hits.length > 0 && hits[0].object.userData?.attractionData) {
        setHoveredAttraction({
          ...hits[0].object.userData.attractionData,
          screenX: evt.clientX - rect.left,
          screenY: evt.clientY - rect.top
        });
      } else {
        setHoveredAttraction(null);
      }
    };
    renderer.domElement.addEventListener("pointermove", handlePointerMove);

    let currentLapTimeSec = 0;
    const baseLoopDuration = 28.0;

    const hashA = driverA.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const hashB = driverB.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const isRaceMode = selectedSession === "R" || selectedSession === "S";
    const baseTrackGap = isRaceMode
      ? (((hashA * 13 + hashB * 7) % 55) + 12) / 100.0
      : (((hashA - hashB) % 7) * 0.008);

    const animate = () => {
      const { curve, carA, carB, balloons } = threeState.current;
      const { isPlaying, speed, cameraMode } = playbackRef.current;

      if (cameraMode === "ORBIT") controls.update();

      balloons.forEach((b, idx) => {
        b.position.y += Math.sin(Date.now() * 0.0015 + idx) * 0.012;
      });

      if (curve && carA && carB) {
        // Hold cars stationary on the Formation Grid during Lap 1 5-Red-Lights-Out sequence
        if (playbackRef.current.lap1HoldTimer > 0) {
          playbackRef.current.lap1HoldTimer = Math.max(0, playbackRef.current.lap1HoldTimer - 0.016);
          const gridPA = curve.getPointAt(0.992);
          const gridTanA = curve.getTangentAt(0.992).normalize();
          const gridNormA = new THREE.Vector3(-gridTanA.z, 0, gridTanA.x).normalize();
          const posGridA = gridPA.clone().add(gridNormA.multiplyScalar(0.52));
          carA.position.set(posGridA.x, 0.28, posGridA.z);
          carA.lookAt(posGridA.x + gridTanA.x, 0.28, posGridA.z + gridTanA.z);

          const gridPB = curve.getPointAt(0.984);
          const gridTanB = curve.getTangentAt(0.984).normalize();
          const gridNormB = new THREE.Vector3(-gridTanB.z, 0, gridTanB.x).normalize();
          const posGridB = gridPB.clone().add(gridNormB.multiplyScalar(-0.52));
          carB.position.set(posGridB.x, 0.28, posGridB.z);
          carB.lookAt(posGridB.x + gridTanB.x, 0.28, posGridB.z + gridTanB.z);

          setTelemetry((prev) => ({ ...prev, speed: 0, throttle: 85, brake: 100, gear: 1, rpm: 10800, drs: "CLOSED" }));
          if (speedRef.current) speedRef.current.innerText = "0";
          renderer.render(scene, camera);
          threeState.current.animId = requestAnimationFrame(animate);
          return;
        }

        if (isPlaying) {
          currentLapTimeSec += 0.016 * speed;
          const rawProgress = (currentLapTimeSec / baseLoopDuration) % 1.0;
          playbackRef.current.progress = rawProgress;
          setScrubProgress(rawProgress);
        }

        const tA = playbackRef.current.progress;
        const activeComp = comparisonRef.current;
        const activeTrace = sessionTraceRef.current;
        const isLapOne = Number(selectedLapRef.current) === 1;

        const dynamicCornerSwing = Math.sin(tA * Math.PI * 6 + hashB) * 0.014;
        // On Lap 1, cars launch side-by-side from the formation grid and battle closely into Turn 1
        const effectiveGap = isLapOne ? baseTrackGap * Math.min(1, tA * 3.0) * 0.22 : baseTrackGap;
        let tB = (tA - effectiveGap + dynamicCornerSwing + 1.0) % 1.0;

        let speedValA = 295, throttleValA = 98, brakeValA = 0, gearValA = 8;
        let speedValB = 292, throttleValB = 96, brakeValB = 0, gearValB = 8;

        if (activeComp && activeComp.chart_points && activeComp.chart_points.length > 0) {
          const ptIdx = Math.floor(tA * (activeComp.chart_points.length - 1));
          const pt = activeComp.chart_points[ptIdx];
          if (pt) {
            speedValA = Math.round(pt.speed_a);
            throttleValA = pt.throttle_a ?? (speedValA < 150 ? 15 : 98);
            brakeValA = pt.brake_a ?? (speedValA < 150 ? 75 : 0);
            gearValA = pt.gear_a ?? (speedValA < 120 ? 3 : speedValA < 210 ? 5 : 8);

            speedValB = Math.round(pt.speed_b ?? speedValA - 2);
            throttleValB = pt.throttle_b ?? (speedValB < 150 ? 18 : 96);
            brakeValB = pt.brake_b ?? (speedValB < 150 ? 72 : 0);
            gearValB = pt.gear_b ?? (speedValB < 120 ? 3 : speedValB < 210 ? 5 : 8);

            tB = isLapOne && tA < 0.15 ? (tA - 0.008 + 1.0) % 1.0 : (pt.norm_b ?? tB);
            const deltaVal = isRaceMode && pt.on_track_gap !== undefined
              ? pt.on_track_gap
              : (pt.delta_running ?? activeComp.delta_sec * tA);
            setLiveDelta(`${deltaVal >= 0 ? "+" : ""}${Number(deltaVal).toFixed(3)}s`);
          }
        } else {
          if (activeTrace && activeTrace.length > 0) {
            const traceIdxA = Math.floor(tA * (activeTrace.length - 1));
            const traceIdxB = Math.floor((((tB % 1.0) + 1.0) % 1.0) * (activeTrace.length - 1));
            const sampleA = activeTrace[traceIdxA];
            const sampleB = activeTrace[traceIdxB];
            if (sampleA) {
              speedValA = sampleA.speed;
              throttleValA = sampleA.throttle;
              brakeValA = sampleA.brake;
              gearValA = sampleA.gear;
            }
            if (sampleB) {
              speedValB = sampleB.speed;
              throttleValB = sampleB.throttle;
              brakeValB = sampleB.brake;
              gearValB = sampleB.gear;
            }
          } else {
            speedValA = Math.round(105 + 230 * Math.abs(Math.sin(tA * Math.PI * 7)));
            gearValA = speedValA < 115 ? 2 : speedValA < 150 ? 3 : speedValA < 185 ? 4 : speedValA < 225 ? 5 : speedValA < 265 ? 6 : speedValA < 300 ? 7 : 8;
            const isBrakingA = speedValA < 145;
            throttleValA = isBrakingA ? 0 : Math.min(100, Math.round(speedValA * 0.3 + 22));
            brakeValA = isBrakingA ? Math.round(100 - (speedValA / 145) * 55) : 0;

            const wrappedB = ((tB % 1.0) + 1.0) % 1.0;
            speedValB = Math.round(103 + 228 * Math.abs(Math.sin(wrappedB * Math.PI * 7 + 0.12)));
            gearValB = speedValB < 115 ? 2 : speedValB < 150 ? 3 : speedValB < 185 ? 4 : speedValB < 225 ? 5 : speedValB < 265 ? 6 : speedValB < 300 ? 7 : 8;
            const isBrakingB = speedValB < 145;
            throttleValB = isBrakingB ? 0 : Math.min(100, Math.round(speedValB * 0.3 + 20));
            brakeValB = isBrakingB ? Math.round(100 - (speedValB / 145) * 55) : 0;
          }

          const simDelta = isRaceMode
            ? effectiveGap * 88.0 + Math.sin(tA * Math.PI * 4) * 0.35
            : ((hashB - hashA) * 0.04) * tA + Math.sin(tA * Math.PI * 6) * 0.18;
          setLiveDelta(`${simDelta >= 0 ? "+" : ""}${simDelta.toFixed(3)}s`);
        }

        const rpmValA = Math.min(13200, Math.round(7800 + (speedValA % 65) * 82));
        const drsStateA = speedValA > 285 && brakeValA === 0 ? "OPEN" : "CLOSED";

        const rpmValB = Math.min(13200, Math.round(7750 + (speedValB % 65) * 82));
        const drsStateB = speedValB > 285 && brakeValB === 0 ? "OPEN" : "CLOSED";

        setTelemetry((prev) => ({
          ...prev,
          speed: speedValA,
          throttle: throttleValA,
          brake: brakeValA,
          gear: gearValA,
          rpm: rpmValA,
          drs: drsStateA,
          speedB: speedValB,
          throttleB: throttleValB,
          brakeB: brakeValB,
          gearB: gearValB,
          rpmB: rpmValB,
          drsB: drsStateB
        }));

        if (speedRef.current) speedRef.current.innerText = speedValA;

        const posA = curve.getPointAt(tA % 1.0);
        const tanA = curve.getTangentAt(tA % 1.0);
        carA.position.set(posA.x, 0.28, posA.z);
        carA.lookAt(posA.x + tanA.x, 0.28, posA.z + tanA.z);

        const wrappedTB = ((tB % 1.0) + 1.0) % 1.0;
        const posB = curve.getPointAt(wrappedTB);
        const tanB = curve.getTangentAt(wrappedTB);
        carB.position.set(posB.x, 0.28, posB.z);
        carB.lookAt(posB.x + tanB.x, 0.28, posB.z + tanB.z);

        if (cameraMode === "CHASE_A") {
          const chaseOffset = posA
            .clone()
            .sub(tanA.clone().multiplyScalar(5.2))
            .add(new THREE.Vector3(0, 2.0, 0));
          camera.position.lerp(chaseOffset, 0.14);
          camera.lookAt(posA.x, 0.8, posA.z);
        }
      }

// Update 22-Car Live Broadcast Fleet, Safety Car & Crash Marker
        const liveData = liveBroadcastRef.current;
        if (isLive22Ref.current && liveData && liveData.cars) {
          liveFleetGroup.visible = true;
          carA.visible = false;
          carB.visible = false;

          liveData.cars.forEach((carInfo, idx) => {
            const mesh = fleetMeshes[idx];
            if (!mesh) return;
            const pNorm = ((carInfo.progress % 1.0) + 1.0) % 1.0;
            const pt = curve.getPointAt(pNorm);
            const tan = curve.getTangentAt(pNorm).normalize();
            const norm = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
            const laneShift = (idx % 2 === 0 ? 0.32 : -0.32);
            const finalPos = pt.clone().add(norm.multiplyScalar(laneShift));
            mesh.position.set(finalPos.x, 0.22, finalPos.z);
            mesh.lookAt(finalPos.x + tan.x, 0.22, finalPos.z + tan.z);
            if (carInfo.in_crash) {
              mesh.rotation.y += 0.85; // Spun-out car orientation at crash site
            }
          });

          if (liveData.safety_car_active) {
            safetyCarMesh.visible = true;
            const scP = ((liveData.safety_car_progress % 1.0) + 1.0) % 1.0;
            const scPt = curve.getPointAt(scP);
            const scTan = curve.getTangentAt(scP).normalize();
            safetyCarMesh.position.set(scPt.x, 0.25, scPt.z);
            safetyCarMesh.lookAt(scPt.x + scTan.x, 0.25, scPt.z + scTan.z);
            scLightBar.material.color.setHex(Math.floor(Date.now() / 150) % 2 === 0 ? 0xfacc15 : 0xff0000);
          } else {
            safetyCarMesh.visible = false;
          }

          if (liveData.crash_zone_progress !== null && liveData.crash_zone_progress !== undefined) {
            crashMarkerGroup.visible = true;
            const cPt = curve.getPointAt(liveData.crash_zone_progress);
            crashMarkerGroup.position.set(cPt.x, 0.2, cPt.z);
            hazardRing.scale.setScalar(1 + Math.sin(Date.now() * 0.008) * 0.25);
          } else {
            crashMarkerGroup.visible = false;
          }
        } else {
          liveFleetGroup.visible = false;
          safetyCarMesh.visible = false;
          crashMarkerGroup.visible = false;
          carA.visible = true;
          carB.visible = true;
        }

      renderer.render(scene, camera);
      threeState.current.animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = canvasRef.current.clientWidth;
      const h = canvasRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(threeState.current.animId);
    };
  }, [driverA, driverB, selectedSeason, selectedSession, selectedCircuit]);

  // ── 3D INTERACTIVE WORLD GLOBE RENDERER WHEN GLOBE MODAL IS OPEN ──
  useEffect(() => {
    if (!showGlobeModal || !globeCanvasRef.current) return;
    const width = globeCanvasRef.current.clientWidth || 520;
    const height = globeCanvasRef.current.clientHeight || 520;

    const gScene = new THREE.Scene();
    const gCam = new THREE.PerspectiveCamera(42, width / height, 0.1, 500);
    gCam.position.set(0, 8, 34);

    const gRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    gRenderer.setSize(width, height);
    gRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    globeCanvasRef.current.replaceChildren(gRenderer.domElement);

    const gControls = new OrbitControls(gCam, gRenderer.domElement);
    gControls.enableDamping = true;
    gControls.autoRotate = true;
    gControls.autoRotateSpeed = 0.85;

    gScene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    dirLight.position.set(25, 25, 25);
    gScene.add(dirLight);

    const globeGroup = new THREE.Group();
    gScene.add(globeGroup);

    // Dark Tech Ocean Sphere + Latitude/Longitude Wireframe Grid
    const earthSphere = new THREE.Mesh(
      new THREE.SphereGeometry(11.5, 48, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b132b, roughness: 0.65, metalness: 0.35 })
    );
    globeGroup.add(earthSphere);

    const gridSphere = new THREE.Mesh(
      new THREE.SphereGeometry(11.56, 28, 20),
      new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true })
    );
    globeGroup.add(gridSphere);

    // Plot all 24 F1 Circuit Pins (including 3 segmented USA pins and 2 segmented Italy pins)
    const pinMeshes = [];
    GLOBE_F1_LOCATIONS.forEach((loc) => {
      const phi = (90 - loc.lat) * (Math.PI / 180);
      const theta = (loc.lon + 180) * (Math.PI / 180);
      const r = 11.75;
      const px = -(r * Math.sin(phi) * Math.cos(theta));
      const pz = r * Math.sin(phi) * Math.sin(theta);
      const py = r * Math.cos(phi);

      const pin = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 16, 16),
        new THREE.MeshBasicMaterial({ color: loc.color })
      );
      pin.position.set(px, py, pz);
      pin.userData = { f1Location: loc };
      globeGroup.add(pin);
      pinMeshes.push(pin);

      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.52, 0.78, 20),
        new THREE.MeshBasicMaterial({ color: loc.color, side: THREE.DoubleSide })
      );
      halo.position.set(px * 1.01, py * 1.01, pz * 1.01);
      halo.lookAt(0, 0, 0);
      globeGroup.add(halo);
    });

    const gRaycaster = new THREE.Raycaster();
    const gMouse = new THREE.Vector2();
    const handleGlobeClick = (e) => {
      const rect = gRenderer.domElement.getBoundingClientRect();
      gMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      gMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      gRaycaster.setFromCamera(gMouse, gCam);
      const hits = gRaycaster.intersectObjects(pinMeshes, false);
      if (hits.length > 0 && hits[0].object.userData?.f1Location) {
        const chosen = hits[0].object.userData.f1Location;
        setSelectedCircuit(chosen.circuit);
        setShowGlobeModal(false);
      }
    };
    gRenderer.domElement.addEventListener("click", handleGlobeClick);

    let gAnimId;
    const renderGlobe = () => {
      gControls.update();
      gRenderer.render(gScene, gCam);
      gAnimId = requestAnimationFrame(renderGlobe);
    };
    renderGlobe();

    return () => {
      gRenderer.domElement.removeEventListener("click", handleGlobeClick);
      cancelAnimationFrame(gAnimId);
    };
  }, [showGlobeModal]);

  const focusExtremeZoom = () => {
    const { camera, controls, carA } = threeState.current;
    if (camera && controls && carA) {
      setCameraMode("ORBIT");
      gsap.to(camera.position, {
        x: carA.position.x + 2.2,
        y: carA.position.y + 1.1,
        z: carA.position.z + 2.6,
        duration: 1.1,
        ease: "power2.inOut"
      });
      controls.target.copy(carA.position);
    }
  };

  const focusLandmarkAttraction = () => {
    const { camera, controls, attractionMesh } = threeState.current;
    if (camera && controls && attractionMesh) {
      setCameraMode("ORBIT");
      gsap.to(camera.position, {
        x: attractionMesh.position.x + 12,
        y: attractionMesh.position.y + 9,
        z: attractionMesh.position.z + 12,
        duration: 1.2,
        ease: "power2.inOut"
      });
      controls.target.copy(attractionMesh.position);
    }
  };

  const toggleChaseCamera = () => {
    setCameraMode((prev) => (prev === "CHASE_A" ? "ORBIT" : "CHASE_A"));
  };

  const sendRadioMessage = async (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    const currentQuery = query;
    setQuery("");
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { sender: "DRIVER", text: currentQuery, specialist: "RADIO", time: "OUTGOING" }
    ]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/radio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `[Context: Season ${selectedSeason}, Circuit: ${selectedCircuit} GP, Session: ${selectedSession}, Active Duel: ${driverA} vs ${driverB}, Selected Lap: ${selectedLap}] ${currentQuery}`
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "PITWALL CHIEF",
          text: data.answer || "Copy that.",
          specialist: data.specialist || "STRATEGIST",
          time: "RADIO IN"
        }
      ]);
      speakRadioMessage(data.answer);
    } catch (e) {
      clearTimeout(timeoutId);
      const errReason = e.name === "AbortError" ? "Backend request timed out (15s)" : "Backend unreachable.";
      setMessages((prev) => [
        ...prev,
        { sender: "SYSTEM", text: errReason, specialist: "OFFLINE", time: "ERR" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const activeSessionObj =
    availableSessions.find((s) => s.id === selectedSession) || ALL_SESSIONS[0];
  const currentAttraction = CIRCUIT_ATTRACTIONS[selectedCircuit] || CIRCUIT_ATTRACTIONS["Silverstone"];

  // Fallback per-lap stats if user opens modal while FastF1 is still caching
  const statsA = comparisonData?.stats_a || {
    compound: "SOFT",
    tyre_life_laps: selectedLap === "FASTEST" ? 4 : Math.max(1, Number(selectedLap) % 18),
    tyre_health_pct: 86,
    stint: 1,
    pit_stops: selectedLap === "FASTEST" || Number(selectedLap) < 18 ? 0 : 1,
    pit_status: "ON TRACK",
    s1: "27.412s",
    s2: "34.108s",
    s3: "24.299s"
  };
  const statsB = comparisonData?.stats_b || {
    compound: "MEDIUM",
    tyre_life_laps: selectedLap === "FASTEST" ? 5 : Math.max(1, (Number(selectedLap) + 2) % 22),
    tyre_health_pct: 82,
    stint: 1,
    pit_stops: selectedLap === "FASTEST" || Number(selectedLap) < 20 ? 0 : 1,
    pit_status: "ON TRACK",
    s1: "27.504s",
    s2: "34.190s",
    s3: "24.341s"
  };

  return (
    <div className="flex h-screen w-screen bg-[#08090b] text-gray-200 overflow-hidden select-none relative f1-body">
      {/* ── F1 PROPRIETARY DISPLAY FONT & TITILLIUM WEB BODY TYPOGRAPHY INJECTION ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:ital,wght@0,700;0,900;1,800;1,900&family=Titillium+Web:ital,wght@0,400;0,600;0,700;0,900;1,600&display=swap');
        .f1-body {
          font-family: 'Titillium Web', sans-serif;
        }
        .f1-display {
          font-family: 'F1 Regular', 'Formula1-Display-Bold', 'Orbitron', sans-serif;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-style: italic;
        }
      `}</style>

      {/* ── MAIN 3D VIEWPORT & MULTI-SEASON TELEMETRY WORKSPACE ── */}
      <div className="flex-1 flex flex-col relative w-full h-full pt-14 overflow-hidden">
        {/* Top Command Navigation Bar — Fixed at Top, Single Even Row, No Scrollbars */}
        <div className="fixed top-0 left-0 right-0 h-14 border-b border-[#1f2430] flex items-center justify-between px-3 md:px-4 bg-[#0d0f15]/98 backdrop-blur-xl z-50 shadow-lg gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0"></span>

            {/* 1. Season Selector */}
            <div className="flex items-center gap-1.5 bg-[#151821] border border-cyan-500/40 px-2.5 py-1 rounded-lg shrink-0">
              <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-[10px] text-cyan-400 font-bold f1-display">YEAR:</span>
              <select
                value={selectedSeason}
                onChange={(e) => {
                  const yr = Number(e.target.value);
                  setSelectedSeason(yr);
                  setComparisonData(null);
                }}
                className="bg-transparent text-xs font-extrabold text-cyan-300 focus:outline-none cursor-pointer f1-display"
              >
                {SEASONS.map((yr) => (
                  <option key={yr} value={yr} className="bg-[#151821] text-white">
                    {yr} SEASON
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Grand Prix Circuit Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#151821] border border-yellow-500/40 px-2.5 py-1 rounded-lg shrink-0">
              <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <select
                value={selectedCircuit}
                onChange={(e) => {
                  setSelectedCircuit(e.target.value);
                  setComparisonData(null);
                }}
                className="bg-transparent text-xs font-extrabold text-white focus:outline-none cursor-pointer f1-display"
              >
                {activeCalendar.map((c, i) => (
                  <option key={c} value={c} className="bg-[#151821] text-white">
                    R{i + 1}: {c.toUpperCase()} GP
                  </option>
                ))}
              </select>
            </div>

            {/* 3. World Globe Selector Button */}
            <button
              type="button"
              onClick={() => setShowGlobeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-black shadow-[0_0_12px_rgba(6,182,212,0.5)] border border-cyan-300/40 transition-all f1-display shrink-0"
            >
              <Globe className="w-3.5 h-3.5 animate-spin shrink-0" style={{ animationDuration: "10s" }} />
              F1 WORLD GLOBE
            </button>

            {/* 4. Session Selector */}
            <div className="flex items-center gap-1.5 bg-[#151821] border border-red-500/40 px-2.5 py-1 rounded-lg shrink-0">
              <Layers className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <select
                value={selectedSession}
                onChange={(e) => {
                  setSelectedSession(e.target.value);
                  setComparisonData(null);
                }}
                className="bg-transparent text-xs font-extrabold text-red-300 focus:outline-none cursor-pointer"
              >
                {availableSessions.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#151821] text-white">
                    [{s.id}] {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Driver Duel Selector + Big Compare Telemetry Modal Trigger */}
            <div className="flex items-center gap-1.5 bg-[#12151d] border border-cyan-500/30 px-2.5 py-1 rounded-lg shrink-0">
              <span className="text-[10px] text-gray-400 font-bold f1-display">DUEL:</span>
              <select
                value={driverA}
                onChange={(e) => setDriverA(e.target.value)}
                className="bg-[#1c2230] text-yellow-400 border border-yellow-500/40 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {driverKeys.map((d) => (
                  <option key={d} value={d} className="bg-[#151821] text-white">
                    {d} • {currentGrid[d]?.name}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-gray-500 font-black f1-display">VS</span>
              <select
                value={driverB}
                onChange={(e) => setDriverB(e.target.value)}
                className="bg-[#1c2230] text-cyan-400 border border-cyan-500/40 rounded px-1.5 py-0.5 text-xs font-bold focus:outline-none cursor-pointer"
              >
                {driverKeys.map((d) => (
                  <option key={d} value={d} className="bg-[#151821] text-white">
                    {d} • {currentGrid[d]?.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => triggerDirectComparison(selectedLap, true)}
                className="ml-1 flex items-center gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded shadow-[0_0_12px_rgba(220,38,38,0.6)] transition-all active:scale-95 f1-display shrink-0"
              >
                <GitCompare className="w-3.5 h-3.5 shrink-0" />
                {comparing ? "SYNCING..." : "COMPARE TELEMETRY"}
              </button>
            </div>
          </div>

          {/* Right Camera, Landmark & AI Agent Controls */}
          <div className="flex items-center gap-2 text-xs text-gray-400 shrink-0">
            <button
              type="button"
              onClick={focusLandmarkAttraction}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-500/40 text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 transition-all font-bold f1-display text-[10px] shrink-0"
              title={currentAttraction.name}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              LANDMARK
            </button>

            <button
              type="button"
              onClick={focusExtremeZoom}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-500/40 text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 transition-all font-bold f1-display text-[10px] shrink-0"
            >
              <ZoomIn className="w-3.5 h-3.5 shrink-0" />
              COCKPIT
            </button>

            <button
              type="button"
              onClick={toggleChaseCamera}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all font-bold f1-display text-[10px] shrink-0 ${
                cameraMode === "CHASE_A"
                  ? "border-red-500 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  : "border-gray-700 text-gray-400 hover:text-white"
              }`}
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              CHASE: {cameraMode === "CHASE_A" ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={() => setIsAgentOpen(!isAgentOpen)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-extrabold text-xs bg-red-600 hover:bg-red-500 text-white shadow-lg border border-red-400 f1-display shrink-0"
            >
              <Bot className="w-4 h-4 shrink-0" />
              {isAgentOpen ? "CLOSE AI" : "PITWALL AI"}
            </button>
          </div>
        </div>

        {/* 3D Track & Environment Full-Screen Viewport */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <div
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          />

          {/* ── TOP-RIGHT LIVE 2026 22-CAR BROADCAST & FIA FLAG DIRECTOR BAR ── */}
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2 bg-[#0b0e17]/95 backdrop-blur-md p-2 rounded-xl border border-red-500/40 shadow-2xl flex-wrap max-w-[92vw]">
            <button
              type="button"
              onClick={() => {
                const nextState = !isLive22CarMode;
                setIsLive22CarMode(nextState);
                if (nextState && liveFlagStatus === "FORMATION_START") {
                  startFormationGridLightsSequence();
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black f1-display transition-all flex items-center gap-1.5 ${
                isLive22CarMode
                  ? "bg-red-600 text-white shadow-[0_0_16px_rgba(220,38,38,0.8)] animate-pulse"
                  : "bg-[#161b26] text-gray-300 hover:text-white border border-white/10"
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              {isLive22CarMode ? "22-CAR LIVE BROADCAST: ON" : "LAUNCH 22-CAR LIVE BROADCAST"}
            </button>

            {isLive22CarMode && (
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { id: "FORMATION_START", label: "GRID LIGHTS", cls: "border-cyan-400 text-cyan-300" },
                  { id: "GREEN", label: "GREEN FLAG", cls: "border-emerald-400 text-emerald-300" },
                  { id: "SAFETY_CAR", label: "SAFETY CAR", cls: "border-amber-400 text-amber-300" },
                  { id: "CRASH", label: "CRASH INCIDENT", cls: "border-orange-500 text-orange-300" },
                  { id: "RED_FLAG", label: "RED FLAG", cls: "border-red-500 text-red-400" }
                ].map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => {
                      setLiveFlagStatus(f.id);
                      if (f.id === "FORMATION_START") startFormationGridLightsSequence();
                    }}
                    className={`px-2 py-1 rounded text-[10px] font-black f1-display border transition-all ${
                      liveFlagStatus === f.id ? `bg-white/15 ${f.cls}` : "border-white/10 text-gray-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── LEFT-SIDE OFFICIAL F1 TV 22-CAR LIVE SCORING & POSITION TICKER TOWER ── */}
          {isLive22CarMode && liveBroadcastState && (
            <div className="absolute top-36 left-4 bottom-28 w-68 md:w-72 bg-[#090b10]/92 backdrop-blur-xl rounded-2xl border border-white/15 z-20 flex flex-col shadow-[0_0_45px_rgba(0,0,0,0.85)] overflow-hidden">
              <div className="p-3 bg-[#111520] border-b border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white f1-display">
                    F1 LIVE TIMING TOWER
                  </span>
                  <span className="text-[11px] font-black text-cyan-400 f1-display">
                    LAP {liveBroadcastState.current_lap}/{liveBroadcastState.total_laps}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 truncate mt-0.5">
                  {liveBroadcastState.race_name} • {liveBroadcastState.scheduled_start_ist}
                </div>
                <div
                  className={`mt-2 py-1 px-2 rounded text-center text-[10px] font-black f1-display ${
                    liveBroadcastState.track_flag === "GREEN"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : liveBroadcastState.track_flag === "RED_FLAG"
                      ? "bg-red-600 text-white animate-pulse"
                      : "bg-amber-500 text-black animate-pulse"
                  }`}
                >
                  TRACK STATUS: {liveBroadcastState.track_flag.replace("_", " ")}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5 px-2 py-1">
                {liveBroadcastState.cars.map((c) => (
                  <div
                    key={c.code}
                    className={`flex items-center justify-between py-1.5 px-2 rounded text-xs ${
                      c.in_crash ? "bg-red-900/40 border border-red-500/50" : "hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-[11px] font-black text-gray-400 f1-display">
                        {c.pos}
                      </span>
                      <span
                        className="w-1 h-4 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-black text-white f1-display">{c.code}</span>
                      <span className="text-[9px] text-gray-400">#{c.number}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black border ${
                          c.compound === "SOFT"
                            ? "border-red-500 text-red-400"
                            : c.compound === "MEDIUM"
                            ? "border-yellow-400 text-yellow-300"
                            : "border-white text-white"
                        }`}
                      >
                        {c.compound[0]}
                      </span>
                      <span
                        className={`text-[10px] font-bold f1-display w-16 text-right ${
                          c.in_crash ? "text-red-400 font-black" : "text-gray-300"
                        }`}
                      >
                        {c.gap}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2.5 bg-[#0e121b] border-t border-white/10">
                <div className="text-[9px] font-black text-cyan-400 f1-display mb-1">
                  UPCOMING 2026 LIVE BROADCAST LOOP:
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {liveBroadcastState.upcoming_loop.map((up) => (
                    <button
                      type="button"
                      key={up.circuit}
                      onClick={() => setSelectedCircuit(up.circuit)}
                      className={`px-2 py-1 rounded text-[9px] font-bold text-left truncate border ${
                        selectedCircuit === up.circuit
                          ? "bg-cyan-500/20 border-cyan-400 text-white"
                          : "bg-[#151a26] border-white/5 text-gray-400 hover:text-white"
                      }`}
                    >
                      R{up.round}: {up.circuit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 3D ATTRACTION HOVER POP-UP CARD ── */}
          {hoveredAttraction && (
            <div
              style={{
                left: Math.min(window.innerWidth - 340, Math.max(16, hoveredAttraction.screenX + 18)),
                top: Math.max(16, hoveredAttraction.screenY - 20)
              }}
              className="pointer-events-none absolute z-30 w-80 bg-[#0b0e17]/95 backdrop-blur-xl border-2 border-cyan-400/80 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(0,240,255,0.35)]"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-black f1-display">
                  3D CIRCUIT LANDMARK
                </span>
                <span className="text-[10px] text-amber-400 font-bold">{selectedCircuit.toUpperCase()} GP</span>
              </div>
              <div className="text-sm font-black text-white f1-display mb-0.5">
                {hoveredAttraction.name}
              </div>
              <div className="text-[11px] text-cyan-300 font-semibold mb-1.5">
                {hoveredAttraction.subtitle}
              </div>
              <p className="text-xs text-gray-300 leading-snug">
                {hoveredAttraction.proximity}
              </p>
            </div>
          )}

          {/* ── LAP 1 STARTING GANTRY 5-RED-LIGHTS OVERLAY BANNER ── */}
          {gantryLightsCount > 0 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-[#090b10]/95 border-2 border-red-500/60 px-6 py-3 rounded-2xl z-30 flex flex-col items-center gap-2 shadow-[0_0_40px_rgba(239,68,68,0.6)]">
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((num) => (
                  <div
                    key={num}
                    className={`w-7 h-7 rounded-full border-2 transition-all duration-150 ${
                      gantryLightsCount === 6
                        ? "bg-emerald-500 border-emerald-300 shadow-[0_0_18px_#10b981]"
                        : gantryLightsCount >= num
                        ? "bg-red-600 border-red-300 shadow-[0_0_18px_#ef4444]"
                        : "bg-gray-900 border-gray-700"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-black tracking-widest text-white f1-display">
                {gantryLightsCount === 6
                  ? "LIGHTS OUT AND AWAY WE GO!"
                  : `FORMATION GRID • LAP 1 START SEQUENCE (${gantryLightsCount}/5)`}
              </span>
            </div>
          )}

          {/* ── 1. COLLAPSIBLE SESSION INFORMATION BOX (WITH SIDE ARROW BUTTON) ── */}
          <div
            className={`absolute top-3 left-3 bg-[#0d0f15]/95 backdrop-blur-md rounded-2xl border border-white/15 z-30 shadow-2xl transition-all duration-300 ${
              sessionInfoOpen ? "p-3.5 max-w-[90vw] md:max-w-xl" : "p-2 w-10"
            }`}
          >
            <button
              type="button"
              onClick={() => setSessionInfoOpen(!sessionInfoOpen)}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-[#151a26] border border-cyan-400/60 text-cyan-300 p-1 rounded-full shadow-lg hover:bg-cyan-500 hover:text-black transition-colors z-40"
              title={sessionInfoOpen ? "Collapse Session Information" : "Expand Session Information"}
            >
              {sessionInfoOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {sessionInfoOpen ? (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 text-xs font-extrabold text-white flex-wrap">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: currentGrid[driverA]?.primary || "#dc2626" }}
                  ></span>
                  <span className="f1-display">
                    {selectedSeason} {selectedCircuit.toUpperCase()} GP — {activeSessionObj.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] f1-display">
                    {sessionLoading ? "SYNCING FASTF1..." : dataSourceBadge}
                  </span>
                  <div className="flex items-center gap-1 bg-[#161b26] border border-amber-400/40 px-2 py-0.5 rounded text-[10px] text-amber-300">
                    {timeOfDay === "NIGHT" ? (
                      <Moon className="w-3 h-3 text-cyan-300" />
                    ) : timeOfDay === "EVENING" ? (
                      <Sunset className="w-3 h-3 text-orange-400" />
                    ) : (
                      <Sun className="w-3 h-3 text-yellow-400" />
                    )}
                    <select
                      value={timeOfDay}
                      onChange={(e) => setTimeOfDay(e.target.value)}
                      className="bg-transparent font-black text-amber-300 focus:outline-none cursor-pointer f1-display"
                    >
                      <option value="MORNING" className="bg-[#0d0f15]">MORNING SESSION</option>
                      <option value="AFTERNOON" className="bg-[#0d0f15]">AFTERNOON SESSION</option>
                      <option value="EVENING" className="bg-[#0d0f15]">EVENING / SUNSET</option>
                      <option value="NIGHT" className="bg-[#0d0f15]">NIGHT FLOODLIGHTS</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-[11px] text-gray-300 flex-wrap">
                  <span>
                    <strong className="text-yellow-400 f1-display">{driverA}</strong> ({currentGrid[driverA]?.team}) vs{" "}
                    <strong className="text-cyan-400 f1-display">{driverB}</strong> ({currentGrid[driverB]?.team})
                  </span>
                  <span className="pl-3 border-l border-white/10 text-emerald-400 font-black f1-display">
                    FASTEST LAP: {telemetry.lapTime}
                  </span>
                  <span className="pl-3 border-l border-white/10 text-cyan-400 font-black f1-display">
                    LIVE DELTA: {liveDelta}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-amber-300/90">
                  <span>
                    <strong>3D ATTRACTION:</strong> {currentAttraction.name} (Hover 3D model on track for details)
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-4 flex items-center justify-center">
                <span className="[writing-mode:vertical-rl] text-[10px] font-black text-cyan-400 tracking-widest f1-display">
                  SESSION INFO
                </span>
              </div>
            )}
          </div>

          {/* Right Quick-Open AI Tab */}
          {!isAgentOpen && (
            <button
              type="button"
              onClick={() => setIsAgentOpen(true)}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#0d0f15]/95 hover:bg-red-600 text-white border-l border-t border-b border-red-500/50 rounded-l-2xl py-5 px-2.5 z-20 flex flex-col items-center gap-2 shadow-2xl transition-all group"
            >
              <ChevronLeft className="w-5 h-5 text-red-400 group-hover:text-white animate-bounce" />
              <Bot className="w-5 h-5 text-cyan-400 group-hover:text-white" />
              <span className="[writing-mode:vertical-rl] text-[10px] font-black tracking-widest uppercase f1-display">
                AI RACE ENGINEER
              </span>
            </button>
          )}

          {/* ── 2. COLLAPSIBLE LAP TELEMETRY SCRUBBER (WITH SIDE ARROW BUTTON) ── */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bg-[#0d0f15]/95 backdrop-blur-lg rounded-2xl border border-white/15 z-30 shadow-2xl transition-all duration-300 ${
              telemetryOpen ? "bottom-48" : "bottom-6"
            } ${scrubberOpen ? "w-[94%] max-w-4xl p-3.5" : "w-auto px-5 py-2"}`}
          >
            <button
              type="button"
              onClick={() => setScrubberOpen(!scrubberOpen)}
              className="absolute -right-3.5 top-1/2 -translate-y-1/2 bg-[#151a26] border border-cyan-400/60 text-cyan-300 p-1 rounded-full shadow-lg hover:bg-cyan-500 hover:text-black transition-colors z-40"
              title={scrubberOpen ? "Collapse Scrubber" : "Expand Scrubber"}
            >
              {scrubberOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            {scrubberOpen ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300 px-1 flex-wrap gap-2">
                  <span className="text-yellow-400 font-extrabold f1-display">
                    #{currentGrid[driverA]?.number} {driverA}
                  </span>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-gray-300 tracking-wider f1-display">
                      LAP TELEMETRY SCRUBBER ({Math.round(scrubProgress * 100)}%):
                    </span>
                    <select
                      value={selectedLap}
                      onChange={(e) => handleLapChange(e.target.value)}
                      className="bg-[#161b28] text-cyan-300 border border-cyan-500/50 rounded-lg px-2.5 py-1 text-xs font-black focus:outline-none cursor-pointer f1-display"
                    >
                      <option value="FASTEST">FASTEST FLYING LAP</option>
                      {availableLaps.map((lapNum) => (
                        <option key={lapNum} value={lapNum}>
                          LAP {lapNum} {lapNum === 1 ? "(FORMATION GRID START)" : `— ${selectedCircuit.toUpperCase()}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-cyan-400 font-extrabold f1-display">
                    #{currentGrid[driverB]?.number} {driverB}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.001"
                  value={scrubProgress}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setScrubProgress(val);
                    playbackRef.current.progress = val;
                  }}
                  className="w-full h-2 bg-[#1b202e] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2 rounded-lg bg-[#161a24] hover:bg-[#202738] border border-white/10 text-white transition-all"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Play className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (Number(selectedLap) === 1) {
                          startFormationGridLightsSequence();
                        } else {
                          playbackRef.current.progress = 0;
                          setScrubProgress(0);
                          setIsPlaying(true);
                        }
                      }}
                      className="p-2 rounded-lg bg-[#161a24] hover:bg-[#202738] border border-white/10 text-gray-300"
                      title="Restart Lap / Grid Launch"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLapChange(1)}
                      className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 text-[10px] font-black text-red-300 f1-display"
                    >
                      LAUNCH LAP 1 GRID START
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPlaybackSpeed(
                        playbackSpeed === 0.5 ? 1.0 : playbackSpeed === 1.0 ? 2.0 : 0.5
                      )
                    }
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#161a24] hover:bg-[#202738] border border-white/10 text-xs font-bold text-cyan-300 f1-display"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    {playbackSpeed.toFixed(1)}x PLAYBACK
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[11px] font-black text-cyan-400 f1-display whitespace-nowrap">
                <span>SCRUBBER ({Math.round(scrubProgress * 100)}%)</span>
              </div>
            )}
          </div>

          {/* ── 3. COLLAPSIBLE DRIVER TELEMETRY PANEL (WITH SIDE & TOP ARROW BUTTONS) ── */}
          <div
            className={`absolute bottom-0 left-0 right-0 border-t border-[#1f2430] bg-[#0a0c12]/98 backdrop-blur-xl px-4 py-3 z-30 shadow-2xl transition-all duration-300 ${
              telemetryOpen ? "translate-y-0" : "translate-y-[calc(100%-28px)]"
            }`}
          >
            {/* Top-Center Collapse Arrow Tab */}
            <button
              type="button"
              onClick={() => setTelemetryOpen(!telemetryOpen)}
              className="absolute left-1/2 -top-3.5 -translate-x-1/2 bg-[#151a26] border border-cyan-400/60 text-cyan-300 px-3 py-0.5 rounded-full shadow-lg hover:bg-cyan-500 hover:text-black transition-colors z-40 flex items-center gap-1 text-[10px] font-black f1-display"
              title={telemetryOpen ? "Collapse Driver Telemetry Panel" : "Expand Driver Telemetry Panel"}
            >
              {telemetryOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              <span>{telemetryOpen ? "HIDE TELEMETRY" : "DRIVER TELEMETRY"}</span>
            </button>

            {/* Side Arrow Collapse Button */}
            <button
              type="button"
              onClick={() => setTelemetryOpen(!telemetryOpen)}
              className="absolute right-4 -top-3.5 bg-[#151a26] border border-cyan-400/60 text-cyan-300 p-1 rounded-full shadow-lg hover:bg-cyan-500 hover:text-black transition-colors z-40"
              title={telemetryOpen ? "Collapse Driver Telemetry Panel" : "Expand Driver Telemetry Panel"}
            >
              {telemetryOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">
              {/* DRIVER A TELEMETRY CONSOLE */}
              <div className="bg-[#121621]/95 rounded-2xl p-3 border border-yellow-500/35 flex items-center gap-3 md:gap-4 shadow-lg">
                <div className="w-36 md:w-44 bg-[#0b0e15] rounded-xl p-2.5 border border-white/5 flex flex-col justify-between h-full shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-yellow-400 f1-display flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> #{currentGrid[driverA]?.number} {driverA}
                    </span>
                    <span className="text-[9px] text-gray-400 truncate max-w-[70px]">
                      {currentGrid[driverA]?.team}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span ref={speedRef} className="text-2xl md:text-3xl font-black text-white f1-display">
                      {telemetry.speed}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold f1-display">KM/H</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                    <span className="text-gray-300 font-bold">RPM: {telemetry.rpm}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black f1-display ${
                        telemetry.drs === "OPEN"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      DRS {telemetry.drs}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-around h-full py-1 space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-emerald-400 font-black f1-display">{driverA} THROTTLE</span>
                      <span className="text-white font-bold f1-display">{telemetry.throttle}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#080a0f] rounded-full overflow-hidden border border-emerald-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-75"
                        style={{ width: `${telemetry.throttle}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-red-500 font-black f1-display">{driverA} BRAKE</span>
                      <span className="text-white font-bold f1-display">{telemetry.brake}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#080a0f] rounded-full overflow-hidden border border-red-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-75"
                        style={{ width: `${telemetry.brake}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-16 md:w-20 bg-[#0b0e15] rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center h-full shrink-0">
                  <span className="text-[9px] text-gray-400 font-bold f1-display">GEAR</span>
                  <span className="text-3xl md:text-4xl font-black text-yellow-400 f1-display">{telemetry.gear}</span>
                </div>
              </div>

              {/* DRIVER B TELEMETRY CONSOLE */}
              <div className="bg-[#121621]/95 rounded-2xl p-3 border border-cyan-500/35 flex items-center gap-3 md:gap-4 shadow-lg">
                <div className="w-36 md:w-44 bg-[#0b0e15] rounded-xl p-2.5 border border-white/5 flex flex-col justify-between h-full shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-cyan-400 f1-display flex items-center gap-1">
                      <Gauge className="w-3.5 h-3.5" /> #{currentGrid[driverB]?.number} {driverB}
                    </span>
                    <span className="text-[9px] text-gray-400 truncate max-w-[70px]">
                      {currentGrid[driverB]?.team}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="text-2xl md:text-3xl font-black text-white f1-display">
                      {telemetry.speedB}
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold f1-display">KM/H</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                    <span className="text-gray-300 font-bold">RPM: {telemetry.rpmB}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black f1-display ${
                        telemetry.drsB === "OPEN"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      DRS {telemetry.drsB}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-around h-full py-1 space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-emerald-400 font-black f1-display">{driverB} THROTTLE</span>
                      <span className="text-white font-bold f1-display">{telemetry.throttleB}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#080a0f] rounded-full overflow-hidden border border-emerald-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-75"
                        style={{ width: `${telemetry.throttleB}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-red-500 font-black f1-display">{driverB} BRAKE</span>
                      <span className="text-white font-bold f1-display">{telemetry.brakeB}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-[#080a0f] rounded-full overflow-hidden border border-red-500/30">
                      <div
                        className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-75"
                        style={{ width: `${telemetry.brakeB}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-16 md:w-20 bg-[#0b0e15] rounded-xl p-2 border border-white/5 flex flex-col items-center justify-center h-full shrink-0">
                  <span className="text-[9px] text-gray-400 font-bold f1-display">GEAR</span>
                  <span className="text-3xl md:text-4xl font-black text-cyan-400 f1-display">{telemetry.gearB}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BIG "COMPARE TELEMETRY" ENGINEERING POP-UP MODAL ── */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-6xl bg-[#0b0e17] border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_80px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-6 py-4 bg-[#101420] border-b border-white/10 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <GitCompare className="w-6 h-6 text-red-500" />
                <div>
                  <h2 className="text-lg font-black text-white f1-display">
                    PITWALL TELEMETRY COMPARISON — {selectedSeason} {selectedCircuit.toUpperCase()} GP ({selectedSession})
                  </h2>
                  <p className="text-xs text-gray-400">
                    Real-Time FastF1 Duel Analysis: <strong className="text-yellow-400">{currentGrid[driverA]?.name} ({driverA})</strong> vs{" "}
                    <strong className="text-cyan-400">{currentGrid[driverB]?.name} ({driverB})</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-[#171c2b] border border-cyan-400/50 px-3 py-1.5 rounded-xl">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-gray-300 f1-display">SELECT LAP:</span>
                  <select
                    value={selectedLap}
                    onChange={(e) => handleLapChange(e.target.value)}
                    className="bg-[#0d1017] text-cyan-300 font-black text-xs px-2.5 py-1 rounded-lg border border-cyan-500/30 focus:outline-none cursor-pointer f1-display"
                  >
                    <option value="FASTEST">FASTEST SESSION LAP</option>
                    {availableLaps.map((ln) => (
                      <option key={ln} value={ln}>
                        LAP {ln} — {selectedCircuit.toUpperCase()} GP
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCompareModal(false)}
                  className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/40"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-[#121723] border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-xs font-black text-cyan-400 f1-display flex items-center gap-1.5">
                      <Flag className="w-4 h-4" /> 1. REAL GAP & LAP PACE
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold f1-display">
                      {comparisonData?.active_lap_label || (selectedLap === "FASTEST" ? "FASTEST LAP" : `LAP ${selectedLap}`)}
                    </span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between items-center bg-[#0b0e16] p-2.5 rounded-xl">
                      <span className="text-gray-400">Lap Time ({driverA} vs {driverB}):</span>
                      <span className="font-black text-white f1-display">
                        {comparisonData?.lap_time_a || telemetry.lapTime} / {comparisonData?.lap_time_b || "1:26.104"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[#0b0e16] p-2.5 rounded-xl">
                      <span className="text-gray-400">Lap Delta / On-Track Gap:</span>
                      <span className="font-black text-emerald-400 f1-display">
                        {comparisonData ? `${comparisonData.delta_sec >= 0 ? "+" : ""}${comparisonData.delta_sec}s` : liveDelta}
                        {comparisonData?.on_track_gap_sec ? ` (Track Gap: ${comparisonData.on_track_gap_sec}s)` : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-[#0b0e16] p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] text-gray-400 f1-display">SECTOR 1</div>
                        <div className="text-yellow-400 font-bold">{statsA.s1}</div>
                        <div className="text-cyan-400 font-bold">{statsB.s1}</div>
                      </div>
                      <div className="bg-[#0b0e16] p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] text-gray-400 f1-display">SECTOR 2</div>
                        <div className="text-yellow-400 font-bold">{statsA.s2}</div>
                        <div className="text-cyan-400 font-bold">{statsB.s2}</div>
                      </div>
                      <div className="bg-[#0b0e16] p-2 rounded-lg border border-white/5">
                        <div className="text-[10px] text-gray-400 f1-display">SECTOR 3</div>
                        <div className="text-yellow-400 font-bold">{statsA.s3}</div>
                        <div className="text-cyan-400 font-bold">{statsB.s3}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121723] border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-xs font-black text-amber-400 f1-display flex items-center gap-1.5">
                      <Disc className="w-4 h-4" /> 2. TYRE USAGE & DEGRADATION
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">PIRELLI TELEMETRY</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { drv: driverA, color: "text-yellow-400", st: statsA },
                      { drv: driverB, color: "text-cyan-400", st: statsB }
                    ].map(({ drv, color, st }) => (
                      <div key={drv} className="bg-[#0b0e16] p-3 rounded-xl border border-white/5 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className={`font-black f1-display ${color}`}>{drv} COMPOUND:</span>
                          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-black f1-display">
                            {st.compound} ({st.tyre_life_laps} LAPS OLD)
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>Estimated Tread Grip Remaining:</span>
                          <span className="text-emerald-400 font-bold">{st.tyre_health_pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400"
                            style={{ width: `${st.tyre_health_pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#121723] border border-red-500/30 rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                    <span className="text-xs font-black text-red-400 f1-display flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> 3. PIT STOPS & STINT STRATEGY
                    </span>
                    <span className="text-[10px] text-gray-400 font-bold">PITLANE LOG</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { drv: driverA, color: "text-yellow-400", st: statsA, topSpd: comparisonData?.top_speed_a || 334.2 },
                      { drv: driverB, color: "text-cyan-400", st: statsB, topSpd: comparisonData?.top_speed_b || 336.1 }
                    ].map(({ drv, color, st, topSpd }) => (
                      <div key={drv} className="bg-[#0b0e16] p-3 rounded-xl border border-white/5 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className={`font-black f1-display ${color}`}>{drv} PIT STOPS:</span>
                          <span className="font-black text-white f1-display">
                            {st.pit_stops} STOP(S) • STINT #{st.stint}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>Lap Status:</span>
                          <span className="text-cyan-300 font-bold">{st.pit_status}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-gray-400">
                          <span>Speed Trap Peak:</span>
                          <span className="text-white font-bold f1-display">{topSpd} KM/H</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#121723] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-white f1-display">
                    FULL-LAP SPEED & PEDAL TELEMETRY WAVEFORM ({driverA} YELLOW vs {driverB} CYAN)
                  </span>
                  <span className="text-xs text-gray-400">
                    0% (Start Line) → 100% (Finish Line)
                  </span>
                </div>
                <div className="h-48 w-full bg-[#080a10] rounded-xl p-3 border border-white/10">
                  <svg viewBox="0 0 800 180" className="w-full h-full overflow-visible">
                    <line x1="0" y1="45" x2="800" y2="45" stroke="#1f2430" strokeDasharray="4" />
                    <line x1="0" y1="90" x2="800" y2="90" stroke="#1f2430" strokeDasharray="4" />
                    <line x1="0" y1="135" x2="800" y2="135" stroke="#1f2430" strokeDasharray="4" />
                    {comparisonData?.chart_points && (
                      <>
                        <polyline
                          fill="none"
                          stroke="#facc15"
                          strokeWidth="3"
                          points={comparisonData.chart_points
                            .map(
                              (p, i) =>
                                `${i * (800 / Math.max(1, comparisonData.chart_points.length - 1))},${
                                  175 - (p.speed_a / 365) * 165
                                }`
                            )
                            .join(" ")}
                        />
                        <polyline
                          fill="none"
                          stroke="#00f0ff"
                          strokeWidth="3"
                          points={comparisonData.chart_points
                            .map(
                              (p, i) =>
                                `${i * (800 / Math.max(1, comparisonData.chart_points.length - 1))},${
                                  175 - (p.speed_b / 365) * 165
                                }`
                            )
                            .join(" ")}
                        />
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE 3D WORLD GLOBE MODAL (WITH SEGMENTED USA & ITALY) ── */}
      {showGlobeModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6">
          <div className="w-full max-w-6xl bg-[#0b0e17] border-2 border-cyan-400/50 rounded-3xl shadow-[0_0_90px_rgba(6,182,212,0.3)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[92vh]">
            <div className="lg:col-span-6 relative bg-[#060913] min-h-[360px] md:min-h-[460px] flex flex-col items-center justify-center border-r border-white/10">
              <div ref={globeCanvasRef} className="w-full h-[360px] md:h-[480px] cursor-pointer" />
              <div className="absolute top-4 left-4 bg-black/70 px-3 py-1.5 rounded-xl border border-cyan-500/40 text-xs text-cyan-300 font-bold f1-display">
                INTERACTIVE 3D F1 GLOBE • CLICK ANY HIGHLIGHTED PIN
              </div>
            </div>

            <div className="lg:col-span-6 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar max-h-[88vh]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div>
                    <h2 className="text-lg font-black text-white f1-display">
                      SELECT HIGHLIGHTED F1 HOST COUNTRY & CIRCUIT
                    </h2>
                    <p className="text-xs text-gray-400">
                      USA is divided into 3 regional segments (Las Vegas, Austin, Miami) & Italy into 2 segments (Monza, Imola).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGlobeModal(false)}
                    className="p-2 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/40"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-4 space-y-2">
                  <div className="text-[11px] font-black text-cyan-400 f1-display">
                    UNITED STATES — 3 DISTINCT GRAND PRIX SEGMENTS:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {GLOBE_F1_LOCATIONS.filter((l) => l.id.startsWith("USA_")).map((loc) => (
                      <button
                        type="button"
                        key={loc.id}
                        onClick={() => {
                          setSelectedCircuit(loc.circuit);
                          setShowGlobeModal(false);
                        }}
                        className="p-2.5 rounded-xl bg-[#141a29] hover:bg-cyan-600/25 border border-cyan-400/50 text-left transition-all"
                      >
                        <div className="text-[9px] font-black text-cyan-300 f1-display">{loc.segmentBadge}</div>
                        <div className="text-xs font-black text-white f1-display mt-0.5">{loc.gpTitle}</div>
                        <div className="text-[10px] text-amber-300 mt-0.5">{loc.attraction}</div>
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] font-black text-emerald-400 f1-display pt-2">
                    ITALY — 2 DISTINCT GRAND PRIX SEGMENTS:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {GLOBE_F1_LOCATIONS.filter((l) => l.id.startsWith("ITALY_")).map((loc) => (
                      <button
                        type="button"
                        key={loc.id}
                        onClick={() => {
                          setSelectedCircuit(loc.circuit);
                          setShowGlobeModal(false);
                        }}
                        className="p-2.5 rounded-xl bg-[#141a29] hover:bg-emerald-600/25 border border-emerald-400/50 text-left transition-all"
                      >
                        <div className="text-[9px] font-black text-emerald-300 f1-display">{loc.segmentBadge}</div>
                        <div className="text-xs font-black text-white f1-display mt-0.5">{loc.gpTitle}</div>
                        <div className="text-[10px] text-amber-300 mt-0.5">{loc.attraction}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[11px] font-black text-gray-300 f1-display mb-2">
                  ALL HIGHLIGHTED F1 CHAMPIONSHIP HOST COUNTRIES:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto no-scrollbar pr-1">
                  {GLOBE_F1_LOCATIONS.filter(
                    (l) => !l.id.startsWith("USA_") && !l.id.startsWith("ITALY_")
                  ).map((loc) => (
                    <button
                      type="button"
                      key={loc.id}
                      onClick={() => {
                        setSelectedCircuit(loc.circuit);
                        setShowGlobeModal(false);
                      }}
                      className="p-2.5 rounded-xl bg-[#121622] hover:bg-red-600/20 border border-white/10 hover:border-red-500/50 text-left transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white f1-display">{loc.country}</span>
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: loc.color }} />
                      </div>
                      <div className="text-[11px] text-cyan-300 font-semibold">{loc.gpTitle}</div>
                      <div className="text-[10px] text-gray-400 truncate">{loc.attraction}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SLIDE-OVER EXPANDABLE AI RACE ENGINEER DRAWER ── */}
      <div
        className={`fixed top-0 right-0 h-screen bg-[#0b0d13]/95 backdrop-blur-2xl border-l border-cyan-500/30 z-50 flex flex-col shadow-[-20px_0_60px_rgba(0,0,0,0.85)] transition-all duration-300 ease-in-out ${
          isAgentOpen
            ? isAgentMaximized
              ? "w-full md:w-[860px]"
              : "w-full sm:w-[540px]"
            : "w-full sm:w-[540px] translate-x-full pointer-events-none"
        }`}
      >
        <div className="h-14 border-b border-[#1f2430] flex items-center justify-between px-6 bg-[#0f121a]">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-sm font-extrabold text-white f1-display">
              PITWALL AI RACE ENGINEER ({selectedSeason} {selectedSession})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 rounded-lg bg-[#151821] text-gray-300 hover:text-white"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 rounded-lg bg-[#151821] text-emerald-400"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsAgentMaximized(!isAgentMaximized)}
              className="p-2 rounded-lg bg-[#151821] text-cyan-400"
            >
              {isAgentMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setIsAgentOpen(false)}
              className="p-2 rounded-lg bg-red-500/10 text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showVoiceSettings && (
          <div className="p-4 bg-[#121621] border-b border-cyan-500/30 space-y-3 text-xs">
            <span className="font-bold text-cyan-400 f1-display">VOICE SYNTHESIS CONFIGURATION</span>
            <div>
              <label className="text-[11px] text-gray-400 block mb-1">
                Engineer Voice Profile
              </label>
              <select
                value={selectedVoiceURI}
                onChange={(e) => setSelectedVoiceURI(e.target.value)}
                className="w-full bg-[#161a24] border border-[#232838] rounded-lg p-2 text-white"
              >
                {availableVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div ref={chatScrollRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border border-white/10 text-sm bg-[#151821]/90 shadow-xl space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-red-400 text-xs f1-display">
                  {m.sender} [{m.specialist}]
                </div>
                {m.sender !== "DRIVER" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(m.text);
                        alert("Response copied to clipboard!");
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/10 text-gray-300 text-[10px] font-black f1-display transition-all"
                    >
                      COPY
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadRaceReportPDF(
                          `${selectedSeason} ${selectedCircuit} GP — ${m.specialist}`,
                          m.text
                        )
                      }
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-400/50 text-cyan-300 text-[10px] font-black f1-display transition-all"
                    >
                      EXPORT PDF REPORT
                    </button>
                  </div>
                )}
              </div>
              <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="bg-[#151821] p-4 rounded-2xl border border-cyan-400/40 text-sm flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="text-gray-300">Analyzing FastF1 telemetry channels...</span>
            </div>
          )}
        </div>

        <form
          onSubmit={sendRadioMessage}
          className="p-5 border-t border-[#1f2430] bg-[#0f121a] flex gap-3 items-end"
        >
          <button
            type="button"
            onClick={togglePushToTalk}
            className={`p-4 rounded-2xl border ${
              isListening
                ? "bg-red-600 text-white animate-pulse"
                : "bg-[#161a24] text-gray-300"
            }`}
          >
            {isListening ? <Mic className="w-5 h-5 animate-bounce" /> : <MicOff className="w-5 h-5" />}
          </button>
          <textarea
            rows={3}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendRadioMessage(e);
              }
            }}
            placeholder={`Ask anything about F1 or ${selectedSeason} ${selectedCircuit} (${selectedSession}) telemetry...`}
            className="flex-1 bg-[#151924] border border-[#2a3142] rounded-2xl p-4 text-sm text-white resize-none focus:outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
