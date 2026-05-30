let allPlayers = [];
let showInactive = false;

// Fetch stats
fetch("stats.json")
    .then(res => res.json())
    .then(data => {
        allPlayers = Object.entries(data.players).map(([id, stats]) => ({
            id: Number(id),
            name: getPlayerName(id),
            ...stats
        }));

        renderTable();
        setupToggle();
    });

function setupToggle() {
    const toggle = document.getElementById("toggleInactive");
    toggle.addEventListener("change", () => {
        showInactive = toggle.checked;
        renderTable();
    });
}

function renderTable() {
    const tbody = document.getElementById("table-body");
    tbody.innerHTML = "";

    const filtered = allPlayers.filter(p => {
        const wins = p.hpWins + p.sndWins + p.overloadWins;
        const losses = p.hpLosses + p.sndLosses + p.overloadLosses;
        const kills = p.lifetimeKills;
        const deaths = p.lifetimeDeaths;

        const hasPlayed = (wins + losses + kills + deaths) > 0;
        return showInactive ? true : hasPlayed;
    });

    filtered.sort((a, b) => b.elo - a.elo);

    filtered.forEach((p, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML += `<td class="rank">${index + 1}</td>`;
        tr.innerHTML += `<td class="player-name" data-id="${p.id}">${p.name}</td>`;
        tr.innerHTML += `<td>${p.elo.toFixed(2)}</td>`;

        const wins = p.hpWins + p.sndWins + p.overloadWins;
        const losses = p.hpLosses + p.sndLosses + p.overloadLosses;
        const wl = losses === 0 ? wins : (wins / losses).toFixed(2);

        tr.innerHTML += `
            <td>
                <div class="wl-container">
                    ${wl}
                    <span class="wl-arrow">▼</span>
                    <div class="wl-dropdown">
                        <div class="wl-win">W ${wins}</div>
                        <div class="wl-loss">L ${losses}</div>
                    </div>
                </div>
            </td>
        `;

        const kd = p.lifetimeDeaths === 0 ? p.lifetimeKills : (p.lifetimeKills / p.lifetimeDeaths).toFixed(2);
        tr.innerHTML += `<td>${kd}</td>`;

        tbody.appendChild(tr);
    });

    enableWLDrops();
    enableModal(filtered);
}

function enableWLDrops() {
    document.querySelectorAll(".wl-container").forEach(container => {
        const dropdown = container.querySelector(".wl-dropdown");

        container.addEventListener("click", () => {
            dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
        });

        document.addEventListener("click", e => {
            if (!container.contains(e.target)) dropdown.style.display = "none";
        });
    });
}

// Player names
function getPlayerName(id) {
    const names = {
        1: "OBEY",
        2: "KAZZI",
        3: "SYMBRR",
        4: "EES",
        5: "NAGI",
        6: "AKEEB",
        7: "USMAAN",
        8: "AMAAN",
        9: "PARVEZ",
        10: "HAZZA",
        11: "HAIDERI",
        12: "NABEEL",
        13: "SAFY",
        14: "Unknown_14"
    };
    return names[id] || "Player " + id;
}

/* ---------------------------
   FIXED PERCENTILE ENGINE
---------------------------- */

function percentile(value, array) {
    const sorted = [...array].sort((a, b) => a - b);

    if (sorted.length <= 1) return 0;

    const below = sorted.filter(v => v < value).length;

    return below / (sorted.length - 1);
}

function computeModeRating(kd, kdArr, wr, wrArr, margin, marginArr, gamesPlayed) {
    const kdPct = percentile(kd, kdArr);
    const wrPct = percentile(wr, wrArr);
    const marginPct = percentile(margin, marginArr);

    const weighted =
        kdPct * 0.40 +
        wrPct * 0.30 +
        marginPct * 0.30;

    let rating = Math.round(57 + weighted * 42);

    const MIN_GAMES = 5;

    if (gamesPlayed < MIN_GAMES && rating > 95) {
        rating = 95;
    }

    return rating;
}

