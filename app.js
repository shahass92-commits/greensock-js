import { gsap } from "./esm/index.js";
import ScrollTrigger from "./esm/ScrollTrigger.js";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function buildFlightSequence() {
  const flight = document.querySelector(".scene-flight");
  if (!flight) return;
  const layers = gsap.utils.toArray(".flight-layer", flight);
  const dockLinks = gsap.utils.toArray(".flight-dock a", flight);
  const altitudeEl = flight.querySelector("[data-altitude]");
  const altitudeStateEl = flight.querySelector("[data-altitude-state]");
  const altitude = { value: 11000 };
  const hold = 1; // timeline units each landmark stays on screen

  flight.classList.add("is-cinematic");

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: flight,
      start: "top top",
      end: () => "+=" + window.innerHeight * layers.length * 1.4,
      pin: true,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const t = self.progress * tl.duration();
        const active = Math.min(layers.length - 1, Math.floor(t / hold + 0.15));
        dockLinks.forEach((link, i) => {
          link.style.setProperty("--p", gsap.utils.clamp(0, 1, (t - i * hold) / hold));
          if (i === active) link.setAttribute("aria-current", "step");
          else link.removeAttribute("aria-current");
        });
      }
    }
  });

  // Opening frame: the logo lockup lifts away as the descent begins.
  tl.to(".flight-intro", { autoAlpha: 0, scale: 0.86, y: -40, duration: 0.35, ease: "power2.in" }, 0.05);

  layers.forEach((layer, i) => {
    const at = i * hold;
    const img = layer.querySelector("img");
    const caption = layer.querySelector(".flight-caption");
    tl.addLabel("L" + (i + 1), at);

    // Slow push-in, like the aircraft closing on each landmark.
    tl.fromTo(img, { scale: 1.24, xPercent: i % 2 ? 2 : -2 }, { scale: 1.02, xPercent: 0, duration: hold + 0.3 }, Math.max(0, at - 0.3));

    if (i > 0) {
      // Porthole iris reveal of the next landmark.
      tl.fromTo(layer, { clipPath: "circle(0% at 50% 48%)" }, { clipPath: "circle(78% at 50% 48%)", duration: 0.45, ease: "power2.inOut" }, at - 0.3);
      tl.fromTo(caption, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, at);
    } else {
      tl.fromTo(caption, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.3);
    }
    if (i < layers.length - 1) {
      tl.to(caption, { autoAlpha: 0, y: -40, duration: 0.2, ease: "power2.in" }, at + hold * 0.72);
    }
  });

  const total = layers.length * hold;
  tl.to(altitude, {
    value: 0,
    duration: total - hold * 0.4,
    ease: "power1.in",
    onUpdate: () => {
      const meters = Math.round(altitude.value);
      altitudeEl.textContent = meters.toLocaleString("en-US");
      altitudeStateEl.textContent = meters === 0 ? "METERS · TOUCHDOWN" : "METERS · DESCENDING";
    }
  }, 0);
  tl.to(".compass-dial", { rotation: -360, svgOrigin: "50 50", duration: total }, 0);
  tl.to(".compass-needle", { rotation: 118, svgOrigin: "50 50", duration: total, ease: "sine.inOut" }, 0);
  tl.set({}, {}, total + 0.2); // short hold on the seaport before release

  dockLinks.forEach((link, i) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const st = tl.scrollTrigger;
      const labelTime = i === 0 ? 0 : tl.labels["L" + (i + 1)] + 0.2;
      const top = st.start + (st.end - st.start) * (labelTime / tl.duration());
      window.scrollTo({ top: Math.ceil(top) + 1, behavior: "smooth" });
    });
  });
}

// ---------- Always-on behaviour (works with reduced motion too) ----------

const railLinks = gsap.utils.toArray("#sectionNavRail a");
const menuTrigger = document.querySelector(".menu-trigger");

