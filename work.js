/*
  Exhibition motion (work.html).

  The seven scenes are stacked on one fixed stage. Scrolling moves
  from one to the next: a small symbol on the current scene grows
  into a silhouette that reveals the following one.

  If motion is reduced, the scenes simply sit one below another.
*/
(() => {
  const journey = document.getElementById("journey");
  const stage = document.getElementById("stage");
  const scenes = [...document.querySelectorAll(".scene")];
  const motionButton = document.getElementById("motion");
  const pager = document.getElementById("pager");
  const counter = document.getElementById("counter");
  const previousButton = document.getElementById("previous");
  const nextButton = document.getElementById("next");
  const progress = document.getElementById("progress");
  const endSection = document.querySelector(".end");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");

  // Matches the stacked phone and upright-tablet layout in styles.css.
  const compact = matchMedia("(max-width: 900px)");

  // The visitor's choice is remembered and shared with the home page.
  const STORAGE_KEY = "tb-reduce-motion";

  function savedChoice() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value ? "yes" : "no");
    } catch (error) {
      /* Storage can be unavailable; the page still works without it. */
    }
  }

  const saved = savedChoice();
  let reduced = saved ? saved === "yes" : preference.matches;
  let pending = false;
  let step = 1;      // scroll distance given to each scene
  let active = 0;    // scene currently on screen

  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };

  function svgMask(content) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <g fill="white">${content}</g>
      </svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  }

  // One silhouette per scene. The first scene needs none.
  const masks = [
    null,

    // Microphone: capsule, supporting arm, stem and base.
    svgMask(`
      <rect x="66" y="15" width="68" height="110" rx="34"/>
      <path d="M49 83h10v27a41 41 0 0 0 82 0V83h10v27
               a51 51 0 0 1-46 51v20h28v10H67v-10h28v-20
               a51 51 0 0 1-46-51z"/>
    `),

    // Three fader-like strips from the soundboard.
    svgMask(`
      <rect x="40" y="25" width="32" height="150" rx="16"/>
      <rect x="84" y="5" width="32" height="190" rx="16"/>
      <rect x="128" y="40" width="32" height="120" rx="16"/>
    `),

    // Circular opening into the episode artwork.
    svgMask(`<circle cx="100" cy="100" r="68"/>`),

    // An open magazine, with a shallow central fold.
    svgMask(`
      <path d="M15 35Q58 20 100 43Q142 20 185 35
               V166Q142 151 100 174Q58 151 15 166Z"/>
    `),

    // Football centre circle.
    svgMask(`<circle cx="100" cy="100" r="68"/>`),

    // An editorial page.
    svgMask(`<path d="M38 12H140L166 38V188H38Z"/>`)
  ];

  // Where the symbol sits on each outgoing scene, as fractions of
  // the screen: [across, down].
  const desktopOrigins = [
    [0.91, 0.76], // Portrait: lower right.
    [0.47, 0.30], // Studio: upper gap between columns.
    [0.48, 0.71], // Podcast: lower central gap.
    [0.47, 0.45], // HBCU: beside the heading, between columns.
    [0.47, 0.84], // Magazine: lower gap between columns.
    [0.52, 0.84]  // Football: below and between the columns.
  ];

  // On phones and upright tablets the symbol keeps one clear spot,
  // top right of the text.
  const mobileOrigin = [0.88, 0.105];

  // The symbol is smaller on phones so it never crowds the heading.
  function symbolSize() {
    return compact.matches ? 44 : 64;
  }

  function originFor(index) {
    const point = compact.matches
      ? mobileOrigin
      : desktopOrigins[index] || [0.85, 0.83];
    const bounds = stage.getBoundingClientRect();

    return {
      x: point[0] * bounds.width,
      y: point[1] * bounds.height
    };
  }

  const symbols = scenes.map((scene, i) => {
    if (i === scenes.length - 1) return null;

    const symbol = document.createElement("span");
    symbol.className = "transition-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.style.setProperty("--symbol-mask", masks[i + 1]);
    scene.appendChild(symbol);
    return symbol;
  });

  function setMask(scene, size, position) {
    scene.style.maskSize = size;
    scene.style.webkitMaskSize = size;
    scene.style.maskPosition = position;
    scene.style.webkitMaskPosition = position;
  }

  function render() {
    pending = false;

    const travel = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform =
      `scaleX(${clamp(scrollY / Math.max(1, travel))})`;

    if (reduced) return;

    const position = Math.max(
      0,
      Math.min(scenes.length, -journey.getBoundingClientRect().top / step)
    );

    const diagonal = Math.hypot(innerWidth, innerHeight);
    active = 0;

    scenes.forEach((scene, i) => {
      const copy = scene.querySelector(".copy");
      const visual = scene.querySelector(".visual");
      const label = scene.querySelector(".chapter-number");

      // Each scene holds for a moment before the next one opens.
      const entry = i === 0
        ? 1
        : clamp((position - (i - 1) - 0.36) / 0.64);

      const exit = i === scenes.length - 1
        ? 0
        : clamp((position - i - 0.36) / 0.64);

      scene.style.zIndex = String(i + 1);
      scene.style.visibility = entry > 0 ? "visible" : "hidden";

      // The small symbol that marks where the next scene will open.
      const symbol = symbols[i];

      if (symbol) {
        const origin = originFor(i);
        const growth = 1 + smooth(exit / 0.22) * 0.3;
        const arrived = i === 0 ? 1 : smooth((entry - 0.82) / 0.18);

        symbol.style.left = `${origin.x}px`;
        symbol.style.top = `${origin.y}px`;
        symbol.style.transform =
          `translate(-50%, -50%) scale(${growth})`;
        symbol.style.opacity =
          String(arrived * (1 - smooth(exit / 0.2)));
      }

      // The scene itself is revealed through the previous scene's symbol.
      if (i > 0) {
        const origin = originFor(i - 1);
        const growth = Math.pow(smooth(entry), 2.2);
        const size = symbolSize() + growth * diagonal * 14;

        setMask(
          scene,
          `${size}px ${size}px`,
          `${origin.x - size / 2}px ${origin.y - size / 2}px`
        );

        scene.style.opacity = String(smooth(entry / 0.2));
      } else {
        scene.style.opacity = "1";
      }

      // The outgoing picture moves gently towards the visitor.
      const zoom = smooth(exit);
      const incoming = 1 - smooth(entry);

      visual.style.transform =
        `translate3d(0, ${-zoom * 3}%, 0)
         scale(${1 + zoom * 0.3 + incoming * 0.12})`;

      // Text timing is separate so two headings never compete.
      const textIn = i === 0 ? 1 : smooth((entry - 0.76) / 0.24);
      const textOut = 1 - smooth(exit / 0.28);

      copy.style.opacity = String(textIn * textOut);
      copy.style.transform =
        `translate3d(0, ${(1 - textIn) * 16}px, 0)`;

      if (label) {
        label.style.opacity = String(0.7 * textIn * textOut);
      }

      if (entry >= 0.88) active = i;
    });

    // Only the scene on screen can be reached by keyboard or screen reader.
    scenes.forEach((scene, i) => {
      scene.inert = i !== active;
    });

    counter.textContent =
      `${String(active + 1).padStart(2, "0")} / ` +
      String(scenes.length).padStart(2, "0");

    previousButton.disabled = active === 0;

    const inJourney =
      journey.getBoundingClientRect().bottom > innerHeight * 0.5;

    pager.style.opacity = inJourney ? "1" : "0";
    pager.style.pointerEvents = inJourney ? "auto" : "none";
  }

  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(render);
  }

  // Scroll position at which a given scene is fully on screen.
  function sceneTop(index) {
    return journey.offsetTop + index * step;
  }

  // Distance of an element's top edge from the top of the page.
  function pageTop(element) {
    return element.getBoundingClientRect().top + scrollY;
  }

  function goToScene(index, behavior) {
    const target = Math.max(0, index);
    let top;

    if (target >= scenes.length) {
      top = pageTop(endSection);
    } else if (reduced) {
      top = pageTop(scenes[target]);
    } else {
      top = sceneTop(target);
    }

    window.scrollTo({ top, behavior });
  }

  // Links such as work.html#hbcu-title open on the matching scene.
  function goToHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;

    const target = document.getElementById(id);
    const index = scenes.findIndex(scene => scene.contains(target));

    if (index >= 0) goToScene(index, "auto");
  }

  function configure() {
    step = innerHeight * 1.65;

    journey.style.setProperty(
      "--journey-height",
      `${innerHeight + scenes.length * step}px`
    );

    stage.style.setProperty("--symbol-size", `${symbolSize()}px`);
    document.body.classList.toggle("animated", !reduced);

    scenes.forEach((scene, i) => {
      scene.removeAttribute("style");
      scene.querySelector(".copy").removeAttribute("style");
      scene.querySelector(".visual").removeAttribute("style");

      const label = scene.querySelector(".chapter-number");
      if (label) label.removeAttribute("style");

      scene.inert = false;

      if (i > 0) {
        scene.style.setProperty("--reveal-mask", masks[i]);
      }
    });

    motionButton.textContent =
      reduced ? "Enable motion" : "Reduce motion";
    motionButton.setAttribute("aria-pressed", String(reduced));

    render();
  }

  motionButton.addEventListener("click", () => {
    const current = active;
    reduced = !reduced;
    saveChoice(reduced);
    configure();
    goToScene(current, "auto");
  });

  previousButton.addEventListener("click", () => {
    goToScene(active - 1, "smooth");
  });

  nextButton.addEventListener("click", () => {
    goToScene(active + 1, "smooth");
  });

  preference.addEventListener("change", event => {
    if (savedChoice()) return;
    reduced = event.matches;
    configure();
  });

  let lastWidth = innerWidth;

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("hashchange", goToHash);
  window.addEventListener("resize", () => {
    // Phone browsers resize when their toolbar hides; ignore those.
    if (innerWidth === lastWidth && compact.matches) {
      requestRender();
      return;
    }
    lastWidth = innerWidth;
    configure();
  });

  configure();

  // Wait for the browser's own jump to finish, then correct it.
  window.addEventListener("load", () => {
    requestAnimationFrame(goToHash);
  });
})();
