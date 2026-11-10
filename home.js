/*
  Home page motion (index.html).

  Everything here is driven by scroll position, so the visitor
  controls the pace. If motion is reduced, the page falls back to a
  plain, fully readable layout.
*/
(() => {
  const hero = document.querySelector(".hero");
  const stage = document.querySelector(".hero-stage");
  const mark = document.querySelector(".monogram");
  const heroName = document.querySelector(".hero-name");
  const corner = document.querySelector(".hero-corner");
  const scrollLink = document.querySelector(".scroll-link");
  const portrait = document.querySelector(".portrait img");
  const story = document.getElementById("story");
  const gallery = document.getElementById("work-gallery");
  const galleryStage = gallery.querySelector(".gallery-stage");
  const pictures = [...gallery.querySelectorAll(".gallery-image")];
  const button = document.getElementById("motion-button");
  const progress = document.getElementById("progress");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");

  // The visitor's choice is remembered and shared with the exhibition page.
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

  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };

  // Wrap each word of the background story so it can brighten on scroll.
  const words = story.textContent.trim().replace(/\s+/g, " ").split(" ");
  story.textContent = "";

  const wordSpans = words.map((word, i) => {
    const span = document.createElement("span");
    span.className = "story-word";
    span.textContent = word;
    story.appendChild(span);
    if (i < words.length - 1) {
      story.appendChild(document.createTextNode(" "));
    }
    return span;
  });

  // Where each gallery picture starts and ends, in screen heights.
  const starts = [95, 125, 150, 180, 210, 240];
  const ends = [-130, -100, -160, -120, -145, -95];

  function render() {
    pending = false;

    const travel = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform =
      `scaleX(${clamp(scrollY / Math.max(1, travel))})`;

    if (reduced) return;

    // Opening: the camera pushes in through the TB mark.
    const heroTravel = hero.offsetHeight - stage.offsetHeight;
    const heroProgress = clamp(
      -hero.getBoundingClientRect().top / Math.max(1, heroTravel)
    );

    const push = smooth((heroProgress - 0.06) / 0.86);
    const fade = smooth((heroProgress - 0.42) / 0.4);
    const detailExit = smooth(heroProgress / 0.3);

    mark.style.transform = `scale(${1 + push * push * 7})`;
    mark.style.opacity = String(1 - fade);

    [heroName, corner, scrollLink].forEach(element => {
      element.style.opacity = String(1 - detailExit);
      element.style.transform = `translateY(${-detailExit * 18}px)`;
    });

    // Portrait: a slow settle inside its fixed crop.
    const portraitBounds = portrait.parentElement.getBoundingClientRect();
    const portraitProgress = clamp(
      (innerHeight - portraitBounds.top) /
      (innerHeight + portraitBounds.height)
    );

    portrait.style.transform =
      `scale(${1.08 - portraitProgress * 0.08})`;

    // Background story: words brighten in reading order.
    const storyBounds = story.getBoundingClientRect();
    const readingProgress = clamp(
      (innerHeight * 0.85 - storyBounds.top) /
      Math.max(1, storyBounds.height + innerHeight * 0.25)
    );

    wordSpans.forEach((word, i) => {
      const emphasis = smooth(
        (readingProgress * (words.length + 5) - i) / 5
      );

      const r = Math.round(134 + emphasis * 105);
      const g = Math.round(138 + emphasis * 97);
      const b = Math.round(127 + emphasis * 99);

      word.style.color = `rgb(${r}, ${g}, ${b})`;
    });

    // Selected work: pictures drift past the heading at different speeds.
    const bounds = gallery.getBoundingClientRect();
    const distance = gallery.offsetHeight - galleryStage.offsetHeight;
    const position = clamp(-bounds.top / Math.max(1, distance));
    const scale = innerWidth <= 700 ? 0.68 : 1;

    pictures.forEach((picture, index) => {
      const local = smooth((position - index * 0.055) / 0.7);
      const offset = starts[index] + (ends[index] - starts[index]) * local;

      picture.style.transform =
        `translate3d(0, ${offset * scale}svh, 0)`;
    });
  }

  function requestRender() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(render);
  }

  function configure() {
    document.body.classList.toggle("motion-on", !reduced);

    button.textContent = reduced ? "Enable motion" : "Reduce motion";
    button.setAttribute("aria-pressed", String(reduced));

    [mark, heroName, corner, scrollLink, portrait, ...wordSpans, ...pictures]
      .forEach(element => element.removeAttribute("style"));

    render();
  }

  button.addEventListener("click", () => {
    reduced = !reduced;
    saveChoice(reduced);
    configure();
  });

  preference.addEventListener("change", event => {
    if (savedChoice()) return;
    reduced = event.matches;
    configure();
  });

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);

  configure();
})();
