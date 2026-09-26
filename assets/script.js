/* ==========================================================================
   PieceUp marketing site — shared behavior
   1) mobile nav toggle
   2) scroll-reveal
   3) the live puzzle demo (pointer-based drag, with tap-to-place fallback)
   ========================================================================== */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    initFooterYear();
    initNav();
    initReveal();
    initPuzzleDemo();
    initContactForm();
  });

  function initFooterYear() {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const panel = document.querySelector(".site-nav-panel");
    if (!toggle || !panel) return;

    toggle.addEventListener("click", () => {
      const open = panel.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    panel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        panel.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  function initReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    items.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ *
   * Contact form — no backend, so it hands off to the visitor's own
   * mail client with the fields pre-filled.
   * ------------------------------------------------------------------ */

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements.namedItem("name")?.value.trim() || "";
      const email = form.elements.namedItem("email")?.value.trim() || "";
      const message = form.elements.namedItem("message")?.value.trim() || "";

      const subject = `Message from ${name || "a merchant"} via the PieceUp site`;
      const bodyLines = [message, "", `— ${name}`, email].filter(Boolean);
      const mailto = `mailto:info@34devs.com?subject=${encodeURIComponent(
        subject,
      )}&body=${encodeURIComponent(bodyLines.join("\n"))}`;

      window.location.href = mailto;
    });
  }

  /* ------------------------------------------------------------------ *
   * Puzzle demo
   * ------------------------------------------------------------------ */

  function initPuzzleDemo() {
    const root = document.querySelector(".puzzle-demo");
    if (!root) return;

    const GRID = 3;
    const board = root.querySelector(".puzzle-board");
    const tray = root.querySelector(".puzzle-tray");
    const progressFill = root.querySelector(".puzzle-progress-fill");
    const progressLabel = root.querySelector(".puzzle-progress-label");
    const timerEl = root.querySelector(".puzzle-timer");
    const resetBtn = root.querySelector("[data-puzzle-reset]");
    const rewardOverlay = root.querySelector(".reward-overlay");
    const rewardCode = root.querySelector(".reward-code span");
    const rewardReplay = root.querySelector("[data-reward-replay]");

    /** @type {boolean[]} which correct-index slots are filled */
    let placed = new Array(GRID * GRID).fill(false);
    let selected = null; // the tray piece element currently tap-selected
    let timerId = null;
    let seconds = 0;
    let started = false;

    buildBoard();
    buildTray(shuffledIndices());
    updateProgress();

    resetBtn?.addEventListener("click", resetPuzzle);
    rewardReplay?.addEventListener("click", () => {
      hideReward();
      resetPuzzle();
    });

    function buildBoard() {
      board.innerHTML = "";
      for (let i = 0; i < GRID * GRID; i++) {
        const slot = document.createElement("div");
        slot.className = "puzzle-slot";
        slot.dataset.index = String(i);
        slot.setAttribute("role", "button");
        slot.setAttribute("tabindex", "0");
        slot.setAttribute(
          "aria-label",
          `Puzzle slot ${i + 1} of ${GRID * GRID}`,
        );
        slot.style.setProperty("--bg-x", `${(i % GRID) * 50}%`);
        slot.style.setProperty("--bg-y", `${Math.floor(i / GRID) * 50}%`);
        slot.addEventListener("click", () => attemptPlace(slot));
        slot.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            attemptPlace(slot);
          }
        });
        board.appendChild(slot);
      }
    }

    function shuffledIndices() {
      const arr = Array.from({ length: GRID * GRID }, (_, i) => i);
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      // Guarantee the shuffle isn't accidentally solved already.
      if (arr.every((v, i) => v === i)) {
        [arr[0], arr[1]] = [arr[1], arr[0]];
      }
      return arr;
    }

    function buildTray(order) {
      tray.innerHTML = "";
      order.forEach((correctIndex) => {
        tray.appendChild(makePiece(correctIndex));
      });
    }

    function makePiece(correctIndex) {
      const piece = document.createElement("div");
      piece.className = "puzzle-piece";
      piece.dataset.correct = String(correctIndex);
      piece.setAttribute("role", "button");
      piece.setAttribute("tabindex", "0");
      piece.setAttribute("aria-label", `Puzzle piece ${correctIndex + 1}`);
      // A relative url() inside a CSS custom property resolves against the
      // *document* base when the property is consumed from an inline style
      // (as here), not against style.css's own location — so this piece face
      // is pointed at the image directly rather than through --puzzle-image.
      piece.style.backgroundImage = 'url("assets/puzzle-demo.svg")';
      piece.style.backgroundSize = "300% 300%";
      piece.style.backgroundPosition = `${(correctIndex % GRID) * 50}% ${
        Math.floor(correctIndex / GRID) * 50
      }%`;

      piece.addEventListener("pointerdown", (e) => onPointerDown(e, piece));
      piece.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleSelect(piece);
        }
      });

      return piece;
    }

    /* ---- pointer-based drag, with a tap fallback for touch/keyboard ---- */

    function onPointerDown(e, piece) {
      if (piece.classList.contains("placed")) return;
      e.preventDefault();

      const startX = e.clientX;
      const startY = e.clientY;
      let dragging = false;
      let ghost = null;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!dragging && Math.hypot(dx, dy) > 6) {
          dragging = true;
          clearSelection();
          piece.classList.add("dragging");
          ghost = piece.cloneNode(true);
          ghost.classList.add("puzzle-piece-ghost");
          Object.assign(ghost.style, {
            position: "fixed",
            width: `${piece.offsetWidth}px`,
            height: `${piece.offsetHeight}px`,
            pointerEvents: "none",
            zIndex: "80",
            transform: "translate(-50%, -50%) scale(1.06)",
            boxShadow: "0 18px 30px -14px rgba(20,17,23,.5)",
          });
          document.body.appendChild(ghost);
        }

        if (dragging && ghost) {
          ghost.style.left = `${ev.clientX}px`;
          ghost.style.top = `${ev.clientY}px`;
          const target = document
            .elementFromPoint(ev.clientX, ev.clientY)
            ?.closest(".puzzle-slot");
          board
            .querySelectorAll(".puzzle-slot")
            .forEach((s) => s.classList.remove("drag-over"));
          if (target && !target.classList.contains("filled")) {
            target.classList.add("drag-over");
          }
        }
      };

      const onUp = (ev) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);

        if (!dragging) {
          toggleSelect(piece);
          return;
        }

        piece.classList.remove("dragging");
        const target = document
          .elementFromPoint(ev.clientX, ev.clientY)
          ?.closest(".puzzle-slot");
        board
          .querySelectorAll(".puzzle-slot")
          .forEach((s) => s.classList.remove("drag-over"));
        ghost?.remove();

        if (target) place(piece, target);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    }

    function toggleSelect(piece) {
      if (piece.classList.contains("placed")) return;
      if (selected === piece) {
        clearSelection();
        return;
      }
      clearSelection();
      selected = piece;
      piece.classList.add("selected");
    }

    function clearSelection() {
      selected?.classList.remove("selected");
      selected = null;
    }

    function attemptPlace(slot) {
      if (!selected) return;
      const piece = selected;
      clearSelection();
      place(piece, slot);
    }

    function place(piece, slot) {
      const correct = Number(piece.dataset.correct);
      const target = Number(slot.dataset.index);

      if (slot.classList.contains("filled")) {
        shake(piece);
        return;
      }

      if (correct !== target) {
        shake(piece);
        return;
      }

      if (!started) startTimer();

      piece.classList.add("placed");
      piece.style.cursor = "default";
      slot.classList.add("filled");
      slot.appendChild(piece);
      placed[correct] = true;
      updateProgress();

      if (placed.every(Boolean)) {
        stopTimer();
        celebrate();
      }
    }

    function shake(piece) {
      piece.classList.remove("wrong-shake");
      // restart animation
      void piece.offsetWidth;
      piece.classList.add("wrong-shake");
    }

    function updateProgress() {
      const done = placed.filter(Boolean).length;
      const total = GRID * GRID;
      if (progressFill) progressFill.style.width = `${(done / total) * 100}%`;
      if (progressLabel) progressLabel.textContent = `${done} / ${total}`;
    }

    function startTimer() {
      started = true;
      seconds = 0;
      updateTimerLabel();
      timerId = window.setInterval(() => {
        seconds += 1;
        updateTimerLabel();
      }, 1000);
    }

    function stopTimer() {
      if (timerId) window.clearInterval(timerId);
      timerId = null;
    }

    function updateTimerLabel() {
      if (!timerEl) return;
      const m = String(Math.floor(seconds / 60)).padStart(2, "0");
      const s = String(seconds % 60).padStart(2, "0");
      timerEl.textContent = `${m}:${s}`;
    }

    function resetPuzzle() {
      stopTimer();
      started = false;
      seconds = 0;
      updateTimerLabel();
      placed = new Array(GRID * GRID).fill(false);
      buildBoard();
      buildTray(shuffledIndices());
      updateProgress();
    }

    function celebrate() {
      if (rewardCode) {
        const suffix = Math.floor(10 + Math.random() * 90);
        rewardCode.textContent = `PIECEUP-${suffix}`;
      }
      burstConfetti();
      showReward();
    }

    function showReward() {
      rewardOverlay?.classList.add("show");
    }

    function hideReward() {
      rewardOverlay?.classList.remove("show");
    }

    function burstConfetti() {
      const colors = ["#ff1461", "#ff7a45", "#ffc25c", "#ffffff", "#c81155"];
      const layer = document.createElement("div");
      Object.assign(layer.style, {
        position: "absolute",
        inset: "0",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: "6",
      });
      root.querySelector(".puzzle-shell").appendChild(layer);

      for (let i = 0; i < 46; i++) {
        const piece = document.createElement("span");
        piece.className = "confetti-piece";
        piece.style.left = `${Math.random() * 100}%`;
        piece.style.background = colors[i % colors.length];
        piece.style.animationDuration = `${900 + Math.random() * 900}ms`;
        piece.style.animationDelay = `${Math.random() * 250}ms`;
        piece.style.transform = `rotate(${Math.random() * 360}deg)`;
        layer.appendChild(piece);
      }

      window.setTimeout(() => layer.remove(), 2400);
    }
  }
})();
