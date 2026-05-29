fetch("stats.json")
    .then(res => res.json())
    .then(data => {

        /* ------------------------------------------------------ */
        /* 1. PREPARE PLAYER LIST                                 */
        /* ------------------------------------------------------ */

        const players = Object.entries(data);

        // Sort by Elo
        players.sort((a, b) => b[1].elo - a[1].elo);

        const tbody = document.querySelector("#leaderboard tbody");
        let rank = 1;

        /* ------------------------------------------------------ */
        /* 2. BUILD TABLE ROWS                                    */
        /* ------------------------------------------------------ */

        for (const [id, p] of players) {

            const kd = p.lifetimeDeaths > 0 ? (p.lifetimeKills / p.lifetimeDeaths) : 0;

            const totalAvg =
                (p.hpMarginTotal + p.sndMarginTotal + p.overloadMarginTotal) /
                Math.max(1, p.hpMarginCount + p.sndMarginCount + p.overloadMarginCount);

            const marginClass = totalAvg >= 0 ? "good" : "bad";
            const kdClass = kd >= 1 ? "good" : "bad";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${rank++}</td>
                <td class="player-hover" data-id="${id}">${p.name}</td>

                <td class="elo-gold">${p.elo.toFixed(2)}</td>

                <td class="good clickable" data-id="${id}" data-type="wins">
                    ${p.hpWins + p.sndWins + p.overloadWins}
                </td>

                <td class="bad clickable" data-id="${id}" data-type="losses">
                    ${p.hpLosses + p.sndLosses + p.overloadLosses}
                </td>

                <td class="${marginClass}">
                    ${totalAvg.toFixed(2)}
                </td>

                <td class="${kdClass}">
                    ${kd.toFixed(2)}
                </td>
            `;

            tbody.appendChild(row);
        }

        /* ------------------------------------------------------ */
        /* 3. POPUP LOGIC                                         */
        /* ------------------------------------------------------ */

        const popup = document.getElementById("popup");
        const popupContent = document.getElementById("popup-content");

        document.querySelectorAll(".clickable").forEach(cell => {
            cell.addEventListener("click", () => {
                const id = cell.dataset.id;
                const p = data[id];

                popupContent.innerHTML = `
                    <h3>${p.name} — Wins/Losses</h3>

                    <p><strong>Hardpoint:</strong> 
                        <span class="good">${p.hpWins}W</span> / 
                        <span class="bad">${p.hpLosses}L</span>
                    </p>

                    <p><strong>SND:</strong> 
                        <span class="good">${p.sndWins}W</span> / 
                        <span class="bad">${p.sndLosses}L</span>
                    </p>

                    <p><strong>Overload:</strong> 
                        <span class="good">${p.overloadWins}W</span> / 
                        <span class="bad">${p.overloadLosses}L</span>
                    </p>

                    <p style="margin-top:10px; font-size:12px; color:#888;">Click anywhere to close</p>
                `;

                popup.classList.remove("hidden");
            });
        });

        popup.addEventListener("click", () => {
            popup.classList.add("hidden");
        });

        /* ------------------------------------------------------ */
        /* 4. BUILD MODE STATS FOR ALL PLAYERS                    */
        /* ------------------------------------------------------ */

        const modeStats = players.map(([id, p]) => {

            const hpKD = p.hpDeaths > 0 ? p.hpKills / p.hpDeaths : 0;
            const sndKD = p.sndDeaths > 0 ? p.sndKills / p.sndDeaths : 0;
            const ovlKD = p.overloadDeaths > 0 ? p.overloadKills / p.overloadDeaths : 0;

            const hpMargin = p.hpMarginCount > 0 ? p.hpMarginTotal / p.hpMarginCount : 0;
            const sndMargin = p.sndMarginCount > 0 ? p.sndMarginTotal / p.sndMarginCount : 0;
            const ovlMargin = p.overloadMarginCount > 0 ? p.overloadMarginTotal / p.overloadMarginCount : 0;

            const hpWR = (p.hpWins + p.hpLosses) > 0 ? p.hpWins / (p.hpWins + p.hpLosses) : 0;
            const sndWR = (p.sndWins + p.sndLosses) > 0 ? p.sndWins / (p.sndWins + p.sndLosses) : 0;
            const ovlWR = (p.overloadWins + p.overloadLosses) > 0 ? p.overloadWins / (p.overloadWins + p.overloadLosses) : 0;

            return {
                id,
                name: p.name,

                hpKD, sndKD, ovlKD,
                hpMargin, sndMargin, ovlMargin,
                hpWR, sndWR, ovlWR
            };
        });

        /* ------------------------------------------------------ */
        /* 5. PERCENTILE FUNCTION                                 */
        /* ------------------------------------------------------ */

        function percentile(value, arr) {
            const sorted = [...arr].sort((a, b) => a - b);
            const index = sorted.indexOf(value);
            return index / (sorted.length - 1);
        }

        /* ------------------------------------------------------ */
        /* 6. PREPARE ARRAYS FOR PERCENTILES                      */
        /* ------------------------------------------------------ */

        const hpKDList = modeStats.map(p => p.hpKD);
        const sndKDList = modeStats.map(p => p.sndKD);
        const ovlKDList = modeStats.map(p => p.ovlKD);

        const hpMarginList = modeStats.map(p => p.hpMargin);
        const sndMarginList = modeStats.map(p => p.sndMargin);
        const ovlMarginList = modeStats.map(p => p.ovlMargin);

        const hpWRList = modeStats.map(p => p.hpWR);
        const sndWRList = modeStats.map(p => p.sndWR);
        const ovlWRList = modeStats.map(p => p.ovlWR);

        /* ------------------------------------------------------ */
        /* 7. MODE RATING FUNCTION (60–99)                        */
        /* ------------------------------------------------------ */

        function modeRating(pKD, pW, pM) {
            const score = (0.45 * pKD) + (0.35 * pW) + (0.20 * pM);
            return 60 + Math.round(score * 39);
        }

        /* ------------------------------------------------------ */
        /* 8. RATING COLOUR CLASS SELECTOR                        */
        /* ------------------------------------------------------ */

        function ratingClass(value) {
            if (value >= 99) return "rating-legendary";
            if (value >= 80) return "rating-green";
            if (value >= 65) return "rating-yellow";
            return "rating-red";
        }

        /* ------------------------------------------------------ */
        /* 9. HOVER CARD LOGIC                                    */
        /* ------------------------------------------------------ */

        const card = document.getElementById("playerCard");
        const banner = document.getElementById("ratingBanner");

        function showCard(playerId) {
            const p = modeStats.find(x => x.id === playerId);

            // Percentiles
            const p_hpKD = percentile(p.hpKD, hpKDList);
            const p_sndKD = percentile(p.sndKD, sndKDList);
            const p_ovlKD = percentile(p.ovlKD, ovlKDList);

            const p_hpM = percentile(p.hpMargin, hpMarginList);
            const p_sndM = percentile(p.sndMargin, sndMarginList);
            const p_ovlM = percentile(p.ovlMargin, ovlMarginList);

            const p_hpW = percentile(p.hpWR, hpWRList);
            const p_sndW = percentile(p.sndWR, sndWRList);
            const p_ovlW = percentile(p.ovlWR, ovlWRList);

            // Ratings
            const hpRating = modeRating(p_hpKD, p_hpW, p_hpM);
            const sndRating = modeRating(p_sndKD, p_sndW, p_sndM);
            const ovlRating = modeRating(p_ovlKD, p_ovlW, p_ovlM);

            const ovr = Math.round((hpRating + sndRating + ovlRating) / 3);

            // Elements
            const ovrEl = document.getElementById("cardOVR");
            const hpEl = document.getElementById("hpRating");
            const sndEl = document.getElementById("sndRating");
            const ovlEl = document.getElementById("ovlRating");

            // Set text
            ovrEl.textContent = ovr;
            document.getElementById("cardName").textContent = p.name;

            document.getElementById("hpKD").textContent = p.hpKD.toFixed(2);
            document.getElementById("hpMargin").textContent = p.hpMargin.toFixed(2);
            hpEl.textContent = hpRating;

            document.getElementById("sndKD").textContent = p.sndKD.toFixed(2);
            document.getElementById("sndMargin").textContent = p.sndMargin.toFixed(2);
            sndEl.textContent = sndRating;

            document.getElementById("ovlKD").textContent = p.ovlKD.toFixed(2);
            document.getElementById("ovlMargin").textContent = p.ovlMargin.toFixed(2);
            ovlEl.textContent = ovlRating;

            /* -------------------------------------------------- */
            /* Apply rating colours                               */
            /* -------------------------------------------------- */

            ovrEl.className = ratingClass(ovr);
            hpEl.className = ratingClass(hpRating);
            sndEl.className = ratingClass(sndRating);
            ovlEl.className = ratingClass(ovlRating);

            /* -------------------------------------------------- */
            /* Apply flame animation ONLY for 99                  */
            /* -------------------------------------------------- */

            banner.classList.remove("flame");
            if (ovr >= 99) banner.classList.add("flame");

            /* -------------------------------------------------- */
            /* Show card                                          */
            /* -------------------------------------------------- */

            card.classList.remove("hidden");
        }

        function hideCard() {
            card.classList.add("hidden");
        }

      document.querySelectorAll(".player-hover").forEach(cell => {
    cell.addEventListener("click", () => {
        const id = cell.dataset.id;

        // If card is already showing this player → hide it
        if (!card.classList.contains("hidden") &&
            document.getElementById("cardName").textContent === cell.textContent) {
            hideCard();
            return;
        }

        // Otherwise show the card for this player
        showCard(id);
    });
});












