// Remove " ARC" e converte corretamente
function cleanNumber(str) {
    if (!str) return 0;
    return parseFloat(str.replace(" ARC", "").trim());
}

function renderActivity(transactions) {
    const list = document.getElementById("activity-list");
    list.innerHTML = "";

    transactions.forEach(tx => {
        const value = cleanNumber(tx.value).toFixed(6);
        const gas = cleanNumber(tx.gas).toFixed(6);
        const total = cleanNumber(tx.total).toFixed(6);

        const item = document.createElement("div");
        item.className = "activity-item";

        const direction = tx.from.toLowerCase() === userAddress.toLowerCase()
            ? "OUT"
            : "IN";

        item.innerHTML = `
            <div class="activity-row">
                <span class="type ${direction.toLowerCase()}">${direction}</span>
                <span class="value">${value} ARC</span>
            </div>

            <div class="activity-info">
                <span>Gas: ${gas} ARC</span>
                <span>Total: ${total} ARC</span>
            </div>

            <div class="activity-meta">
                <span>${tx.time}</span>
                <a href="${tx.link}" target="_blank">Open</a>
            </div>
        `;

        list.appendChild(item);
    });
}
