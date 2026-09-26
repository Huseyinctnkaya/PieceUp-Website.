/* ==========================================================================
   PieceUp marketing site — shared behavior
   1) mobile nav toggle
   2) scroll-reveal
   3) the live puzzle demo (pointer-based drag, with tap-to-place fallback)
   ========================================================================== */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    initFooterYear();
    initNav();
    initReveal();
    initPuzzleDemo();
    initContactForm();
    initScrollProgress();
    if (!prefersReducedMotion) {
      initParallax();
      if (hasFinePointer) {
        initMagnetic();
        initTilt();
      }
    }
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
    const items = document.querySelectorAll(".reveal, .reveal-stagger");
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
   * Scroll progress bar
   * ------------------------------------------------------------------ */

  function initScrollProgress() {
    const bar = document.querySelector(".scroll-progress");
    if (!bar) return;

    let ticking = false;
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, pct))})`;
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );
    update();
  }

  /* ------------------------------------------------------------------ *
   * Scroll parallax for the decorative floating puzzle pieces
   * ------------------------------------------------------------------ */

  function initParallax() {
    const items = document.querySelectorAll("[data-parallax]");
    if (!items.length) return;

    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      items.forEach((el) => {
        const speed = Number(el.dataset.parallax) || 0.1;
        el.style.transform = `translateY(${y * speed}px) rotate(var(--rot, 0deg))`;
      });
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true },
    );
    update();
  }

  /* ------------------------------------------------------------------ *
   * Magnetic buttons — the primary CTAs drift a few pixels toward the
   * cursor, then spring back. Skipped on touch devices and for anyone
   * who has asked for reduced motion.
   * ------------------------------------------------------------------ */

  function initMagnetic() {
    document.querySelectorAll(".btn-magnetic").forEach((btn) => {
      const strength = 0.45;

      btn.addEventListener("mousemove", (e) => {
        const rect = btn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        btn.style.transform = `translate(${dx * strength}px, ${dy * strength}px)`;
      });

      btn.addEventListener("mouseleave", () => {
        btn.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Card tilt for the puzzle demo shell — a subtle 3D lean toward the
   * cursor. Frozen while the pointer is over the board/tray so it never
   * fights with actually dragging a piece.
   * ------------------------------------------------------------------ */

  function initTilt() {
    const shell = document.querySelector(".puzzle-shell");
    if (!shell) return;
    const stage = shell.querySelector(".puzzle-stage");
    const maxTilt = 6;

    shell.style.transition = "transform 0.15s ease-out";

    shell.addEventListener("mousemove", (e) => {
      if (stage && e.target.closest(".puzzle-stage")) return;
      const rect = shell.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      shell.style.transform = `perspective(1000px) rotateX(${-py * maxTilt}deg) rotateY(${px * maxTilt}deg)`;
    });

    shell.addEventListener("mouseleave", () => {
      shell.style.transform = "";
    });
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
    let pieceUid = 0;

    // A fixed connector layout so tabs and blanks interlock correctly between
    // neighbours. H[row][col] is the seam between piece (row,col) and
    // (row,col+1): +1 = left piece has the tab. V[row][col] is the seam
    // between (row,col) and (row+1,col): +1 = the upper piece has the tab.
    const H = [
      [1, -1],
      [-1, 1],
      [1, -1],
    ];
    const V = [
      [1, -1, 1],
      [-1, 1, -1],
    ];
    const TAB_R = 13; // knob radius, in the piece's own 0-100 viewBox units

    function edgeType(row, col, side) {
      if (side === "top") {
        return row === 0 ? "flat" : V[row - 1][col] === 1 ? "blank" : "tab";
      }
      if (side === "bottom") {
        return row === GRID - 1 ? "flat" : V[row][col] === 1 ? "tab" : "blank";
      }
      if (side === "right") {
        return col === GRID - 1 ? "flat" : H[row][col] === 1 ? "tab" : "blank";
      }
      // left
      return col === 0 ? "flat" : H[row][col - 1] === 1 ? "blank" : "tab";
    }

    /**
     * The jigsaw outline for piece (row,col) as an SVG path, in a 0-100
     * viewBox. Traversed clockwise, which is what makes a single rule work
     * for every edge: a tab (bump away from the piece) always sweeps 0, a
     * blank (notch into the piece) always sweeps 1 — regardless of which
     * side it's on — because clockwise travel always keeps the piece's own
     * interior on the traveller's right.
     */
    function piecePath(row, col) {
      const corners = [
        [0, 0],
        [100, 0],
        [100, 100],
        [0, 100],
      ];
      const sides = ["top", "right", "bottom", "left"];
      let d = `M ${corners[0][0]},${corners[0][1]} `;

      for (let i = 0; i < 4; i++) {
        const [x1, y1] = corners[i];
        const [x2, y2] = corners[(i + 1) % 4];
        const type = edgeType(row, col, sides[i]);

        if (type === "flat") {
          d += `L ${x2},${y2} `;
          continue;
        }

        const p1x = x1 + (x2 - x1) * 0.37;
        const p1y = y1 + (y2 - y1) * 0.37;
        const p2x = x1 + (x2 - x1) * 0.63;
        const p2y = y1 + (y2 - y1) * 0.63;
        const sweep = type === "tab" ? 0 : 1;
        d += `L ${p1x},${p1y} A ${TAB_R} ${TAB_R} 0 0 ${sweep} ${p2x},${p2y} L ${x2},${y2} `;
      }

      return `${d}Z`;
    }

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
        const row = Math.floor(i / GRID);
        const col = i % GRID;
        const d = piecePath(row, col);

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
        slot.innerHTML = `<svg class="puzzle-slot-outline" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}"/></svg>`;
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
      const row = Math.floor(correctIndex / GRID);
      const col = correctIndex % GRID;
      const d = piecePath(row, col);
      const clipId = `piece-clip-${pieceUid++}`;

      const piece = document.createElement("div");
      piece.className = "puzzle-piece";
      piece.dataset.correct = String(correctIndex);
      piece.setAttribute("role", "button");
      piece.setAttribute("tabindex", "0");
      piece.setAttribute("aria-label", `Puzzle piece ${correctIndex + 1}`);

      // The face is an actual jigsaw silhouette, not a plain square: the
      // shared image is clipped to the piece's own tab/blank outline, then
      // shifted by its row/col so the right slice of the picture shows
      // through — the same slicing math as a CSS background-position, just
      // done in the SVG's own coordinate space so it clips correctly too.
      piece.innerHTML = `
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs><clipPath id="${clipId}"><path d="${d}"/></clipPath></defs>
          <image href="assets/puzzle-demo.svg" xlink:href="assets/puzzle-demo.svg"
                 x="${-col * 100}" y="${-row * 100}" width="300" height="300"
                 preserveAspectRatio="none" clip-path="url(#${clipId})"></image>
          <path d="${d}" class="piece-outline"></path>
        </svg>`;

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
      let w = 0;
      let h = 0;

      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        if (!dragging && Math.hypot(dx, dy) > 6) {
          dragging = true;
          clearSelection();
          // Pick the piece itself up (rather than dragging a copy) so the
          // exact jigsaw shape follows the pointer, at its true render size.
          const rect = piece.getBoundingClientRect();
          w = rect.width;
          h = rect.height;
          Object.assign(piece.style, {
            position: "fixed",
            width: `${w}px`,
            height: `${h}px`,
            left: `${ev.clientX - w / 2}px`,
            top: `${ev.clientY - h / 2}px`,
            zIndex: "80",
            pointerEvents: "none",
            transform: "scale(1.08)",
            filter: "drop-shadow(0 18px 26px rgba(20,17,23,.45))",
          });
          document.body.appendChild(piece);
        }

        if (dragging) {
          piece.style.left = `${ev.clientX - w / 2}px`;
          piece.style.top = `${ev.clientY - h / 2}px`;
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

        const target = document
          .elementFromPoint(ev.clientX, ev.clientY)
          ?.closest(".puzzle-slot");
        board
          .querySelectorAll(".puzzle-slot")
          .forEach((s) => s.classList.remove("drag-over"));
        unstickPiece(piece);

        place(piece, target);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp, { once: true });
    }

    function unstickPiece(piece) {
      Object.assign(piece.style, {
        position: "",
        left: "",
        top: "",
        width: "",
        height: "",
        zIndex: "",
        pointerEvents: "",
        transform: "",
        filter: "",
      });
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
      const target = slot ? Number(slot.dataset.index) : NaN;
      const valid = slot && !slot.classList.contains("filled") && correct === target;

      if (!valid) {
        if (slot) shake(piece);
        tray.appendChild(piece);
        return;
      }

      if (!started) startTimer();

      piece.classList.add("placed");
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
