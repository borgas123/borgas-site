// The product content model, per the website brief (11).
//
// LIFECYCLE AND ORDERING ARE SEPARATE FIELDS. "Complete" says what the
// hardware is; "inquiry" says what a visitor can do about it. Conflating them
// is how a finished personal build turns into an implied stock promise.
//
// publish=false BY DEFAULT for anything not explicitly cleared. The public
// pages, menus, filters and contact options are all generated from
// publicProducts(), which filters drafts out at BUILD time and copies only an
// allowlist of fields - so a draft cannot leak into generated HTML, JSON or a
// client bundle by any route. Internal notes stay in the private content
// register, not here.
//
// Every claim below is checked against the product repositories. Where a
// capability is planned rather than shipped it is marked, and where a fact is
// unknown the row is absent rather than guessed.

export type Family = "racing" | "diagnostics" | "software";

export type Lifecycle =
  | "Complete"          // hardware finished and validated
  | "Established"       // in use, iterating
  | "Prototype"         // working hardware, validation ongoing
  | "In development";   // no shippable hardware yet

export type Ordering =
  | "inquiry"           // Ask about availability - no confirmed sale terms
  | "buy"               // real checkout exists (none today)
  | "none";             // development only

export interface Capability {
  claim: string;
  status: "verified" | "planned";
}

export interface Spec { label: string; value: string; }

export interface Resource {
  title: string;
  href: string;
  kind: "software" | "firmware" | "manual" | "guide";
  note?: string;
}

export interface Product {
  id: string;
  slug: string;
  family: Family;
  code: string;
  name: string;            // human name beside the code
  descriptor: string;      // one line: what it is
  summary: string;         // two or three sentences
  audience: string;        // who it is for, in plain language
  lifecycle: Lifecycle;
  lifecycleNote?: string;
  ordering: Ordering;
  capabilities: Capability[];
  compatibility?: string[];
  specs: Spec[];
  included?: string[];
  gettingStarted?: string[];
  resources: Resource[];
  images: { src: string; alt: string; caption: string }[];
  publish: boolean;
  featured?: boolean;      // leads its family; BRC-02 leads racing
}

