// utils/geo.ts

/**
 * Menghitung bearing (arah kompas) dari titik awal ke titik akhir.
 * @param startCoords - Koordinat awal [longitude, latitude]
 * @param endCoords - Koordinat akhir [longitude, latitude]
 * @returns {number} Bearing dalam derajat (0-360)
 */
function calculateBearing(startCoords: [number, number], endCoords: [number, number]): number {
    const [lon1, lat1] = startCoords;
    const [lon2, lat2] = endCoords;

    const lat1Rad = lat1 * (Math.PI / 180);
    const lat2Rad = lat2 * (Math.PI / 180);
    const lonDiffRad = (lon2 - lon1) * (Math.PI / 180);

    const y = Math.sin(lonDiffRad) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(lonDiffRad);

    const bearingRad = Math.atan2(y, x);
    const bearingDeg = bearingRad * (180 / Math.PI);

    // Normalisasi hasil ke 0-360 derajat
    return (bearingDeg + 360) % 360;
}

export { calculateBearing };
