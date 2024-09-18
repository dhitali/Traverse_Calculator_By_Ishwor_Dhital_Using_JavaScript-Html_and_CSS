document.getElementById('traverseForm').addEventListener('submit', function (e) {
    e.preventDefault();
    calculateTraverse();
});

function generateTraverseLegs() {
    const numStations = parseInt(document.getElementById('stations').value);
    const traverseLegsDiv = document.getElementById('traverseLegs');
    traverseLegsDiv.innerHTML = '';

    for (let i = 2; i < numStations; i++) {
        const leg = `
            <div>
                <h4>Leg ${i}</h4>
                <label>Anticlockwise Angle at Station ${i+1} (DMS):</label>
                <input type="number" id="angleDeg${i}" placeholder="Degrees" required> 
                <input type="number" id="angleMin${i}" placeholder="Minutes" required> 
                <input type="number" id="angleSec${i}" placeholder="Seconds" required>
            </div>
            <div>
                <label>Length of traverse leg ${i}-${i+1} (meters):</label>
                <input type="number" step="0.001" id="length${i}" required>
            </div>`;
        traverseLegsDiv.innerHTML += leg;
    }
}

function calculateTraverse() {
    const numStations = parseInt(document.getElementById('stations').value);

    // Retrieve input values for coordinates
    const startEasting1 = parseFloat(document.getElementById('startEasting1').value);
    const startNorthing1 = parseFloat(document.getElementById('startNorthing1').value);
    const startEasting2 = parseFloat(document.getElementById('startEasting2').value);
    const startNorthing2 = parseFloat(document.getElementById('startNorthing2').value);
    const endEasting = parseFloat(document.getElementById('endEasting').value);
    const endNorthing = parseFloat(document.getElementById('endNorthing').value);

    // Calculate initial bearing
    const initialBearing = calculateBearing(startEasting1, startNorthing1, startEasting2, startNorthing2);

    let previousEasting = startEasting2;
    let previousNorthing = startNorthing2;
    let currentBearing = initialBearing;

    const results = [];

    for (let i = 2; i < numStations; i++) {
        const angleDeg = parseFloat(document.getElementById(`angleDeg${i}`).value);
        const angleMin = parseFloat(document.getElementById(`angleMin${i}`).value);
        const angleSec = parseFloat(document.getElementById(`angleSec${i}`).value);
        const length = parseFloat(document.getElementById(`length${i}`).value);

        const anticlockwiseAngle = dmsToDecimal(angleDeg, angleMin, angleSec);
        currentBearing = (currentBearing + anticlockwiseAngle) % 360;

        const latitude = length * Math.cos(degreesToRadians(currentBearing));
        const departure = length * Math.sin(degreesToRadians(currentBearing));

        const newEasting = previousEasting + departure;
        const newNorthing = previousNorthing + latitude;

        results.push({
            station: `Station ${i + 1}`,
            legLength: length,
            angleDMS: `${angleDeg}° ${angleMin}' ${angleSec}"`,
            bearing: currentBearing.toFixed(3),
            latitude: latitude.toFixed(3),
            departure: departure.toFixed(3),
            coordinates: `${newEasting.toFixed(3)}, ${newNorthing.toFixed(3)}`
        });

        previousEasting = newEasting;
        previousNorthing = newNorthing;
    }

    // Add the last station results
    results.push({
        station: `Station ${numStations}`,
        legLength: 'N/A',
        angleDMS: 'N/A',
        bearing: 'N/A',
        latitude: 'N/A',
        departure: 'N/A',
        coordinates: `${previousEasting.toFixed(3)}, ${previousNorthing.toFixed(3)}`
    });

    displayResults(results);
    validateTraverse(results, endEasting, endNorthing);
}

function displayResults(results) {
    const resultsDiv = document.getElementById('results');
    const resultsTableBody = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];

    resultsTableBody.innerHTML = '';
    results.forEach(result => {
        const row = resultsTableBody.insertRow();
        row.insertCell(0).innerText = result.station;
        row.insertCell(1).innerText = result.legLength;
        row.insertCell(2).innerText = result.angleDMS;
        row.insertCell(3).innerText = result.bearing;
        row.insertCell(4).innerText = result.latitude;
        row.insertCell(5).innerText = result.departure;
        row.insertCell(6).innerText = result.coordinates;
    });

    resultsDiv.style.display = 'block';
}

function validateTraverse(results, endEasting, endNorthing) {
    const lastResult = results[results.length - 1];
    const [finalEasting, finalNorthing] = lastResult.coordinates.split(',').map(coord => parseFloat(coord.trim()));

    const errorEasting = Math.abs(finalEasting - endEasting);
    const errorNorthing = Math.abs(finalNorthing - endNorthing);

    if (errorEasting > 0.001 || errorNorthing > 0.001) {
        alert(`Validation Error: Easting error = ${errorEasting.toFixed(3)}, Northing error = ${errorNorthing.toFixed(3)}`);
    } else {
        alert('Validation Successful: Traverse computation is correct.');
    }
}

function downloadExcel() {
    const resultsTable = document.getElementById('resultsTable');
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += Array.from(resultsTable.querySelectorAll('tr')).map(row => {
        return Array.from(row.querySelectorAll('th, td')).map(cell => cell.innerText).join(',');
    }).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'traverse_results.csv');
    document.body.appendChild(link);
    link.click();
}

function dmsToDecimal(degrees, minutes, seconds) {
    return degrees + minutes / 60 + seconds / 3600;
}

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function calculateBearing(x1, y1, x2, y2) {
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    const angle = Math.atan2(deltaX, deltaY) * 180 / Math.PI;
    return (angle + 360) % 360;
}
