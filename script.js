fetch("stats.json")
    .then(res => res.json())
    .then(data => {
        const players = Object.entries(data);

        // Sort by Elo descending
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
            const winClass = "good";
            const lossClass = "bad";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${rank++}</td>
                <td>${stats.name ?? ("Player " + id)}</td>
                <td>${stats.elo.toFixed(1)}</td>
                <td class="${kdClass}">${kd.toFixed(2)}</td>
                <td class="${winClass}">${stats.wins ?? 0}</td>
                <td class="${lossClass}">${stats.losses ?? 0}</td>
                <td class="${marginClass}">${margin.toFixed(1)}</td>
            `;

            tbody.appendChild(row);
        }
    })
    .catch(err => {
        console.error("Error loading stats.json:", err);
    });

