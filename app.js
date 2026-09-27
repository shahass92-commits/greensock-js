import { gsap } from "./esm/index.js";
import ScrollTrigger from "./esm/ScrollTrigger.js";

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const scenes = gsap.utils.toArray(".scene");
const railFill = document.querySelector(".rail-fill");
const railCurrent = document.querySelector(".journey-rail .rail-number");

function buildFlightSequence() {
  const flight = document.querySelector(".scene-flight");
  if (!flight) return;
  const layers = gsap.utils.toArray(".flight-layer", flight);
  const dockLinks = gsap.utils.toArray(".flight-dock a", flight);
  const altitudeEl = flight.querySelector("[data-altitude]");
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
    onUpdate: () => { altitudeEl.textContent = Math.round(altitude.value).toLocaleString("en-US"); }
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

if (!reducedMotion) {
  buildFlightSequence();

  gsap.to(".rail-fill", {
    width: "100%",
    ease: "none",
    scrollTrigger: {
      trigger: "main",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.3
    }
  });

  gsap.to(".cloud-field-far", {
    yPercent: 18,
    scale: 1.3,
    ease: "none",
    scrollTrigger: { trigger: ".scene-arrival", start: "top top", end: "bottom top", scrub: 1 }
  });

  gsap.to(".cloud-field-near", {
    yPercent: 34,
    scale: 1.45,
    ease: "none",
    scrollTrigger: { trigger: ".scene-arrival", start: "top top", end: "bottom top", scrub: 1.2 }
  });

  gsap.to(".hero-content", {
    yPercent: -34,
    opacity: 0,
    ease: "none",
    scrollTrigger: { trigger: ".scene-arrival", start: "46% top", end: "bottom top", scrub: true }
  });

  gsap.to(".storm-tunnel", {
    scale: 1.34,
    rotation: 16,
    ease: "none",
    scrollTrigger: { trigger: ".scene-clouds", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".cloud-bank-left", {
    xPercent: -25,
    yPercent: 8,
    ease: "none",
    scrollTrigger: { trigger: ".scene-clouds", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".cloud-bank-right", {
    xPercent: 25,
    yPercent: -8,
    ease: "none",
    scrollTrigger: { trigger: ".scene-clouds", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".orbit-ring-large", {
    rotation: 130,
    scale: 1.2,
    ease: "none",
    scrollTrigger: { trigger: ".scene-orbit", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".orbit-ring-small", {
    rotation: -200,
    scale: 1.45,
    ease: "none",
    scrollTrigger: { trigger: ".scene-orbit", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".orbital-grid", {
    rotation: 55,
    scale: 1.25,
    ease: "none",
    scrollTrigger: { trigger: ".scene-orbit", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".urban-grid", {
    yPercent: 14,
    scale: 2,
    ease: "none",
    scrollTrigger: { trigger: ".scene-nexus", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".nexus-rings", {
    rotation: 175,
    scale: 1.45,
    ease: "none",
    scrollTrigger: { trigger: ".scene-nexus", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.to(".nexus-core", {
    scale: 1.8,
    ease: "none",
    scrollTrigger: { trigger: ".scene-nexus", start: "top 75%", end: "bottom 25%", scrub: 0.8 }
  });

  gsap.to(".landing-platform", {
    yPercent: -22,
    scale: 1.12,
    rotation: 11,
    ease: "none",
    scrollTrigger: { trigger: ".scene-touchdown", start: "top bottom", end: "bottom top", scrub: 1 }
  });

  gsap.from(".touchdown-copy", {
    y: 90,
    opacity: 0,
    ease: "power2.out",
    scrollTrigger: { trigger: ".scene-touchdown", start: "top 65%", end: "top 28%", scrub: 0.8 }
  });

  scenes.forEach((scene, index) => {
    const copy = scene.querySelector(".scene-copy");
    if (copy && index > 0 && index < scenes.length - 1) {
      gsap.from(copy, {
        y: 70,
        opacity: 0,
        ease: "power2.out",
        scrollTrigger: { trigger: scene, start: "top 70%", end: "top 35%", scrub: 0.7 }
      });
    }

    ScrollTrigger.create({
      trigger: scene,
      start: "top center",
      end: "bottom center",
      onToggle: ({ isActive }) => {
        if (isActive) railCurrent.textContent = String(index + 1).padStart(2, "0");
      }
    });
  });

  gsap.from(".brand, .flight-status, .menu-trigger, .journey-rail", {
    y: -12,
    opacity: 0,
    duration: 1.1,
    stagger: 0.08,
    ease: "power3.out",
    delay: 0.2
  });
} else {
  railFill.style.width = "100%";
}
