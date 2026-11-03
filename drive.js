import { gsap } from "./esm/index.js";
import ScrollTrigger from "./esm/ScrollTrigger.js";
import SplitText from "./esm/SplitText.js";

gsap.registerPlugin(ScrollTrigger, SplitText);

/* ------------------------------------------------------------------
   Views — drive.html?view=seven-seat (default) | ?view=pure-electric
   Copy only; no specs are invented here.
------------------------------------------------------------------- */
const VIEWS = {
  "seven-seat": {
    title: "CNIQ Drive — Seven-Seat Electric",
    eyebrow: "Seven-seat electric · Employee mobility",
    line1: "Seven seats.",
    line2: "Precisely planned.",
    sub: "Pure electric, professionally driven<br />and verified on every trip.",
  },
  "pure-electric": {
    title: "CNIQ Drive — Pure Electric",
    eyebrow: "A connected world of movement",
    line1: "Pure electric.",
    line2: "Precisely designed.",
    sub: "One connected ecosystem.<br />A more considered way forward.",
  },
};

function applyView() {
  const key = new URLSearchParams(location.search).get("view");
  const name = key && Object.hasOwn(VIEWS, key) ? key : "seven-seat";
  const view = VIEWS[name];
  document.body.dataset.view = name;
  document.title = view.title;
  const set = (bind, html) => {
    const el = document.querySelector(`[data-bind="${bind}"]`);
    if (el) el.innerHTML = html;
  };
  set("line1", view.line1);
  set("line2", view.line2);
  set("sub", view.sub);
  const eyebrow = document.querySelector('[data-bind="eyebrow"]');
  if (eyebrow) eyebrow.innerHTML = `<i></i>${view.eyebrow}`;
}

/* ------------------------------------------------------------------
   Header — compact after the first scroll
------------------------------------------------------------------- */
function buildHeader() {
  const header = document.querySelector(".d-header");
  ScrollTrigger.create({
    start: 40,
    end: "max",
    onToggle: (self) => header.classList.toggle("is-compact", self.isActive),
  });
}

/* ------------------------------------------------------------------
   01 — Hero: char-by-char headline, car drives in, then a pinned
   scroll where highlights appear and the car drives off-frame.
------------------------------------------------------------------- */
function buildHero() {
  const hero = document.querySelector(".hero");
  const lines = hero.querySelectorAll(".hero-line");
  const title = hero.querySelector(".hero-title");
  const eyebrow = hero.querySelector(".eyebrow");
  const meta = hero.querySelector(".hero-meta");
  const carImg = hero.querySelector(".hero-car");
  const rig = hero.querySelector(".car-rig");
  const shadow = hero.querySelector(".car-shadow");
  const floor = hero.querySelector(".stage-floor");
  const tags = hero.querySelectorAll(".spec-tags li");
  const progress = hero.querySelector(".hero-progress i");

  const outro = hero.querySelector(".hero-outro");
  // Words (not chars) keep the display face's kerning intact.
  const split = SplitText.create(lines, { type: "lines,words", mask: "lines", linesClass: "line" });

  // Intro (plays once on load)
  gsap.set([title, carImg, eyebrow, meta], { autoAlpha: 1 });
  const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  intro
    .from(eyebrow, { y: 14, autoAlpha: 0, duration: 0.9 }, 0.1)
    .from(split.words, { yPercent: 115, duration: 1.2, stagger: 0.09 }, 0.15)
    .from(meta, { y: 18, autoAlpha: 0, duration: 1 }, 0.65)
    .from(floor, { scaleX: 0, duration: 1.6, ease: "power3.inOut" }, 0.2)
    .from(carImg, { xPercent: 70, autoAlpha: 0, duration: 2, ease: "power4.out" }, 0.35)
    .from(shadow, { scaleX: 0.3, autoAlpha: 0, duration: 1.8, ease: "power3.out" }, 0.55);

  // Pinned scroll story
  const mm = gsap.matchMedia();
  mm.add(
    { desktop: "(min-width: 721px)", mobile: "(max-width: 720px)" },
    (ctx) => {
      const { mobile } = ctx.conditions;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: mobile ? "+=90%" : "+=130%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      tl.to(progress, { scaleX: 1, duration: 1 }, 0)
        // 1. car rolls forward a touch and grows, highlights appear
        .to(rig, { x: () => window.innerWidth * (mobile ? 0.02 : 0.04), scale: mobile ? 1.04 : 1.08, duration: 0.45, ease: "power1.inOut" }, 0)
        .fromTo(
          tags,
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.14, stagger: 0.07, ease: "power2.out" },
          0.06
        )
        // 2. headline lifts away line by line
        .to(title.querySelectorAll(".line"), { yPercent: -40, autoAlpha: 0, duration: 0.22, stagger: 0.05, ease: "power2.in" }, 0.42)
        .to(meta, { y: -20, autoAlpha: 0, duration: 0.18 }, 0.42)
        .to(eyebrow, { autoAlpha: 0, duration: 0.14 }, 0.42)
        .to(tags, { autoAlpha: 0, y: -10, duration: 0.1, stagger: 0.03 }, 0.5)
        // 3. car accelerates out of frame — into the road section
        .to(rig, { x: () => window.innerWidth * 1.15, duration: 0.3, ease: "power2.in" }, 0.52)
        .to(shadow, { scaleX: 1.4, autoAlpha: 0, duration: 0.26 }, 0.55)
        // 4. hand-off line once the stage is clear
        .fromTo(outro, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.16, ease: "power2.out" }, 0.84);

      return () => tl.scrollTrigger && tl.scrollTrigger.kill();
    }
  );
}

