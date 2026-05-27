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

            const margin = stats.averageMargin ?? 0;

            const kdClass = kd >= 1 ? "good" : "bad";
            const marginClass = margin >= 0 ? "good" : "bad";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${rank++}</td>
                <td>${stats.name}</td>
                <td>${stats.elo.toFixed(1)}</td>
                <td class="${kdClass}">${kd.toFixed(2)}</td>
                <td class="good clickable" data-id="${id}" data-type="wins">${stats.wins}</td>
                <td class="bad clickable" data-id="${id}" data-type="losses">${stats.losses}</td>
                <td class="${marginClass}">${margin.toFixed(1)}</td>
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

                popupContent.innerHTML = `
                    <h3>${player.name} — Mode Breakdown</h3>
                    <p><strong>Hardpoint:</strong> ${player.hpWins}W / ${player.hpLosses}L</p>
                    <p><strong>SND:</strong> ${player.sndWins}W / ${player.sndLosses}L</p>
                    <p><strong>Overload:</strong> ${player.ovrWins}W / ${player.ovrLosses}L</p>
                    <p style="margin-top:10px; font-size:12px; color:#666;">Click anywhere to close</p>
                `;

                popup.classList.remove("hidden");
            });
        });

        popup.addEventListener("click", () => {
            popup.classList.add("hidden");
        });
    });