function setMenu(open) {
  document.body.classList.toggle("nav-open", open);
  menuTrigger.setAttribute("aria-expanded", String(open));
}
menuTrigger.addEventListener("click", () => setMenu(!document.body.classList.contains("nav-open")));
railLinks.forEach((link) => link.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") setMenu(false); });

// Carbon estimate: vehicles × km/day × 365 × kg CO2 per km, in tonnes.
const sim = {
  vehicles: document.getElementById("simVehicles"),
  km: document.getElementById("simKm"),
  factor: document.getElementById("simFactor"),
  vehiclesOut: document.getElementById("simVehiclesOut"),
  kmOut: document.getElementById("simKmOut"),
  result: document.getElementById("simResult")
};
function updateCarbon() {
  const vehicles = Number(sim.vehicles.value);
  const km = Number(sim.km.value);
  const factor = Math.max(0, Number(sim.factor.value) || 0);
  sim.vehiclesOut.textContent = vehicles;
  sim.kmOut.textContent = km;
  sim.result.textContent = Math.round((vehicles * km * 365 * factor) / 1000).toLocaleString("en-IN");
}
document.getElementById("carbonSim").addEventListener("input", updateCarbon);
document.getElementById("carbonSim").addEventListener("submit", (event) => event.preventDefault());
updateCarbon();

// EV garage bays and the emergency override.
const bays = gsap.utils.toArray(".bay");
const garageGrid = document.getElementById("garageGrid");
const garageCount = document.getElementById("garageCount");
const overrideBtn = document.getElementById("garageOverride");
let baysOn = bays.length;
function renderBays() {
  const override = garageGrid.classList.contains("is-override");
  bays.forEach((bay, i) => bay.classList.toggle("is-on", !override && i < baysOn));
  garageCount.textContent = override ? 0 : baysOn;
}
overrideBtn.addEventListener("click", () => {
  const on = !garageGrid.classList.contains("is-override");
  garageGrid.classList.toggle("is-override", on);
  overrideBtn.setAttribute("aria-pressed", String(on));
  overrideBtn.textContent = on ? "Restore charging" : "Emergency override";
  renderBays();
});
renderBays();

// Counters show their final value in the HTML; animate them up from zero when seen.
function animateCounter(el) {
  const target = Number(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  const prefix = el.dataset.prefix || "";
  const suffix = el.dataset.suffix || "";
  const state = { value: 0 };
  gsap.to(state, {
    value: target,
    duration: 1.8,
    ease: "power3.out",
    onUpdate: () => { el.textContent = prefix + state.value.toFixed(decimals) + suffix; }
  });
}

// ---------- Scroll choreography ----------

if (!reducedMotion) {
  buildFlightSequence();
  const mm = gsap.matchMedia();

  // Section headings rise in as each section arrives.
  gsap.utils.toArray(".sec .sec-head").forEach((head) => {
    gsap.from(head.children, {
      y: 36,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: head, start: "top 82%", toggleActions: "play none none reverse" }
    });
  });

  // 02 EV fleet: pinned horizontal rail on wide screens.
  mm.add("(min-width: 701px)", () => {
    const track = document.querySelector(".fleet-track");
    const rail = document.querySelector(".fleet-rail");
    // The rail bleeds to the viewport edges; keep the same gutter after the last card.
    const distance = () => Math.max(0, track.scrollWidth + 2 * parseFloat(getComputedStyle(rail).paddingLeft) - rail.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: { trigger: "#evFleet", start: "top top", end: () => "+=" + Math.max(distance() * 1.6, window.innerHeight * 0.9), pin: true, scrub: 1, invalidateOnRefresh: true }
    });
  });

  // 03 EV garage: bays energise one by one as the section scrubs past.
  baysOn = 0;
  renderBays();
  ScrollTrigger.create({
    trigger: "#evGarage",
    start: "top 70%",
    end: "center center",
    scrub: true,
    onUpdate: (self) => {
      const next = Math.round(self.progress * bays.length);
      if (next !== baysOn) { baysOn = next; renderBays(); }
    }
  });
  gsap.from(".bay", {
    rotationX: -70,
    autoAlpha: 0,
    transformOrigin: "50% 100%",
    stagger: 0.05,
    duration: 0.8,
    ease: "back.out(1.4)",
    scrollTrigger: { trigger: "#garageGrid", start: "top 85%", toggleActions: "play none none reverse" }
  });

  // 04 Operations: panel lifts in, counters run, pipeline bars grow.
  const opsTl = gsap.timeline({ scrollTrigger: { trigger: ".ops-panel", start: "top 78%", toggleActions: "play none none reverse" } });
  opsTl.from(".ops-panel", { y: 60, autoAlpha: 0, duration: 0.9, ease: "power3.out" })
    .from(".ops-tile", { y: 24, autoAlpha: 0, stagger: 0.07, duration: 0.6, ease: "power2.out", onStart: () => document.querySelectorAll(".ops-tile [data-count]").forEach(animateCounter) }, "-=0.5")
    .fromTo(".ops-pipeline i", { "--grow": 0 }, { "--grow": 1, stagger: 0.06, duration: 0.8, ease: "power2.out" }, "-=0.3")
    .from(".ops-feed li", { x: 24, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "<");

  // 05 Water tower: the scope tilts flat and the reticle turns as you scroll.
  gsap.fromTo(".scope-plane", { rotationX: 38, rotationZ: -8, scale: 0.86 }, {
    rotationX: 0, rotationZ: 0, scale: 1, ease: "none",
    scrollTrigger: { trigger: "#landmark", start: "top bottom", end: "center center", scrub: 1 }
  });
  gsap.to(".scope-reticle i", {
    rotation: (i) => (i ? -180 : 180), ease: "none",
    scrollTrigger: { trigger: "#landmark", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  // 06 Digital twin: 3D tilt on scroll, nodes pop in, gentle ambient spin.
  gsap.fromTo(".twin-orbit", { rotationX: 55 }, {
    rotationX: 12, ease: "none",
    scrollTrigger: { trigger: "#twin", start: "top bottom", end: "center center", scrub: 1 }
  });
  gsap.from(".twin-node", {
    scale: 0, autoAlpha: 0, stagger: 0.06, duration: 0.6, ease: "back.out(2)",
    scrollTrigger: { trigger: ".twin-orbit", start: "top 75%", toggleActions: "play none none reverse" }
  });
  const twinSpin = gsap.to(".twin-orbit", { rotationZ: 360, duration: 90, ease: "none", repeat: -1 });
  const twinCounter = gsap.to(".twin-node, .twin-core", { rotationZ: -360, duration: 90, ease: "none", repeat: -1 });
  const twinBtn = document.getElementById("twinMotion");
  twinBtn.addEventListener("click", () => {
    const playing = !twinSpin.paused();
    twinSpin.paused(playing);
    twinCounter.paused(playing);
    twinBtn.setAttribute("aria-pressed", String(!playing));
    twinBtn.textContent = playing ? "Resume motion" : "Pause motion";
  });

  // 07 Process: pinned, the line draws and each step lights in turn.
  const steps = gsap.utils.toArray(".process-step");
  document.querySelector(".process-steps").classList.add("is-scrubbing");
  gsap.fromTo(".process-line i", { scaleX: 0 }, {
    scaleX: 1, ease: "none",
    scrollTrigger: {
      trigger: "#process", start: "top top", end: "+=150%", pin: true, scrub: 0.6,
      onUpdate: (self) => {
        const active = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
        steps.forEach((step, i) => step.classList.toggle("is-active", i <= active));
      }
    }
  });

  // 08 Stats: pillars rise and count up.
  gsap.from(".stat", {
    y: 40, autoAlpha: 0, stagger: 0.06, duration: 0.7, ease: "power3.out",
    scrollTrigger: {
      trigger: ".stats-grid", start: "top 80%", toggleActions: "play none none reverse",
      onEnter: () => document.querySelectorAll(".stat [data-count]").forEach(animateCounter)
    }
  });

  // 09 Company cards.
  gsap.from(".company-card", {
    y: 50, autoAlpha: 0, rotationY: -12, stagger: 0.1, duration: 0.8, ease: "power3.out",
    scrollTrigger: { trigger: ".company-cards", start: "top 80%", toggleActions: "play none none reverse" }
  });

  // 10 Services: pinned horizontal track on wide screens.
  mm.add("(min-width: 701px)", () => {
    const track = document.querySelector(".usecase-track");
    const distance = () => Math.max(0, track.scrollWidth - document.querySelector(".usecase-pin").clientWidth);
    const pinLength = () => Math.max(distance() * 1.6, window.innerHeight * 0.9);
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: { trigger: "#usecases", start: "top top", end: () => "+=" + pinLength(), pin: true, scrub: 1, invalidateOnRefresh: true }
    });
    gsap.utils.toArray(".usecase-card img").forEach((img) => {
      gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#usecases", start: "top top", end: () => "+=" + pinLength(), scrub: 1, invalidateOnRefresh: true } });
    });
  });

  // 11 Seaport: radar sweeps, nodes ping, cards slide in.
  gsap.to(".radar-sweep", { rotation: 360, duration: 4, ease: "none", repeat: -1 });
  gsap.fromTo(".radar-node i", { scale: 0.6 }, { scale: 1.35, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: 0.3 });
  gsap.from(".port-radar", {
    scale: 0.7, autoAlpha: 0, duration: 1, ease: "power3.out",
    scrollTrigger: { trigger: "#port", start: "top 70%", toggleActions: "play none none reverse" }
  });
  gsap.from(".port-cards article", {
    x: 60, autoAlpha: 0, stagger: 0.1, duration: 0.7, ease: "power3.out",
    scrollTrigger: { trigger: ".port-cards", start: "top 85%", toggleActions: "play none none reverse" }
  });

  // 12 CTA: HUD brackets close in on the terminal.
  const ctaTl = gsap.timeline({ scrollTrigger: { trigger: "#cta", start: "top 65%", toggleActions: "play none none reverse" } });
  ctaTl.from(".cta-terminal", { y: 60, autoAlpha: 0, duration: 0.9, ease: "power3.out" })
    .from(".hud-tl", { x: -30, y: -30, autoAlpha: 0, duration: 0.5 }, "-=0.4")
    .from(".hud-tr", { x: 30, y: -30, autoAlpha: 0, duration: 0.5 }, "<")
    .from(".hud-bl", { x: -30, y: 30, autoAlpha: 0, duration: 0.5 }, "<")
    .from(".hud-br", { x: 30, y: 30, autoAlpha: 0, duration: 0.5 }, "<");

  gsap.from(".brand, .flight-status, .menu-trigger, .section-rail", {
    y: -12,
    opacity: 0,
    duration: 1.1,
    stagger: 0.08,
    ease: "power3.out",
    delay: 0.2
  });
}

// Rail triggers are created last so their positions include pin spacing above them.
gsap.utils.toArray("[data-section]").forEach((section) => {
  const link = railLinks.find((a) => a.dataset.target === section.id);
  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onToggle: ({ isActive }) => {
      if (!isActive) return;
      railLinks.forEach((a) => { a.classList.toggle("is-active", a === link); a.removeAttribute("aria-current"); });
      link.setAttribute("aria-current", "true");
    }
  });
});