const all: Product[] = [
  // ---------------------------------------------------------------------
  {
    id: "brc-02", slug: "brc-02", family: "racing",
    code: "BRC-02", name: "Racing Dashboard",
    descriptor: "Sim racing dashboard and LED system, driven live by the simulator.",
    summary:
      "BRC-02 is a colour dashboard with RPM and shift lighting, session flags and lap timing " +
      "for sim racing. It takes live telemetry from the simulator over USB through SimHub, so " +
      "what it shows is what the car is doing.",
    audience:
      "Sim racers who want a physical dash and shift lights in front of the wheel rather than " +
      "on the monitor. It sits on a desk or a rig and connects to the PC running the simulator.",
    lifecycle: "Complete",
    lifecycleNote: "Hardware build complete and validated on track in iRacing.",
    ordering: "inquiry",
    capabilities: [
      { claim: "320×240 colour display with ten selectable layouts, chosen live from the desktop app", status: "verified" },
      { claim: "RPM bars and shift lighting on three LED bars, with a per-LED trigger ladder set as a percentage of each car's rev limit", status: "verified" },
      { claim: "Session flags on two 5×5 LED matrices, with spotter calls lighting the side a car is on", status: "verified" },
      { claim: "Current and best lap on two six-digit displays", status: "verified" },
      { claim: "Standby screen when no telemetry is arriving, and a dark mode after five minutes idle", status: "verified" },
      { claim: "Windows configurator for LED colours, the RPM ladder and layout choice, applied live", status: "verified" },
    ],
    compatibility: [
      "A Windows PC running SimHub, connected by USB; mounting and package contents confirmed per build",
      "iRacing: session flags, spotter and lap timing; validated on track",
      "Assetto Corsa Competizione: flags translated in the SimHub formula",
      "Other simulators: compatibility depends on the telemetry exposed through SimHub; confirm your intended game before ordering",
    ],
    specs: [
      { label: "Display", value: "320 × 240 colour LCD, ten layouts" },
      { label: "RPM / shift lighting", value: "3 addressable LED bars" },
      { label: "Flag matrices", value: "2 × 5×5 addressable LED panels" },
      { label: "Lap timing", value: "2 × 6-digit LED displays (current and best)" },
      { label: "Connection", value: "USB to the PC running SimHub" },
      { label: "Power", value: "5 V, 3 A external supply" },
      { label: "Controller", value: "ESP32-S3" },
    ],
    gettingStarted: [
      "Connect the 5 V supply, then the USB cable to the PC.",
      "In SimHub, add a serial device on the dashboard's COM port using the supplied formula.",
      "Open the BORGAS configurator to choose a layout and set LED colours.",
      "Start the simulator. The dash leaves its standby screen when telemetry arrives.",
    ],
    resources: [],
    images: [
      {"src":"/images/brc-02/product-render-v1.webp","alt":"BRC-02 navy racing dashboard with cyan and violet LEDs and red and green lap displays, without a stand","caption":"Computer-rendered illustration based on the actual build, shown in the BORGAS color scheme. Demonstration lighting and display."},

      { src: "/images/brc-02/layout-rev-ring.png", alt: "BRC-02 rev-ring layout: gear inside a tachometer ring, with water, oil, fuel and lap readouts around it", caption: "Rev Ring layout. Display render generated from the dashboard firmware — demonstration data." },
      { src: "/images/brc-02/layout-twin-dials.png", alt: "BRC-02 twin-dials layout", caption: "Twin Dials layout. Display render — demonstration data." },
      { src: "/images/brc-02/layout-minimal-hud.png", alt: "BRC-02 minimal HUD layout", caption: "Minimal HUD layout. Display render — demonstration data." },
      { src: "/images/brc-02/layout-card-grid.png", alt: "BRC-02 card-grid layout", caption: "Card Grid layout. Display render — demonstration data." },
    ],
    publish: true, featured: true,
  },

  // ---------------------------------------------------------------------
  {
    id: "brc-fl", slug: "brc-fl", family: "racing",
    code: "BRC-FL", name: "Flag Panel",
    descriptor: "Companion LED flag panel for the BRC-02.",
    summary:
      "BRC-FL is a stand-alone flag panel: two 8×8 LED matrices on their own controller, showing " +
      "the same session flags as the BRC-02 from the same telemetry feed. It goes where the dash " +
      "cannot, in the corner of your eye.",
    audience: "BRC-02 owners who want the flags larger, or somewhere other than on the dash.",
    lifecycle: "Complete",
    ordering: "inquiry",
    capabilities: [
      { claim: "Two chained 8×8 LED panels showing session flags in the same priority order as the BRC-02", status: "verified" },
      { claim: "Fed by the same SimHub telemetry as the dash, as a second serial device", status: "verified" },
      { claim: "Colours, brightness and panel orientation set from the BORGAS configurator", status: "verified" },
    ],
    compatibility: [
      "Requires the same SimHub setup as the BRC-02; runs as a second serial device on its own COM port",
      "Own 5 V supply",
    ],
    specs: [
      { label: "Panels", value: "2 × 8×8 addressable LED matrices" },
      { label: "Connection", value: "USB to the PC running SimHub" },
      { label: "Power", value: "5 V external supply" },
    ],
    resources: [],
    images: [
      {"src":"/images/brc-fl/product-render-v1.webp","alt":"BRC-FL square 8 by 8 flag panel in navy with violet and cyan rim lighting","caption":"Computer-rendered illustration based on the actual build, shown in the BORGAS color scheme. One flag module shown."},
],
    publish: true,
  },

  // ---------------------------------------------------------------------
  {
    id: "bfd-01", slug: "bfd-01", family: "diagnostics",
    code: "BFD-01", name: "Field Diagnostic Instrument",
    descriptor: "Handheld measurement and signal capture for field troubleshooting.",
    summary: "BFD-01 is a handheld instrument for field-service troubleshooting. It combines voltage, resistance and continuity measurements with signal capture and event history to help investigate faults from outside the machine.",
    audience:
      "Field service technicians working on industrial equipment, where the built-in diagnostics say " +
      "something is wrong but not what or where.",
    lifecycle: "Established",
    lifecycleNote: "In use and updated regularly. Firmware and software updates through the BORGAS Device Manager.",
    ordering: "inquiry",
    capabilities: [
      { claim: "DC voltage, resistance and continuity measurement on a 480×320 colour display", status: "verified" },
      { claim: "FaultScope: live capture of a signal over time, with pre-trigger history so the moment before a fault is kept", status: "verified" },
      { claim: "Event log of state changes with timestamps", status: "verified" },
      { claim: "Built-in Wi-Fi access point with a browser interface for the same data", status: "verified" },
      { claim: "Firmware and application updates over USB through the BORGAS Device Manager, using the matching published release", status: "verified" },
    ],
    compatibility: [
      "BORGAS Device Manager on Windows for updates, backup and restore",
    ],
    specs: [
      { label: "Display", value: "480 × 320 colour LCD, five colour themes" },
      { label: "Voltage input", value: "DC, 100 V design range" },
      { label: "Resistance / continuity", value: "Single channel, audible continuity" },
      { label: "Connectivity", value: "USB; Wi-Fi access point with web interface" },
      { label: "Controls", value: "Rotary encoder and two buttons" },
      { label: "Controller", value: "ESP32" },
      { label: "Hardware revision", value: "Rev A" },
    ],
    resources: [
      { title: "BORGAS Device Manager and firmware releases", href: "https://github.com/borgas123/borgas-firmware", kind: "software",
        note: "Published releases with checksums. Install through the Device Manager rather than by hand." },
    ],
    images: [
      { src: "/images/bfd-01/product-render-v1.webp", alt: "BFD-01 in an open navy case with violet and cyan controls, USB-C port and five pairs of red and black terminals", caption: "Computer-rendered illustration based on the actual build, shown in the BORGAS color scheme." },

      { src: "/images/bfd-01/faultscope.png", alt: "BFD-01 FaultScope screen showing the Any Event trigger and pre-trigger capture settings", caption: "FaultScope. Instrument interface example." },
      { src: "/images/bfd-01/event-log.png", alt: "BFD-01 event log", caption: "Event log. Instrument interface example." },
    ],
    publish: true, featured: true,
  },

  // ---------------------------------------------------------------------
  {
    id: "bps-01", slug: "bps-01", family: "diagnostics",
    code: "BPS-01", name: "Power System",
    descriptor: "Rechargeable battery and power system for BORGAS diagnostic equipment.",
    summary:
      "BPS-01 is a rechargeable battery pack with a regulated output for running BORGAS diagnostic " +
      "equipment away from mains power. Its own display shows battery voltage, an estimated charge " +
      "level and status, so you know what you have left before you walk out to the machine.",
    audience: "Technicians using a BFD-01 in the field without a nearby outlet.",
    lifecycle: "Prototype",
    lifecycleNote: "Working prototype in validation. Design and capacity figures may change before release.",
    ordering: "none",
    capabilities: [
      { claim: "Powers a BFD-01 through normal operation, including Wi-Fi", status: "verified" },
      { claim: "Battery voltage, estimated charge and status on its own display", status: "verified" },
      { claim: "USB-C charging; regulated 5 V output", status: "verified" },
    ],
    specs: [
      { label: "Battery", value: "3.7 V lithium, 3000 mAh (prototype)" },
      { label: "Charge input", value: "USB-C" },
      { label: "Output", value: "5 V regulated, USB-A" },
      { label: "Display", value: "1.3-inch 240 × 240 colour LCD" },
      { label: "Hardware revision", value: "Rev A prototype" },
    ],
    resources: [],
    images: [
      { src: "/images/bps-01/product-render-v1.webp", alt: "BPS-01 navy battery supply with a square display and violet power button", caption: "Computer-rendered illustration based on the actual build, shown in the BORGAS color scheme." },
],
    publish: true,
  },

  // ---------------------------------------------------------------------
  // SOFTWARE. Its own page (src/pages/products/asset-creator.astro) carries the
  // download, price and requirements from src/data/bac.ts; this entry lists it
  // in the catalog, the Software family, contact and support.
  {
    id: "bac", slug: "asset-creator", family: "software",
    code: "BAC", name: "Asset Creator",
    descriptor: "Four reference images in, a finished 3D game asset out, on your own PC.",
    summary:
      "BORGAS Asset Creator turns Front, Back, Left and Right reference images into a textured 3D model " +
      "on your own NVIDIA graphics card, then cleans it up, rigs it, checks it and exports an Unreal Engine 5 " +
      "package. Your images and models never leave your computer.",
    audience:
      "Game developers and 3D artists on Windows who want finished, engine-ready assets from concept views " +
      "without a subscription or cloud credits.",
    lifecycle: "Established",
    lifecycleNote: "Released and updated regularly. Version 1.3 and later update themselves from inside the app.",
    ordering: "inquiry",
    capabilities: [
      { claim: "Textured 3D models from four reference views, generated locally on an NVIDIA GPU", status: "verified" },
      { claim: "Four candidates from different seeds in one run, compared side by side; every result saved with its seed and settings", status: "verified" },
      { claim: "Cleanup, triangle budgets, LOD0-LOD3 and baked normal maps", status: "verified" },
      { claim: "Automatic rigging for humanoid characters and standing quadrupeds, and rigid rigs for props with a marked moving part", status: "verified" },
      { claim: "Quality checks for geometry, UVs, materials, textures, rigs and LODs, each with a plain-language fix", status: "verified" },
      { claim: "One-click Unreal Engine 5 package with FBX, OBJ and GLB, textures, LODs and import notes", status: "verified" },
      { claim: "With Unreal Engine 5 installed: automatic import check, UE5 mannequin retarget check and a signed-off pose review before an asset is marked Game ready", status: "verified" },
    ],
    compatibility: [
      "Windows 10 or 11, 64-bit, with an NVIDIA (CUDA) graphics card",
      "A free Hugging Face account with access to Meta's DINOv3 model, approved by Meta",
      "Unreal Engine 5 is optional and only needed for the automatic Unreal checks",
    ],
    specs: [
      { label: "Platform", value: "Windows 10 / 11, 64-bit" },
      { label: "Graphics", value: "NVIDIA GPU; 16 GB recommended, tested on RTX 4070 Ti SUPER" },
      { label: "Exports", value: "FBX, OBJ, GLB with textures and LOD0-LOD3" },
      { label: "Engine target", value: "Unreal Engine 5" },
    ],
    resources: [],
    images: [
      { src: "/images/bac/app-preview.webp", alt: "BORGAS Asset Creator Review screen showing a generated, textured wood-handled axe with 238,708 triangles and 4096-pixel textures, with the workflow steps in the sidebar", caption: "BAC Review screen with a model generated by BAC from four reference images. Actual application screenshot." },
      { src: "/images/bac/model-cottage.webp", alt: "Moss-covered stone cottage with a slate roof and chimney, generated by BAC", caption: "Cottage. Generated by BAC, 248,795 triangles." },
      { src: "/images/bac/model-well.webp", alt: "Overgrown stone well with a wooden roof, bucket and hanging charms, generated by BAC", caption: "Well. Generated by BAC, 248,775 triangles." },
      { src: "/images/bac/model-wolf.webp", alt: "Grey wolf standing side-on, generated by BAC", caption: "Wolf. Generated by BAC, 245,774 triangles." },
      { src: "/images/bac/model-hammer.webp", alt: "Steel war hammer with a leather-wrapped wooden handle, generated by BAC", caption: "War hammer. Generated by BAC, 249,066 triangles." },
    ],
    publish: true, featured: true,
  },

  // ---------------------------------------------------------------------
  // DRAFTS. Present in the model so the register can point at them and the
  // build can prove they are excluded; absent from every public output.
  {
    id: "brc-01", slug: "brc-01", family: "racing",
    code: "BRC-01", name: "RPM Light",
    descriptor: "The predecessor to the BRC-02.",
    summary: "", audience: "", lifecycle: "Established", ordering: "none",
    capabilities: [], specs: [], resources: [], images: [],
    publish: false,   // superseded by BRC-02; support state not established
  },
  {
    id: "bfd-02", slug: "bfd-02", family: "diagnostics",
    code: "BFD-02", name: "",
    descriptor: "", summary: "", audience: "", lifecycle: "In development", ordering: "none",
    capabilities: [], specs: [], resources: [], images: [],
    publish: false,   // public development scope not yet reviewed
  },
  {
    id: "bsl-01", slug: "bsl-01", family: "diagnostics",
    code: "BSL-01", name: "SignalLink",
    descriptor: "", summary: "", audience: "", lifecycle: "In development", ordering: "none",
    capabilities: [], specs: [], resources: [], images: [],
    publish: false,   // active development; public scope not yet reviewed
  },
];

