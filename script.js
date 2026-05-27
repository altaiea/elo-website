fetch("stats.json")
    .then(res => res.json())
    .then(data => {
        const players = Object.entries(data);

        players.sort((a, b) => b[1].elo - a[1].elo);

        const tbody = document.querySelector("#leaderboard tbody");
        let rank = 1;

        for (const [id, stats] of players) {

            const kd = stats.lifetimeDeaths > 0
                ? (stats.lifetimeKills / stats.lifetimeDeaths)
                : 0;

            const avgMargin =
                (stats.hpMarginTotal + stats.sndMarginTotal + stats.overloadMarginTotal) /
                Math.max(1, stats.hpMarginCount + stats.sndMarginCount + stats.overloadMarginCount);

            const kdClass = kd >= 1 ? "good" : "bad";
            const marginClass = avgMargin >= 0 ? "good" : "bad";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${rank++}</td>
                <td>${stats.name}</td>
                <td>${stats.elo.toFixed(2)}</td>
                <td class="${kdClass}">${kd.toFixed(2)}</td>
                <td class="good clickable" data-id="${id}" data-type="wins">${stats.hpWins + stats.sndWins + stats.overloadWins}</td>
                <td class="bad clickable" data-id="${id}" data-type="losses">${stats.hpLosses + stats.sndLosses + stats.overloadLosses}</td>
                <td class="${marginClass}">${avgMargin.toFixed(2)}</td>
            `;

            tbody.appendChild(row);
        }

        // POPUP LOGIC
        const popup = document.getElementById("popup");
        const popupContent = document.getElementById("popup-content");

        document.querySelectorAll(".clickable").forEach(cell => {
            cell.addEventListener("click", () => {
                const id = cell.dataset.id;
                const player = data[id];

                const hpAvg = player.hpMarginCount > 0 ? (player.hpMarginTotal / player.hpMarginCount).toFixed(2) : "0.00";
                const sndAvg = player.sndMarginCount > 0 ? (player.sndMarginTotal / player.sndMarginCount).toFixed(2) : "0.00";
                const ovrAvg = player.overloadMarginCount > 0 ? (player.overloadMarginTotal / player.overloadMarginCount).toFixed(2) : "0.00";

                popupContent.innerHTML = `
                    <h3>${player.name} — Mode Breakdown</h3>

                    <p><strong>Hardpoint:</strong> ${player.hpWins}W / ${player.hpLosses}L  
                    <br>Avg Margin: ${hpAvg}</p>

                    <p><strong>SND:</strong> ${player.sndWins}W / ${player.sndLosses}L  
                    <br>Avg Margin: ${sndAvg}</p>

                    <p><strong>Overload:</strong> ${player.overloadWins}W / ${player.overloadLosses}L  
                    <br>Avg Margin: ${ovrAvg}</p>

                    <p style="margin-top:10px; font-size:12px; color:#666;">Click anywhere to close</p>
                `;

                popup.classList.remove("hidden");
            });
        });

        popup.addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    });