/* ---------------------------
   MODE COMPUTATION
---------------------------- */

function computeMode(prefix, p, players) {
    const kills = p[prefix + "Kills"];
    const deaths = p[prefix + "Deaths"];
    const wins = p[prefix + "Wins"];
    const losses = p[prefix + "Losses"];
    const marginTotal = p[prefix + "MarginTotal"];
    const marginCount = p[prefix + "MarginCount"];

    const kd = deaths === 0 ? kills : kills / deaths;
    const wr = (wins + losses) === 0 ? 0 : wins / (wins + losses);
    const margin = marginCount === 0 ? 0 : marginTotal / marginCount;

    const kdArr = players
        .filter(x => x[prefix + "Deaths"] + x[prefix + "Kills"] > 0)
        .map(x => x[prefix + "Kills"] / x[prefix + "Deaths"]);

    const wrArr = players
        .filter(x => x[prefix + "Wins"] + x[prefix + "Losses"] > 0)
        .map(x => x[prefix + "Wins"] / (x[prefix + "Wins"] + x[prefix + "Losses"]));

    const marginArr = players
        .filter(x => x[prefix + "MarginCount"] > 0)
        .map(x => x[prefix + "MarginTotal"] / x[prefix + "MarginCount"]);

    const gamesPlayed = wins + losses;

    const rating = computeModeRating(kd, kdArr, wr, wrArr, margin, marginArr, gamesPlayed);

    return { kd, wr, margin, rating };
}

/* ---------------------------
   CDL CARD MODAL
---------------------------- */

function enableModal(players) {
    const modal = document.getElementById("playerModal");
    const closeBtn = document.getElementById("closeModal");
    const card = document.getElementById("cdlCard");

    document.querySelectorAll(".player-name").forEach(el => {
        el.addEventListener("click", () => {
            const id = Number(el.dataset.id);
            const p = players.find(x => x.id === id);

            const hp = computeMode("hp", p, players);
            const snd = computeMode("snd", p, players);
            const ovl = computeMode("overload", p, players);

            const total = hp.rating + snd.rating + ovl.rating;
            const avg = Math.round(total / 3);

            card.innerHTML = `
                <div class="cdl-card">
                    <div class="cdl-overall">${avg}</div>
                    <div class="cdl-name">${p.name}</div>

                    <div class="cdl-mode">
                        <h3>Hardpoint</h3>
                        <div class="cdl-rating">${hp.rating}</div>
                        <div class="cdl-stat">K/D: ${hp.kd.toFixed(2)}</div>
                        <div class="cdl-stat">W/L: ${hp.wr.toFixed(2)}</div>
                        <div class="cdl-stat">Margin: ${hp.margin.toFixed(2)}</div>
                    </div>

                    <div class="cdl-mode">
                        <h3>Search & Destroy</h3>
                        <div class="cdl-rating">${snd.rating}</div>
                        <div class="cdl-stat">K/D: ${snd.kd.toFixed(2)}</div>
                        <div class="cdl-stat">W/L: ${snd.wr.toFixed(2)}</div>
                        <div class="cdl-stat">Margin: ${snd.margin.toFixed(2)}</div>
                    </div>

                    <div class="cdl-mode">
                        <h3>Overload</h3>
                        <div class="cdl-rating">${ovl.rating}</div>
                        <div class="cdl-stat">K/D: ${ovl.kd.toFixed(2)}</div>
                        <div class="cdl-stat">W/L: ${ovl.wr.toFixed(2)}</div>
                        <div class="cdl-stat">Margin: ${ovl.margin.toFixed(2)}</div>
                    </div>

                    <div class="cdl-totals">
                        <p>Total Rating: ${total}</p>
                        <p>Average Rating: ${avg}</p>
                    </div>
                </div>
            `;

            modal.style.display = "block";
        });
    });

    closeBtn.onclick = () => modal.style.display = "none";
    window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };
}