// THE ONLY EXPORT PAGES MAY READ. Filters drafts, and is the single place
// the publish rule lives.
export function publicProducts(): Product[] {
  const visible = all.filter((p) => p.publish);
  const slugs = new Set<string>();
  for (const p of visible) {
    if (!p.slug || !p.name || !p.descriptor || !p.summary || !p.audience) throw new Error("Incomplete public product: " + p.id);
    if (slugs.has(p.slug)) throw new Error("Duplicate product slug: " + p.slug);
    slugs.add(p.slug);
    if (p.ordering === "buy") throw new Error("Commerce is not configured: " + p.id);
    for (const r of p.resources) if (!/^https:\/\//.test(r.href)) throw new Error("Invalid public resource: " + r.title);
  }
  return visible.map(({id,slug,family,code,name,descriptor,summary,audience,lifecycle,lifecycleNote,ordering,capabilities,compatibility,specs,included,gettingStarted,resources,images,publish,featured}) => ({id,slug,family,code,name,descriptor,summary,audience,lifecycle,lifecycleNote,ordering,capabilities,compatibility,specs,included,gettingStarted,resources,images,publish,featured}));
}

export function productBySlug(slug: string): Product | undefined {
  return publicProducts().find((p) => p.slug === slug);
}

export function byFamily(family: Family): Product[] {
  const list = publicProducts().filter((p) => p.family === family);
  // The featured product leads; the rest keep declared order.
  return [...list.filter((p) => p.featured), ...list.filter((p) => !p.featured)];
}

export const families: Record<Family, { name: string; slug: string; blurb: string }> = {
  racing: {
    name: "Racing Systems",
    slug: "/racing/",
    blurb: "Dashboards and signalling hardware for sim racing, driven live from the simulator.",
  },
  diagnostics: {
    name: "Diagnostic Systems",
    slug: "/diagnostics/",
    blurb: "Instruments for field-service troubleshooting of industrial equipment: external measurement and guided tests that find what the machine's own diagnostics cannot.",
  },
  software: {
    name: "Software",
    slug: "/software/",
    blurb: "Desktop tools that run on your own computer. BORGAS Asset Creator turns reference images into finished 3D game assets.",
  },
};

export const lifecycleLabel: Record<Lifecycle, { text: string; tone: "positive" | "pending" | "neutral" }> = {
  "Complete":       { text: "Complete",       tone: "positive" },
  "Established":    { text: "Established",      tone: "positive" },
  "Prototype":      { text: "Prototype",      tone: "pending" },
  "In development": { text: "In development", tone: "pending" },
};

export const orderingLabel: Record<Ordering, string> = {
  inquiry: "Ask about availability",
  buy: "Buy",
  none: "Ask about this project",
};
