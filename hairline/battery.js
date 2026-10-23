/**
 * Battery: a 12-volt car battery, its six cells standing in a row on the
 * case floor between its two end walls, each wall carrying a post, the
 * positive one thicker. Each cell is as tall
 * as its charge; a dashed ring at full height shows what is missing. The
 * pointer's place along the battery sets the state of charge, and every cell
 * springs to it. At rest the battery is part charged and one cell sags
 * behind the others: the weak cell, the rest mark. Under the pointer the
 * positive post takes the bright, and the read-out gives charge and voltage.
 * The slider is the weak cell's wear, as a share of full height.
 *
 * The pattern: a continuous value. Springs, a hit test on fixed screen x, a
 * rest that is a composition.
 */
const {
  Cam, clamp, circ, facing, fit, lerp, prism, proj, rings, spring, stepS,
  flatDot, mk, place, pointer, put, register, disposer, solid,
} = HL;

const CELLS = 6, PITCH = 19, CW = 17.5, D = 40, H = 54, PB = 5, POST = 7, END = 12;
const L = CELLS * PITCH - (PITCH - CW), WEAK = 3, REST = 0.62, FLOOR = 0.07;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.72);
  fit(C, [[-END - 6, -6, -PB], [L + END + 6, D + 6, -PB], [L + END + 6, -6, -PB], [-END - 6, D + 6, -PB], [-END, 0, H + POST], [L + END, D, H + POST]], 200, 166);
  const P = proj(C), front = facing(C);
  let wear = value, soc = null;

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-END - 6, -6, L + END + 6, D + 6, 8, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));

  // An end wall of the case, full height, with its round post standing on the lid.
  const end = (x0, R) => {
    const [er, ei] = rings(x0, 0, x0 + END - 1.5, D, 3, 1);
    put(solid(g), prism(P, front, er, ei, 0, H));
    const cx = x0 + (END - 1.5) / 2, at = (s) => ({ ...s, u: s.u + cx, v: s.v + D / 2 });
    const el = solid(g);
    put(el, prism(P, front, circ(R, 16).map(at), circ(R - 1.2, 16).map(at), H, H + POST));
    return el;
  };
  // Back to front: the negative end at the far end, the full-level guide, the cells, the positive end.
  end(-END, 4.4);
  const [gr] = rings(0, 0, L, D, 3, 1);
  mk("path", { class: "dash nf", d: "M" + gr.map((s) => P(s.u, s.v, H).join(",")).join("L") + "Z" }, g);

  const cells = [];
  for (let i = 0; i < CELLS; i++) {
    const x0 = i * PITCH;
    const [ring, inner] = rings(x0, 0, x0 + CW, D, 3, 1);
    const el = solid(g);
    const cap = flatDot(g, C, 1.1, "dot m");
    cells.push({ i, x0, ring, inner, el, cap, sp: spring(0, { eps: 0.04 }), drawn: NaN });
  }
  const plus = end(L + 1.5, 5.6);

  const level = (c) => {
    const s = soc ?? REST, sag = c.i === WEAK ? wear : 0;
    return H * clamp(s - sag, FLOOR, 1);
  };
  cells.forEach((c) => { c.sp.x = c.sp.t = level(c); });

  function drawCell(c) {
    const h = Math.max(1, c.sp.x);
    if (h === c.drawn) return;
    c.drawn = h;
    put(c.el, prism(P, front, c.ring, c.inner, 0, h));
    place(c.cap, P(c.x0 + CW / 2, D / 2, h));
  }
  function mark() {
    cells[WEAK].el.sil.classList.toggle("hi", soc === null);
    plus.sil.classList.toggle("hi", soc !== null);
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const c of cells) { if (stepS(c.sp, dt)) m = true; drawCell(c); }
    return m;
  });
  bag.add(B.unregister);

  // Screen x along the battery, from the first cell's middle to the last: fixed, so the hit never moves.
  const xa = P(CW / 2, D / 2, 0)[0], xb = P(L - CW / 2, D / 2, 0)[0];

  function retarget() {
    for (const c of cells) c.sp.t = level(c);
    if (soc === null) read.textContent = "rest";
    else {
      const v = lerp(11.9, 12.65, soc);
      read.textContent = `${Math.round(soc * 100)}% · ${v.toFixed(2)}V`;
    }
    mark();
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { soc = clamp((p[0] - xa) / (xb - xa), 0, 1); retarget(); },
    leave: () => { soc = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  retarget();

  return {
    set: (v) => { wear = v; retarget(); },
    destroy: bag.dispose,
  };
}

hairline({
  name: "battery",
  means: "A car battery's six cells stand as tall as its charge; move along it to charge or drain it and read the voltage.",
  rules: [1, 3, 5, 6],
  range: [0.04, 0.14, 0.28],
  tour: [[166, 200], [252, 205], [200, 195], null],
  mount,
});
