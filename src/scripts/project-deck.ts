/** Native scrolling is the baseline; controls enhance it without auto-advance. */
function initializeProjectDecks() {
  document
    .querySelectorAll<HTMLElement>("[data-project-deck]")
    .forEach((deck) => {
      if (deck.dataset.initialized) return;
      const track = deck.querySelector<HTMLElement>(".deck-track");
      const slides = Array.from(
        deck.querySelectorAll<HTMLElement>(".deck-slide"),
      );
      const previous =
        deck.querySelector<HTMLButtonElement>("[data-deck-prev]");
      const next = deck.querySelector<HTMLButtonElement>("[data-deck-next]");
      const counter = deck.querySelector<HTMLElement>(".deck-count");
      const navigation = deck.querySelector<HTMLElement>(".deck-navigation");
      if (
        !track ||
        !previous ||
        !next ||
        !counter ||
        !navigation ||
        !slides.length
      )
        return;
      deck.dataset.initialized = "true";
      navigation.hidden = false;
      let current = 0;
      const update = () => {
        const edge = track.getBoundingClientRect().left;
        current = slides.reduce(
          (best, slide, index) =>
            Math.abs(slide.getBoundingClientRect().left - edge) <
            Math.abs(slides[best].getBoundingClientRect().left - edge)
              ? index
              : best,
          0,
        );
        previous.disabled = current === 0;
        next.disabled = current === slides.length - 1;
        counter.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      };
      const go = (index: number) => {
        const target = slides[Math.max(0, Math.min(slides.length - 1, index))];
        const reduce =
          matchMedia("(prefers-reduced-motion: reduce)").matches ||
          document.documentElement.dataset.motion === "paused";
        track.scrollBy({
          left:
            target.getBoundingClientRect().left -
            track.getBoundingClientRect().left,
          behavior: reduce ? "instant" : "smooth",
        });
      };
      previous.addEventListener("click", () => go(current - 1));
      next.addEventListener("click", () => go(current + 1));
      track.addEventListener("keydown", (event) => {
        if (
          event.target !== track ||
          !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
        )
          return;
        event.preventDefault();
        go(
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? slides.length - 1
              : current + (event.key === "ArrowRight" ? 1 : -1),
        );
      });
      track.addEventListener("scroll", update, { passive: true });
      new ResizeObserver(update).observe(track);
      update();
    });
}
initializeProjectDecks();
document.addEventListener("astro:page-load", initializeProjectDecks);