/* ------------------------------------------------------------------
   02 — Road: top-down car holds the lane while the road scrolls.
------------------------------------------------------------------- */
function buildRoad() {
  const road = document.querySelector(".road");
  const lane = road.querySelector(".lane-sticky");
  const car = road.querySelector(".lane-rig");
  const speedEl = road.querySelector("[data-speed]");
  const fills = road.querySelectorAll(".fill-line");
  const milestones = gsap.utils.toArray(".milestone", road);
  const CRUISE = 55;

  // Road markings travel with scroll (CSS var drives background-position)
  gsap.to(lane, {
    "--road": "-4800px",
    ease: "none",
    scrollTrigger: { trigger: road, start: "top bottom", end: "bottom top", scrub: true },
  });

  // Speed readout: accelerate in, cruise, brake at the end
  const readout = { v: 0 };
  const smooth = (t) => t * t * (3 - 2 * t);
  ScrollTrigger.create({
    trigger: road,
    start: "top 80%",
    end: "bottom bottom",
    onUpdate(self) {
      const p = self.progress;
      const v = p < 0.18 ? CRUISE * smooth(p / 0.18) : p > 0.9 ? CRUISE * (1 - smooth((p - 0.9) / 0.1)) : CRUISE;
      gsap.to(readout, { v, duration: 0.4, overwrite: true, onUpdate: () => (speedEl.textContent = Math.round(readout.v)) });
    },
  });

  // Car: gentle lane changes + yaw between milestones
  const laneOffset = () => lane.offsetWidth * 0.17;
  const sway = gsap.timeline({
    defaults: { ease: "sine.inOut" },
    scrollTrigger: { trigger: road, start: "top top", end: "bottom bottom", scrub: 1.2, invalidateOnRefresh: true },
  });
  sway
    .to(car, { x: () => -laneOffset(), rotation: -6, duration: 0.5 })
    .to(car, { rotation: 0, duration: 0.5 })
    .to(car, { x: () => laneOffset(), rotation: 6, duration: 0.5 })
    .to(car, { rotation: 0, duration: 0.5 })
    .to(car, { x: 0, rotation: -3, duration: 0.5 })
    .to(car, { rotation: 0, duration: 0.5 });

  // Headline fills from grey to ink as it scrolls through
  gsap.to(fills, {
    backgroundPosition: "0% 0",
    ease: "none",
    stagger: 0.25,
    scrollTrigger: { trigger: road.querySelector(".road-title"), start: "top 85%", end: "bottom 45%", scrub: true },
  });

  gsap.from(road.querySelectorAll(".road-pills li"), {
    y: 16,
    autoAlpha: 0,
    stagger: 0.08,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: road.querySelector(".road-pills"), start: "top 88%" },
  });

  // Milestones: line-masked text reveal + progress rule
  milestones.forEach((ms) => {
    const icon = ms.querySelector(".ms-icon");
    const heading = ms.querySelector("h3");
    const body = ms.querySelector("p:last-child");
    const index = ms.querySelector(".ms-index");

    SplitText.create([heading, body], {
      type: "lines",
      mask: "lines",
      linesClass: "line",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1,
          stagger: 0.08,
          ease: "expo.out",
          scrollTrigger: { trigger: ms, start: "top 72%", toggleActions: "play none none reverse" },
        });
      },
    });

    gsap.from([icon, index], {
      scale: 0.6,
      autoAlpha: 0,
      rotation: -30,
      duration: 0.9,
      stagger: 0.08,
      ease: "back.out(1.6)",
      scrollTrigger: { trigger: ms, start: "top 72%", toggleActions: "play none none reverse" },
    });

    gsap.fromTo(
      ms,
      { "--ms": 0 },
      { "--ms": 1, ease: "none", scrollTrigger: { trigger: ms, start: "top 70%", end: "bottom 40%", scrub: true } }
    );
  });
}

