
let headers = [];
let allData = [];
let filteredData = [];
let currentPage = 1;
let sortColumn = -1;
let sortAscending = true;

function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];

        if (char === '"') {
            if (quoted && text[i + 1] === '"') {
                value += '"';
                i++;
            } else {
                quoted = !quoted;
            }
        }

        else if (char === ',' && !quoted) {
            row.push(value);
            value = "";
        }

        else if ((char === '\n' || char === '\r') && !quoted) {

            if (char === '\r' && text[i + 1] === '\n') i++;

            row.push(value);

            if (row.some(cell => cell.trim() !== "")) {
                rows.push(row);
            }

            row = [];
            value = "";
        }

        else {
            value += char;
        }
    }

    if (row.length || value) {
        row.push(value);
        rows.push(row);
    }

    return rows;
}

function loadCSV() {

    const file = document.getElementById("csvFile").files[0];

    if (!file) {
        alert("Please select a CSV file");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const rows = parseCSV(e.target.result);

        if (rows.length < 2) {
            alert("CSV file has no data records");
            return;
        }

        headers = rows[0].map(h => h.trim());

        allData = rows.slice(1).map(row =>
            headers.map((_, i) => row[i] ?? "")
        );

        filteredData = [...allData];

        currentPage = 1;
        sortColumn = -1;

        displayTable();
    };

    reader.readAsText(file);
}

function displayTable() {

    const tableHead = document.querySelector("#dataTable thead");
    const tableBody = document.querySelector("#dataTable tbody");

    tableHead.innerHTML = "";
    tableBody.innerHTML = "";

    let headerHTML = "<tr>";

    headers.forEach((header, index) => {

        headerHTML += `
            <th onclick="sortData(${index})">
                ${escapeHTML(header)}
                ↕
            </th>
        `;

    });

    headerHTML += "</tr>";

    tableHead.innerHTML = headerHTML;

    const pageSize = Number(
        document.getElementById("pageSize").value
    );

    const totalPages = Math.max(
        1, Math.ceil(filteredData.length / pageSize)
    );

    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * pageSize;

    const pageData = filteredData.slice(
        start, start + pageSize
    );

    pageData.forEach(row => {

        let html = "<tr>";

        row.forEach(value => {
            html += `<td>${escapeHTML(value)}</td>`;
        });

        html += "</tr>";

        tableBody.innerHTML += html;

    });

    document.getElementById("pageInfo").textContent =
        `Page ${currentPage} of ${totalPages}`;

    document.getElementById("recordInfo").textContent =
        `Showing ${pageData.length} of ${filteredData.length} records`;
}

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function searchData() {

    const search = document.getElementById(
        "searchInput"
    ).value.toLowerCase();

    filteredData = allData.filter(row =>
        row.some(value =>
            String(value).toLowerCase().includes(search)
        )
    );

    currentPage = 1;
    displayTable();
}

function sortData(index) {

    if (sortColumn === index) {
        sortAscending = !sortAscending;
    } else {
        sortColumn = index;
        sortAscending = true;
    }

    filteredData.sort((a, b) => {

        const x = String(a[index]).toLowerCase();
        const y = String(b[index]).toLowerCase();

        return sortAscending
            ? x.localeCompare(y, undefined, {numeric: true})
            : y.localeCompare(x, undefined, {numeric: true});

    });

    currentPage = 1;
    displayTable();
}

function previousPage() {

    if (currentPage > 1) {
        currentPage--;
        displayTable();
    }
}

function nextPage() {

    const pageSize = Number(
        document.getElementById("pageSize").value
    );

    const totalPages = Math.ceil(
        filteredData.length / pageSize
    );

    if (currentPage < totalPages) {
        currentPage++;
        displayTable();
    }
}

function downloadCSV() {

    if (!headers.length) {
        alert("No CSV data available");
        return;
    }

    const csvContent = [headers, ...filteredData]
        .map(row => row.map(value =>
            '"' + String(value).replace(/"/g, '""') + '"'
        ).join(","))
        .join("\r\n");

    const blob = new Blob(
        ["\uFEFF" + csvContent],
        {type: "text/csv;charset=utf-8;"}
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "filtered_data.csv";
    link.click();

    URL.revokeObjectURL(link.href);
}
