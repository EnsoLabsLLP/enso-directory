/* Enso directory: filters, profiles, video intros and request forms. Data comes from the page. */
(function () {
  "use strict";
  const DATA = JSON.parse(document.getElementById("enso-data").textContent);
  const ICONS = DATA.icons, CAT = DATA.catalog, PEOPLE = DATA.people;

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ic = (n, c = "") => `<svg class="ic ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n] || ""}</svg>`;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TIMES = Object.fromEntries(CAT.times.map((t) => [t.id, t]));
  const FEES = CAT.fees.map((f) => ({ ...f, test: (v) => v >= f.min && (f.max == null || v <= f.max) }));
  const CONCERN = Object.fromEntries(CAT.concerns.map((c) => [c.id, c]));
  const CLIENT = Object.fromEntries(CAT.clients.map((c) => [c.id, c]));
  const FOR = Object.fromEntries(CAT.forWhom.map((f) => [f.id, f]));
  const C = (id) => (id.startsWith("custom:") ? { id, label: id.slice(7), icon: "sparkles" } : CONCERN[id] || { id, label: id, icon: "sparkles" });
  const G = (id) => (id.startsWith("custom:") ? { id, label: id.slice(7), icon: "users" } : CLIENT[id] || { id, label: id, icon: "users" });
  const wayKey = (id) => (id.startsWith("custom:") ? id : id.split(":")[0]);
  const W = (id) => {
    if (id.startsWith("custom:")) { const l = id.slice(7); return { short: l, name: l, about: "", icon: "check" }; }
    const [base, flag] = id.split(":");
    const w = CAT.ways.find((x) => x.id === base) || { short: base, name: base, about: "", icon: "check" };
    return flag === "training" ? { ...w, short: w.short + " (in training)", name: w.name + " (in training)" } : w;
  };
  const fee = (n) => (n == null ? "On request" : "₹" + Number(n).toLocaleString("en-IN"));
  const initials = (n) => { const w = String(n).trim().split(/\s+/); return (w[0][0] + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase(); };
  const first = (n) => String(n).trim().split(/\s+/)[0];
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const badgeIcon = (l) => (/advis/i.test(l) ? "user-star" : /creative/i.test(l) ? "palette" : "rosette-discount-check");
  const badges = (p) => (p.badges.length ? `<ul class="badges">${p.badges.map((b) => `<li class="badge">${ic(badgeIcon(b))}${esc(b)}</li>`).join("")}</ul>` : "");
  const avatar = (p, c = "") =>
    p.photo
      ? `<div class="avatar ${c}"><img src="${esc(p.photo)}" alt="" loading="lazy" decoding="async"></div>`
      : `<div class="avatar ${c}" aria-hidden="true">${esc(initials(p.name))}</div>`;
  const LANGS = [...new Set(PEOPLE.flatMap((p) => p.languages))];
  const WAY_KEYS = [...new Set(PEOPLE.flatMap((p) => p.ways.map(wayKey)))];
  const howMany = (key, id) => PEOPLE.filter((p) => p[key].includes(id)).length;
  const covered = (key, list) => list.filter((x) => howMany(key, x.id));
  const CONCERNS_COVERED = covered("concerns", CAT.concerns);
  const CLIENTS_COVERED = covered("clients", CAT.clients);
  /* Tiles: the featured concerns first, topped up with the most common others; the rest sit in "Show all" */
  const FEATURED = CAT.featured.map((id) => CONCERN[id]).filter((c) => c && howMany("concerns", c.id));
  const TILE_LIST = [...FEATURED, ...CONCERNS_COVERED.filter((c) => !FEATURED.includes(c)).sort((a, b) => howMany("concerns", b.id) - howMany("concerns", a.id)).slice(0, Math.max(0, 10 - FEATURED.length))];
  const MORE_LIST = CONCERNS_COVERED.filter((c) => !TILE_LIST.includes(c));
  const inGroups = (groups, items, render) => groups.map((g) => {
    const its = items.filter((x) => x.category === g.id);
    return its.length ? render(g, its) : "";
  }).join("");
  const option = (v, l) => `<option value="${esc(v)}">${esc(l)}</option>`;
  const optgroups = (groups, items, label) => inGroups(groups, items, (g, its) => `<optgroup label="${esc(g.label)}">${its.map((x) => option(x.id, label(x))).join("")}</optgroup>`);
  const shortList = (labels, n = 4) => labels.slice(0, n).join(", ") + (labels.length > n ? ` +${labels.length - n} more` : "");

  function videoEmbed(url, title, poster) {
    const t = esc(title);
    let m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{6,})/);
    if (m) return `<div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${esc(m[1])}?rel=0" title="${t}" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
    if (m) return `<div class="vframe"><iframe src="https://drive.google.com/file/d/${esc(m[1])}/preview" title="${t}" allow="autoplay; fullscreen" allowfullscreen loading="lazy"></iframe></div>`;
    m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (m) return `<div class="vframe"><iframe src="https://player.vimeo.com/video/${esc(m[1])}" title="${t}" allow="fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
    return `<video class="vplayer" src="${esc(url)}" controls preload="metadata" playsinline${poster ? ` poster="${esc(poster)}"` : ""} aria-label="${t}"></video>`;
  }

  /* ---------- Filtering ---------- */
  const state = { concerns: new Set(), client: "", lang: "", time: "", fee: "", way: "", creative: false, q: "", sort: "featured" };
  const clientIds = (v) => (v.startsWith("for:") ? (FOR[v.slice(4)] || { clients: [] }).clients : [v]);
  const lowerFirst = (t) => (/^[A-Z][a-z]/.test(t) ? t[0].toLowerCase() + t.slice(1) : t);
  const clientLabel = (v) => (v.startsWith("for:") ? "For " + lowerFirst((FOR[v.slice(4)] || { label: "" }).label) : "Works with " + lowerFirst(G(v).label));

  function matches(p, s) {
    if ([...s.concerns].some((c) => !p.concerns.includes(c))) return false;
    if (s.client && !clientIds(s.client).some((c) => p.clients.includes(c))) return false;
    if (s.lang && !p.languages.includes(s.lang)) return false;
    if (s.time && !p.avail.includes(s.time)) return false;
    if (s.fee && (p.fee == null || !FEES.find((f) => f.id === s.fee).test(p.fee))) return false;
    if (s.way && !p.ways.map(wayKey).includes(s.way)) return false;
    if (s.creative && !p.creative) return false;
    if (s.q) {
      const hay = [p.name, p.role, p.place, p.summary, p.about, ...p.languages,
        ...p.concerns.flatMap((c) => [C(c).label, ...(C(c).aliases || [])]),
        ...p.clients.flatMap((c) => [G(c).label, ...(G(c).aliases || [])]),
        ...p.ways.flatMap((w) => [W(w).name, W(w).short, ...(W(w).aliases || [])])].join(" ").toLowerCase();
      if (!s.q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t))) return false;
    }
    return true;
  }

  const chip = (k, v, label, icon) => `<button type="button" class="fchip" data-k="${k}" data-v="${esc(v)}" aria-pressed="false">${icon ? ic(icon) : ""}${esc(label)}</button>`;
  const HELP_CARD = `<span class="ibox">${ic("user-search")}</span><h3>Not sure who to choose?</h3><p>Tell us a little about what's going on and we'll suggest someone who fits.</p><a class="btn inverse" href="#help-me-choose">Help me choose</a>`;

  $("#helpSide").innerHTML = HELP_CARD;
  $("#tiles").innerHTML = TILE_LIST.map((c) =>
    `<button type="button" class="tile" data-c="${c.id}" aria-pressed="false" title="${esc(c.description || "")}"><span class="ibox">${ic(c.icon)}</span><span><strong>${esc(c.label)}</strong><small>${plural(howMany("concerns", c.id), "practitioner")}</small></span></button>`
  ).join("");
  $("#cbrowse").innerHTML = inGroups(CAT.concernGroups, MORE_LIST, (g, its) =>
    `<div class="cb-group"><h3>${ic(g.icon)}${esc(g.label)}</h3><div class="fchips">${its.map((c) => `<button type="button" class="fchip" data-c="${c.id}" aria-pressed="false" title="${esc(c.description || "")}">${ic(c.icon)}${esc(c.label)}<span class="n">${howMany("concerns", c.id)}</span></button>`).join("")}</div></div>`);

  /* On phones only the first few tiles show; everywhere, the less common concerns wait behind "Show all" */
  const TILE_PREVIEW = 4;
  const moreBtn = $("#tilesMore");
  if (moreBtn && (TILE_LIST.length > TILE_PREVIEW || MORE_LIST.length)) {
    const setMore = (open) => {
      $("#tiles").classList.toggle("expanded", open);
      $("#cbrowse").hidden = !open || !MORE_LIST.length;
      moreBtn.setAttribute("aria-expanded", open);
      moreBtn.innerHTML = open ? `Show fewer ${ic("chevron-down", "up")}` : `Show all ${CONCERNS_COVERED.length} concerns ${ic("chevron-down")}`;
    };
    setMore(false);
    moreBtn.hidden = false;
    moreBtn.classList.toggle("has-more", MORE_LIST.length > 0);
    moreBtn.addEventListener("click", () => setMore(!$("#tiles").classList.contains("expanded")));
  }
  const customWays = WAY_KEYS.filter((k) => k.startsWith("custom:"));
  $("#fbody").innerHTML = `
    ${CONCERNS_COVERED.length ? `<div class="fgroup"><label class="h4" for="fConcern">Can help with</label><div class="select-wrap"><select id="fConcern"><option value="">Add a concern</option>${optgroups(CAT.concernGroups, CONCERNS_COVERED, (c) => c.label)}</select></div></div>` : ""}
    ${CLIENTS_COVERED.length ? `<div class="fgroup"><label class="h4" for="fClient">Works with</label><div class="select-wrap"><select id="fClient"><option value="">Anyone</option>${optgroups(CAT.clientGroups, CLIENTS_COVERED, (c) => c.label + (c.ages ? ` (${c.ages})` : ""))}</select></div></div>` : ""}
    ${LANGS.length ? `<div class="fgroup"><h4>Language</h4><div class="fchips">${LANGS.map((l) => chip("lang", l, l)).join("")}</div></div>` : ""}
    <div class="fgroup"><h4>When you're free</h4><div class="fchips">${CAT.times.map((t) => chip("time", t.id, t.label, t.icon)).join("")}</div></div>
    <div class="fgroup"><h4>Fee per session</h4><div class="fchips">${FEES.map((f) => chip("fee", f.id, f.label)).join("")}</div></div>
    <div class="fgroup"><label class="h4" for="fWay">Way of working</label><div class="select-wrap"><select id="fWay"><option value="">Any approach</option>${optgroups(CAT.wayGroups, CAT.ways.filter((w) => WAY_KEYS.includes(w.id)), (w) => w.short)}${customWays.length ? `<optgroup label="Other">${customWays.map((k) => option(k, W(k).short)).join("")}</optgroup>` : ""}</select></div></div>
    <label class="check"><input type="checkbox" id="fCreative"><span>Offers creative therapies <span class="m">(art, drama, play, expressive arts)</span></span></label>
    <div><button class="textbtn" type="button" data-clear>Clear all filters</button></div>`;
  if (matchMedia("(min-width: 961px)").matches) $("#filters").open = true;

  $("#fbody").addEventListener("click", (e) => {
    const b = e.target.closest(".fchip"); if (!b) return;
    state[b.dataset.k] = state[b.dataset.k] === b.dataset.v ? "" : b.dataset.v; render();
  });
  $("#fWay").addEventListener("change", (e) => { state.way = e.target.value; render(); });
  if ($("#fConcern")) $("#fConcern").addEventListener("change", (e) => { if (e.target.value) state.concerns.add(e.target.value); e.target.value = ""; render(); });
  if ($("#fClient")) $("#fClient").addEventListener("change", (e) => { state.client = e.target.value; render(); });
  $("#fCreative").addEventListener("change", (e) => { state.creative = e.target.checked; render(); });
  $("#fSort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
  $("#q").addEventListener("input", (e) => { state.q = e.target.value.trim(); render(); });
  $("#searchForm").addEventListener("submit", (e) => { e.preventDefault(); $("#results").scrollIntoView({ behavior: reduce() ? "auto" : "smooth" }); });
  $(".concerns").addEventListener("click", (e) => {
    const t = e.target.closest("[data-c]"); if (!t) return;
    const id = t.dataset.c; state.concerns.has(id) ? state.concerns.delete(id) : state.concerns.add(id); render();
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear]")) clearAll();
    const rm = e.target.closest("[data-rm]"); if (rm) removeFilter(rm.dataset.rm);
    const bk = e.target.closest("[data-book]"); if (bk) book(bk.dataset.book);
    if (e.target.closest("[data-other]")) pendingOther = true;
    const vd = e.target.closest("[data-video]");
    if (vd) {
      pending = "video";
      const s = decodeURIComponent(vd.getAttribute("href").slice(1));
      if (location.hash === "#" + s) { e.preventDefault(); openDrawer("profile", s); }
    }
  });

  function clearAll() {
    Object.assign(state, { client: "", lang: "", time: "", fee: "", way: "", creative: false, q: "" }); state.concerns.clear();
    $("#q").value = ""; render();
  }
  function removeFilter(key) {
    const i = key.indexOf(":"), k = i < 0 ? key : key.slice(0, i), v = i < 0 ? "" : key.slice(i + 1);
    if (k === "concern") state.concerns.delete(v); else if (k === "creative") state.creative = false; else state[k] = "";
    if (k === "q") $("#q").value = "";
    render();
  }
  function activeFilters() {
    const a = [...state.concerns].map((c) => ({ key: "concern:" + c, label: C(c).label }));
    if (state.client) a.push({ key: "client", label: clientLabel(state.client) });
    if (state.lang) a.push({ key: "lang", label: state.lang });
    if (state.time) a.push({ key: "time", label: TIMES[state.time].label });
    if (state.fee) a.push({ key: "fee", label: FEES.find((f) => f.id === state.fee).label });
    if (state.way) a.push({ key: "way", label: W(state.way).short });
    if (state.creative) a.push({ key: "creative", label: "Creative therapies" });
    if (state.q) a.push({ key: "q", label: `“${state.q}”` });
    return a;
  }

  /* Concerns you've picked come first on a card, then the common ones */
  function rankConcerns(ids) {
    const picked = [...state.concerns];
    const score = (id) => (picked.includes(id) ? picked.indexOf(id) - 100 : CAT.featured.includes(id) ? CAT.featured.indexOf(id) : 50);
    return ids.map((id, i) => [id, score(id), i]).sort((a, b) => a[1] - b[1] || a[2] - b[2]).map((x) => x[0]);
  }
  function card(p) {
    const ranked = rankConcerns(p.concerns);
    const shown = ranked.slice(0, 4), extra = ranked.length - shown.length;
    const slug = esc(p.slug), name = esc(p.name);
    return `<article class="card">
      <div class="av-wrap">${avatar(p)}${p.video ? `<a class="play" href="#${slug}" data-video aria-label="Watch ${name}'s intro video">${ic("player-play")}</a>` : ""}</div>
      <div class="c-main">
        <div class="c-title"><h3><a href="#${slug}">${name}</a></h3></div>
        <p class="role">${esc(p.role)}</p>
        ${badges(p)}
        <ul class="info">
          ${p.place ? `<li>${ic("map-pin")}${esc(p.place)}</li>` : ""}
          ${p.exp ? `<li>${ic("briefcase")}${esc(p.exp)} experience</li>` : ""}
          ${p.languages.length ? `<li>${ic("language")}${esc(p.languages.join(", "))}</li>` : ""}
          ${p.video ? `<li>${ic("player-play")}<a href="#${slug}" data-video>Watch intro</a></li>` : ""}
        </ul>
        <p class="summary">${esc(p.summary)}</p>
        ${shown.length ? `<ul class="tags">${shown.map((c) => `<li class="tag">${ic(C(c).icon)}${esc(C(c).label)}</li>`).join("")}${extra > 0 ? `<li class="tag more">+${extra} more</li>` : ""}</ul>` : ""}
        ${p.clients.length ? `<p class="works">${ic("users")}<span><span class="lbl">Works with</span> ${esc(shortList(p.clients.map((c) => G(c).label)))}</span></p>` : ""}
        ${p.avail.length ? `<ul class="times"><li class="lbl">Usually free:</li>${p.avail.map((k) => `<li class="slot">${ic(TIMES[k].icon)}${TIMES[k].label}</li>`).join("")}</ul>` : ""}
      </div>
      <div class="c-side">
        <div class="price"><span class="amt">${fee(p.fee)}</span><span class="per">${p.fee != null ? "per session" : "Fee shared on request"}</span></div>
        <p class="mode">${ic("video")}Online session</p>
        <button class="btn block" type="button" data-book="${slug}">${ic("calendar-check")}Book session</button>
        <a class="btn ghost block" href="#${slug}">View profile</a>
      </div>
    </article>`;
  }

  function render() {
    const list = PEOPLE.filter((p) => matches(p, state));
    const s = state.sort;
    list.sort((a, b) =>
      s === "feeAsc" ? (a.fee ?? 1e9) - (b.fee ?? 1e9)
        : s === "feeDesc" ? (b.fee ?? -1) - (a.fee ?? -1)
          : s === "exp" ? b.expYears - a.expYears || a.order - b.order
            : a.order - b.order);
    const cards = list.map(card);
    if (cards.length) cards.splice(Math.min(3, cards.length), 0, `<div class="help help-inline">${HELP_CARD}</div>`);
    if (PEOPLE.length) $("#list").innerHTML = cards.join("");
    $("#empty").hidden = !PEOPLE.length || list.length > 0;
    const act = activeFilters();
    $("#count").textContent = act.length ? `${plural(list.length, "practitioner")} ${list.length === 1 ? "matches" : "match"} your filters` : "";
    $("#active").innerHTML = act.map((f) => `<span class="apill">${esc(f.label)}<button type="button" data-rm="${esc(f.key)}" aria-label="Remove ${esc(f.label)}">${ic("x")}</button></span>`).join("");
    const side = act.filter((f) => !f.key.startsWith("concern") && f.key !== "q").length;
    $("#fcount").hidden = !side; $("#fcount").textContent = side;
    document.querySelectorAll(".concerns [data-c]").forEach((t) => t.setAttribute("aria-pressed", state.concerns.has(t.dataset.c)));
    document.querySelectorAll("#fbody .fchip").forEach((b) => b.setAttribute("aria-pressed", state[b.dataset.k] === b.dataset.v));
    $("#fWay").value = state.way; $("#fCreative").checked = state.creative;
    if ($("#fClient")) $("#fClient").value = state.client.startsWith("for:") ? "" : state.client;
  }
  render();

  /* ---------- Side sheet ---------- */
  const drawer = $("#drawer"), scrim = $("#scrim");
  let lastFocus = null, isOpen = false, pending = "", pendingOther = false;

  const radios = (name, opts) => opts.map((o, i) => `<label class="radio"><input type="radio" name="${name}" value="${esc(o.value)}"${i === 0 ? " checked" : ""}><span>${o.icon ? ic(o.icon) : ""}${esc(o.label)}</span></label>`).join("");
  const contactFields = (pre) => `
    <div class="two">
      <div><label class="lab" for="${pre}Name">Your name</label><input type="text" id="${pre}Name" autocomplete="name" maxlength="80"></div>
      <div><label class="lab" for="${pre}Phone">Phone or WhatsApp</label><input type="tel" id="${pre}Phone" autocomplete="tel" inputmode="tel" maxlength="24" placeholder="+91 98765 43210"></div>
    </div>
    <div><label class="lab" for="${pre}Email">Email <span class="opt">(optional)</span></label><input type="email" id="${pre}Email" autocomplete="email" maxlength="120"></div>`;
  const consent = (pre) => `
    <label class="check"><input type="checkbox" id="${pre}Consent"><span>Enso can contact me by phone, WhatsApp or email about this request.</span></label>
    <div class="hp" aria-hidden="true"><label for="${pre}Web">Leave this empty</label><input type="text" id="${pre}Web" tabindex="-1" autocomplete="off"></div>
    <p class="err" id="formErr" role="alert" hidden></p>`;

  /* Tags for a profile, grouped by category once there are more than a few */
  function tagBlock(ids, groups, get, threshold) {
    const order = (id) => { const i = Object.keys(get === C ? CONCERN : CLIENT).indexOf(id); return i < 0 ? 1e4 : i; };
    const tag = (id) => { const x = get(id); return `<li class="tag">${ic(x.icon)}${esc(x.label)}${x.ages ? `<small>${esc(x.ages)}</small>` : ""}</li>`; };
    const known = ids.filter((id) => !id.startsWith("custom:")).sort((a, b) => order(a) - order(b));
    const custom = ids.filter((id) => id.startsWith("custom:"));
    const cats = new Set(known.map((id) => get(id).category));
    if (ids.length <= threshold || cats.size < 2) return `<ul class="tags lg">${[...known, ...custom].map(tag).join("")}</ul>`;
    return `<div class="tgroups">${groups.map((g) => {
      const its = known.filter((id) => get(id).category === g.id);
      return its.length ? `<div class="tgroup"><h4>${esc(g.label)}</h4><ul class="tags lg">${its.map(tag).join("")}</ul></div>` : "";
    }).join("")}${custom.length ? `<div class="tgroup"><h4>Also</h4><ul class="tags lg">${custom.map(tag).join("")}</ul></div>` : ""}</div>`;
  }
  const forOptions = (p) => CAT.forWhom.filter((f) => f.id === "self" || !p || !p.clients.length || f.clients.some((c) => p.clients.includes(c)));

  function profileView(p) {
    const facts = [
      ["briefcase", "Experience", p.exp || "Shared soon"],
      ["language", "Languages", p.languages.join(", ") || "Shared soon"],
      ["map-pin", "Based in", p.place ? p.place + " (online sessions)" : "Online sessions"],
      ["currency-rupee", "Session fee", fee(p.fee)]
    ];
    const slots = [...p.avail.map((k) => ({ value: TIMES[k].label, label: TIMES[k].label, icon: TIMES[k].icon })), { value: "Any time that works", label: "Any time that works" }];
    return `<div class="d-top"><span class="eyebrow">Practitioner profile</span><button class="iconbtn" type="button" id="closeBtn" aria-label="Close">${ic("x")}</button></div>
    <div class="pw"><aside class="pw-side">
    <div class="p-head">${avatar(p, "lg")}<div><h2 id="dTitle">${esc(p.name)}</h2><p class="role">${esc(p.role)}</p>${badges(p)}</div></div>
    <dl class="dfacts">${facts.map(([i, a, b]) => `<div><dt>${ic(i)}${a}</dt><dd>${esc(b)}</dd></div>`).join("")}</dl>
    <button class="btn block" type="button" id="toReq">${ic("calendar-check")}Book a session</button>
    ${p.video ? `<section class="sec" id="intro"><h3>${ic("player-play")}Meet ${esc(first(p.name))}</h3>${videoEmbed(p.video, p.name + " introduction", p.photo)}</section>` : ""}
    </aside><div class="pw-main">
    <section class="sec"><h3>About</h3><p>${esc(p.summary)}</p>${p.about ? `<p class="about">${esc(p.about)}</p>` : ""}${!p.concerns.length && !p.ways.length && !p.clients.length ? `<p class="pending">${ic("sparkles")}<span>Full profile details are on their way.</span></p>` : ""}</section>
    ${p.concerns.length ? `<section class="sec"><h3>Can help with</h3>${tagBlock(p.concerns, CAT.concernGroups, C, 8)}</section>` : ""}
    ${p.clients.length ? `<section class="sec"><h3>I work with</h3>${tagBlock(p.clients, CAT.clientGroups, G, 4)}</section>` : ""}
    ${p.ways.length ? `<section class="sec"><h3>Ways of working</h3><ul class="ways">${p.ways.map((w) => `<li><span class="wi">${ic(W(w).icon || "check")}</span><div><strong>${esc(W(w).name)}</strong>${W(w).about ? `<p>${esc(W(w).about)}</p>` : ""}</div></li>`).join("")}</ul></section>` : ""}
    ${p.avail.length ? `<section class="sec"><h3>Usually available</h3><ul class="avail">${CAT.times.map((t) => `<li class="${p.avail.includes(t.id) ? "on" : ""}">${ic(t.icon)}${t.label}<small>${p.avail.includes(t.id) ? "Available" : "Not usually"}</small></li>`).join("")}</ul>${p.availNote ? `<p class="note">${esc(p.availNote)}</p>` : ""}</section>` : ""}
    ${p.education.length ? `<section class="sec"><h3>Education and registration</h3><ul class="edu">${p.education.map((t) => `<li>${ic(/regist|rci/i.test(t) ? "rosette-discount-check" : "school")}<span>${esc(t)}</span></li>`).join("")}</ul></section>` : ""}
    <section class="sec" id="req"><h3>Book a session with ${esc(first(p.name))}</h3>
      <div id="formWrap">
      <form class="form" id="reqForm" novalidate>
        ${contactFields("r")}
        <fieldset><legend class="lab">Who is the session for?</legend><div class="radios">${radios("rFor", forOptions(p).map((f) => ({ value: f.id, label: f.label, icon: f.icon })))}</div></fieldset>
        <fieldset><legend class="lab">Preferred time</legend><div class="radios">${radios("rTime", slots)}</div></fieldset>
        <div><label class="lab" for="rTopic">What would you like to talk about? <span class="opt">(optional)</span></label><textarea id="rTopic" rows="3" maxlength="1500"></textarea><p class="hint">Share only what you're comfortable with. A few words is plenty.</p></div>
        ${consent("r")}
        <div><button class="btn" type="submit">${ic("calendar-check")}Send request</button></div>
      </form>
      </div>
    </section>
    </div></div>`;
  }

  const HELP_FEATURED = CAT.featured.map((id) => CONCERN[id]).filter(Boolean);
  const HELP_MORE = CAT.concerns.filter((c) => !CAT.featured.includes(c.id));
  const helpBox = (c) => `<label class="radio"><input type="checkbox" name="hC" value="${c.id}"${c.crisisNote ? " data-crisis" : ""}><span>${ic(c.icon)}${esc(c.label)}</span></label>`;
  function helpView() {
    return `<div class="d-top"><span class="eyebrow">Matching help</span><button class="iconbtn" type="button" id="closeBtn" aria-label="Close">${ic("x")}</button></div>
    <div class="help-head"><span class="ibox">${ic("user-search")}</span><h2 id="dTitle">Help me choose</h2><p>Tell us a little about what you're looking for. We'll suggest a practitioner who fits and contact you to confirm a time.</p></div>
    <div id="formWrap" style="margin-top:20px">
    <form class="form" id="helpForm" novalidate>
      ${contactFields("h")}
      <fieldset><legend class="lab">Who is this for?</legend><div class="radios">${radios("hFor", CAT.forWhom.map((f) => ({ value: f.id, label: f.label, icon: f.icon })))}</div></fieldset>
      <fieldset><legend class="lab">What would you like help with? <span class="opt">(pick any)</span></legend>
        <div class="radios">${HELP_FEATURED.map(helpBox).join("")}<label class="radio"><input type="checkbox" id="hOtherToggle"><span>${ic("plus")}Something else</span></label></div>
        <button type="button" class="textbtn more-toggle" id="hMore" aria-expanded="false" aria-controls="hMoreList">See more concerns ${ic("chevron-down")}</button>
        <div class="more-list" id="hMoreList" hidden>${inGroups(CAT.concernGroups, HELP_MORE, (g, its) => `<div class="cb-group"><h4>${ic(g.icon)}${esc(g.label)}</h4><div class="radios">${its.map(helpBox).join("")}</div></div>`)}</div>
        <div class="other-field" id="hOtherWrap" hidden><label class="sr" for="hOther">What else would you like help with?</label><input type="text" id="hOther" maxlength="120" placeholder="Tell us in a few words, for example exam stress or OCD"></div>
        <p class="crisis" id="hCrisis" role="status" hidden>${ic("info-circle")}<span>${esc(CAT.crisisNote)}</span></p></fieldset>
      <fieldset><legend class="lab">Language</legend><div class="radios">${radios("hL", [{ value: "", label: "Any" }, ...LANGS.map((l) => ({ value: l, label: l })), { value: "__other", label: "Other language", icon: "plus" }])}</div>
        <div class="other-field" id="hLangWrap" hidden><label class="sr" for="hLangOther">Which language?</label><input type="text" id="hLangOther" maxlength="40" placeholder="Which language? For example Marathi or Tamil"></div></fieldset>
      <fieldset><legend class="lab">Preferred time</legend><div class="radios">${radios("hT", [{ value: "", label: "Any time" }, ...CAT.times.map((t) => ({ value: t.id, label: t.label, icon: t.icon }))])}</div></fieldset>
      <fieldset><legend class="lab">Budget per session</legend><div class="radios">${radios("hF", [{ value: "", label: "Any" }, ...FEES.map((f) => ({ value: f.id, label: f.label }))])}</div></fieldset>
      <div><label class="lab" for="hNote">Anything else we should know? <span class="opt">(optional)</span></label><textarea id="hNote" rows="3" maxlength="1500"></textarea><p class="hint">For example, a preference for a particular approach. Share only what you're comfortable with.</p></div>
      ${consent("h")}
      <div><button class="btn" type="submit">${ic("user-search")}Send request</button></div>
    </form>
    </div>`;
  }

  function readContact(pre) {
    const v = (id) => ($("#" + pre + id) || {}).value || "";
    const out = { name: v("Name").trim(), phone: v("Phone").trim(), email: v("Email").trim(), consent: $("#" + pre + "Consent").checked, website: v("Web") };
    let problem = "";
    if (!out.name) problem = "Add your name so we know who the request is from.";
    else if (!/^\+?[\d\s()-]{7,20}$/.test(out.phone)) problem = "Add a phone or WhatsApp number we can reach you on.";
    else if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)) problem = "Check your email address, or leave it blank.";
    else if (!out.consent) problem = "Tick the box so we can contact you about this request.";
    return { out, problem };
  }
  function showError(msg) {
    const e = $("#formErr"); e.innerHTML = `${ic("alert-circle")}<span>${esc(msg)}</span>`; e.hidden = false;
  }
  async function send(payload, btn) {
    const label = btn.innerHTML; btn.disabled = true; btn.textContent = "Sending…";
    try {
      const r = await fetch("/api/requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "We couldn't send your request. Check your connection and try again.");
      return j;
    } finally { btn.disabled = false; btn.innerHTML = label; }
  }
  function success(html) {
    const w = $("#formWrap"); w.innerHTML = `<div class="done" tabindex="-1" id="doneBox"><span class="ok">${ic("circle-check")}</span>${html}</div>`;
    $("#doneBox").focus({ preventScroll: true }); w.scrollIntoView({ block: "nearest", behavior: reduce() ? "auto" : "smooth" });
  }

  function wireProfile(p) {
    $("#toReq").addEventListener("click", () => scrollTo("#req", true, "#rName"));
    $("#reqForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const { out, problem } = readContact("r");
      if (problem) return showError(problem);
      $("#formErr").hidden = true;
      try {
        const res = await send({ type: "booking", practitionerId: p.slug, ...out, time: (document.querySelector('input[name="rTime"]:checked') || {}).value, forWhom: (document.querySelector('input[name="rFor"]:checked') || {}).value, message: $("#rTopic").value }, e.submitter || $("#reqForm button[type=submit]"));
        success(`<h4>Request sent</h4><p>Thanks, ${esc(first(out.name))}. The Enso team will contact you on ${esc(out.phone)} to confirm a time with ${esc(first(p.name))}.</p><p class="hint">Reference: ${esc(res.id)}</p>`);
      } catch (err) { showError(err.message); }
    });
  }
  function wireHelp() {
    const reveal = (wrap, show, input) => { $(wrap).hidden = !show; if (show) setTimeout(() => $(input).focus(), 30); };
    $("#hOtherToggle").addEventListener("change", (e) => reveal("#hOtherWrap", e.target.checked, "#hOther"));
    document.querySelectorAll('input[name="hL"]').forEach((r) => r.addEventListener("change", () => reveal("#hLangWrap", r.value === "__other" && r.checked, "#hLangOther")));
    if (pendingOther) { pendingOther = false; $("#hOtherToggle").checked = true; reveal("#hOtherWrap", true, "#hOther"); }
    $("#hMore").addEventListener("click", () => {
      const open = $("#hMoreList").hidden;
      $("#hMoreList").hidden = !open; $("#hMore").setAttribute("aria-expanded", open);
      $("#hMore").innerHTML = open ? `Fewer concerns ${ic("chevron-down", "up")}` : `See more concerns ${ic("chevron-down")}`;
    });
    $("#helpForm").addEventListener("change", (e) => {
      if (e.target.name === "hC") $("#hCrisis").hidden = !document.querySelector('input[name="hC"][data-crisis]:checked');
    });
    $("#helpForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const { out, problem } = readContact("h");
      if (problem) return showError(problem);
      $("#formErr").hidden = true;
      const cs = [...document.querySelectorAll('input[name="hC"]:checked')].map((i) => i.value);
      const val = (n) => (document.querySelector(`input[name="${n}"]:checked`) || {}).value || "";
      const T = val("hT"), F = val("hF"), who = val("hFor");
      const L = val("hL") === "__other" ? $("#hLangOther").value.trim() : val("hL");
      const otherConcern = $("#hOtherToggle").checked ? $("#hOther").value.trim() : "";
      if ($("#hOtherToggle").checked && !otherConcern) return showError("Tell us briefly what else you'd like help with, or untick Something else.");
      if (val("hL") === "__other" && !L) return showError("Type the language you'd like, or pick one from the list.");
      try {
        const res = await send({ type: "match", ...out, concerns: cs, otherConcern, forWhom: who, language: L, time: T ? TIMES[T].label : "Any time", budget: F, message: $("#hNote").value }, e.submitter || $("#helpForm button[type=submit]"));
        const client = who && who !== "self" ? "for:" + who : "";
        const sel = { concerns: new Set(cs), client, lang: L, time: T, fee: F, way: "", creative: false, q: "" };
        const k = PEOPLE.filter((x) => matches(x, sel)).length;
        success(`<h4>Request sent</h4><p>Thanks, ${esc(first(out.name))}. The Enso team will contact you on ${esc(out.phone)} with a suggestion and a time.</p><p class="hint">Reference: ${esc(res.id)}</p>${k ? `<p>${plural(k, "practitioner")} ${k === 1 ? "fits" : "fit"} what you picked. <button class="textbtn" type="button" id="seeMatches">See them</button></p>` : ""}`);
        if (k) $("#seeMatches").addEventListener("click", () => {
          Object.assign(state, { client, lang: L, time: T, fee: F, way: "", creative: false, q: "" }); state.concerns = new Set(cs); $("#q").value = "";
          render(); closeDrawer(true); setTimeout(() => $("#results").scrollIntoView({ behavior: reduce() ? "auto" : "smooth" }), 60);
        });
      } catch (err) { showError(err.message); }
    });
  }
  function scrollTo(sel, smooth, focusSel) {
    const el = $(sel); if (!el) return;
    const top = el.getBoundingClientRect().top - drawer.getBoundingClientRect().top + drawer.scrollTop - 12;
    drawer.scrollTo({ top, behavior: smooth && !reduce() ? "smooth" : "auto" });
    if (focusSel) setTimeout(() => { const f = $(focusSel); if (f) f.focus({ preventScroll: true }); }, smooth ? 400 : 320);
  }
  function openDrawer(kind, slug) {
    if (!isOpen) lastFocus = document.activeElement;
    const p = kind === "profile" ? PEOPLE.find((x) => x.slug === slug) : null;
    drawer.classList.toggle("wide", kind === "profile");
    drawer.innerHTML = kind === "help" ? helpView() : profileView(p);
    drawer.scrollTop = 0; isOpen = true;
    drawer.classList.add("open"); scrim.classList.add("open"); drawer.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("locked");
    ["#main", "#foot", "#top"].forEach((s) => ($(s).inert = true));
    $("#closeBtn").addEventListener("click", () => closeDrawer(true));
    kind === "help" ? wireHelp() : wireProfile(p);
    const want = pending; pending = "";
    if (want === "book" && p) requestAnimationFrame(() => scrollTo("#req", false, "#rName"));
    else if (want === "video" && p && p.video) requestAnimationFrame(() => scrollTo("#intro", false));
    else setTimeout(() => $("#closeBtn").focus({ preventScroll: true }), 50);
  }
  function closeDrawer(clearHash) {
    if (!isOpen) return;
    isOpen = false; drawer.classList.remove("open"); scrim.classList.remove("open"); drawer.setAttribute("aria-hidden", "true");
    drawer.querySelectorAll("video").forEach((v) => v.pause());
    setTimeout(() => { if (!isOpen) drawer.innerHTML = ""; }, 320);
    document.documentElement.classList.remove("locked");
    ["#main", "#foot", "#top"].forEach((s) => ($(s).inert = false));
    if (clearHash && location.hash) { try { history.replaceState(null, "", location.href.split("#")[0]); } catch (e) { location.hash = ""; } }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function book(slug) {
    pending = "book";
    if (location.hash === "#" + slug) openDrawer("profile", slug); else location.hash = slug;
  }
  scrim.addEventListener("click", () => closeDrawer(true));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) closeDrawer(true); });
  function route() {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h === "help-me-choose") openDrawer("help");
    else if (PEOPLE.some((p) => p.slug === h)) openDrawer("profile", h);
    else { pending = ""; closeDrawer(false); }
  }
  window.addEventListener("hashchange", route);
  route();

  /* Navbar shadow deepens once the page scrolls under it */
  const nav = $("#top");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