/* ------------------------------------------------------------------
   03 — Studio: words light up, frame opens to full width
------------------------------------------------------------------- */
function buildStudio() {
  const studio = document.querySelector(".studio");
  const title = studio.querySelector("[data-words]");
  const frame = studio.querySelector(".studio-frame");
  const img = frame.querySelector("img");

  SplitText.create(title, {
    type: "words",
    wordsClass: "word",
    autoSplit: true,
    onSplit(self) {
      return gsap.to(self.words, {
        color: "#0d0e10",
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: title, start: "top 80%", end: "bottom 45%", scrub: true },
      });
    },
  });

  gsap
    .timeline({ scrollTrigger: { trigger: frame, start: "top 92%", end: "center 55%", scrub: 1 } })
    .fromTo(frame, { clipPath: "inset(0% 12% 0% 12% round 28px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "none" }, 0)
    .fromTo(img, { scale: 1.22 }, { scale: 1, ease: "none" }, 0);

  gsap.from(frame.querySelectorAll("figcaption span"), {
    y: 12,
    autoAlpha: 0,
    stagger: 0.1,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: { trigger: frame, start: "center 70%" },
  });
}

/* ------------------------------------------------------------------
   04/05 — line reveals for big titles, chips cascade
------------------------------------------------------------------- */
function buildReveals() {
  document.querySelectorAll("[data-split-lines]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      linesClass: "line",
      autoSplit: true,
      onSplit(self) {
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.2,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 82%" },
        });
      },
    });
  });

  gsap.from(".eco-chips li", {
    y: 40,
    autoAlpha: 0,
    duration: 1,
    stagger: 0.09,
    ease: "expo.out",
    scrollTrigger: { trigger: ".eco-chips", start: "top 88%" },
  });

  gsap.from(".plan-contacts > div", {
    y: 24,
    autoAlpha: 0,
    duration: 0.9,
    stagger: 0.1,
    ease: "power3.out",
    scrollTrigger: { trigger: ".plan-contacts", start: "top 90%" },
  });
}

/* ------------------------------------------------------------------
   In-page links — smooth scroll that respects pin spacing
------------------------------------------------------------------- */
function wireAnchors(reduced) {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (!target) return;
      e.preventDefault();
      const top = a.getAttribute("href") === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  });
}

/* ------------------------------------------------------------------ */
applyView();
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
wireAnchors(reduced);

document.fonts.ready.then(() => {
  if (reduced) {
    gsap.set(".hero-title, .hero-car, .hero-copy .eyebrow, .hero-meta", { autoAlpha: 1 });
    document.querySelector("[data-speed]").textContent = "55";
    buildHeader();
    return;
  }
  buildHeader();
  buildHero();
  buildRoad();
  buildStudio();
  buildReveals();
  ScrollTrigger.refresh();
});
