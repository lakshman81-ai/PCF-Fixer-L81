export function distance(pt1, pt2) {
    if (!pt1 || !pt2) return Infinity;
    const dx = parseFloat(pt1.x) - parseFloat(pt2.x);
    const dy = parseFloat(pt1.y) - parseFloat(pt2.y);
    const dz = parseFloat(pt1.z) - parseFloat(pt2.z);
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function getPriority(type) {
    const t = (type || '').toUpperCase().trim();
    if (t === 'PIPE') return 2;
    if (t === 'FLANGE') return 1;
    return 0;
}

export function cloneRow(row) {
    return JSON.parse(JSON.stringify(row));
}

// ------------------------------------------------------------------
// DIRECTIVE 1.1: fix6mmGaps(dataTable)
// ------------------------------------------------------------------
export function fix6mmGaps(dataTable) {
    let currentTable = dataTable.map(cloneRow);
    const fixLog = [];
    const MAX_GAP = 6.0;

    // Run 2 passes to catch cascading micro-gaps
    for (let pass = 1; pass <= 2; pass++) {
        let fixesInPass = 0;

        for (let i = 0; i < currentTable.length - 1; i++) {
            const rowA = currentTable[i];
            const rowB = currentTable[i + 1];

            if (!rowA.ep2 || !rowB.ep1) continue;

            const dist = distance(rowA.ep2, rowB.ep1);
            if (dist > 0 && dist <= MAX_GAP) {
                // Determine which to move based on priority
                const prioA = getPriority(rowA.type);
                const prioB = getPriority(rowB.type);

                if (prioA >= prioB) {
                    // Move A's ep2 to B's ep1
                    rowA.ep2 = { ...rowB.ep1 };
                    fixLog.push({
                        type: 'Fix',
                        stage: 'GapFixEngine',
                        message: `Pass ${pass}: Snapped Row ${rowA._rowIndex} (ep2) to Row ${rowB._rowIndex} (ep1). Gap: ${dist.toFixed(2)}mm`
                    });
                } else {
                    // Move B's ep1 to A's ep2
                    rowB.ep1 = { ...rowA.ep2 };
                    fixLog.push({
                        type: 'Fix',
                        stage: 'GapFixEngine',
                        message: `Pass ${pass}: Snapped Row ${rowB._rowIndex} (ep1) to Row ${rowA._rowIndex} (ep2). Gap: ${dist.toFixed(2)}mm`
                    });
                }
                fixesInPass++;
            }
        }
        if (fixesInPass === 0) break; // Optimization: bail early if pass 1 fixed everything
    }

    return { updatedTable: currentTable, fixLog };
}

// ------------------------------------------------------------------
// DIRECTIVE 1.2: fix25mmGapsWithPipe(dataTable, refPrefix)
// ------------------------------------------------------------------
export function fix25mmGapsWithPipe(dataTable, refPrefix = 'GAPFIX') {
    const newTable = [];
    const fixLog = [];
    const MIN_GAP = 6.0;
    const MAX_GAP = 25.0;
    let insertCount = 0;

    for (let i = 0; i < dataTable.length; i++) {
        const rowA = cloneRow(dataTable[i]);
        newTable.push(rowA);

        if (i < dataTable.length - 1) {
            const rowB = dataTable[i + 1];

            if (!rowA.ep2 || !rowB.ep1) continue;

            const dist = distance(rowA.ep2, rowB.ep1);
            if (dist > MIN_GAP && dist <= MAX_GAP) {
                // Insert new PIPE
                const newPipe = {
                    type: 'PIPE',
                    ep1: { ...rowA.ep2 },
                    ep2: { ...rowB.ep1 },
                    bore: rowA.bore,
                    skey: rowA.skey,
                    pipelineRef: `${refPrefix}_25mmGapfix`,
                    CA1: rowA.CA1,
                    CA2: rowA.CA2,
                    CA3: rowA.CA3
                };
                newTable.push(newPipe);
                insertCount++;

                fixLog.push({
                    type: 'Fix',
                    stage: 'GapFixEngine',
                    message: `Inserted new PIPE between Row ${rowA._rowIndex} and Row ${rowB._rowIndex}. Gap: ${dist.toFixed(2)}mm`
                });

                if (insertCount > 5) {
                     fixLog.push({
                         type: 'Warning',
                         stage: 'GapFixEngine',
                         message: `High number of gap-pipes inserted (>5). Check data quality.`
                     });
                }
            }
        }
    }

    // Re-index
    const reindexedTable = newTable.map((r, idx) => ({ ...r, _rowIndex: idx + 1 }));

    return { updatedTable: reindexedTable, fixLog };
}

// ------------------------------------------------------------------
// DIRECTIVE 1.3: breakPipeAtPoint(pipeRow, breakPoint)
// ------------------------------------------------------------------
export function breakPipeAtPoint(pipeRow, breakPoint) {
    if (!pipeRow || !pipeRow.ep1 || !pipeRow.ep2 || !breakPoint) return [pipeRow];

    const x1 = parseFloat(pipeRow.ep1.x), y1 = parseFloat(pipeRow.ep1.y), z1 = parseFloat(pipeRow.ep1.z);
    const x2 = parseFloat(pipeRow.ep2.x), y2 = parseFloat(pipeRow.ep2.y), z2 = parseFloat(pipeRow.ep2.z);
    const px = parseFloat(breakPoint.x), py = parseFloat(breakPoint.y), pz = parseFloat(breakPoint.z);

    // Vector A -> B
    const vx = x2 - x1, vy = y2 - y1, vz = z2 - z1;
    // Vector A -> P
    const wx = px - x1, wy = py - y1, wz = pz - z1;

    const lenSq = vx * vx + vy * vy + vz * vz;
    let t = lenSq === 0 ? 0 : (wx * vx + wy * vy + wz * vz) / lenSq;

    // Clamp t to 0-1
    t = Math.max(0, Math.min(1, t));

    // Projected point
    const projX = x1 + t * vx;
    const projY = y1 + t * vy;
    const projZ = z1 + t * vz;
    let snapBreak = { x: projX, y: projY, z: projZ };

    const distToEp1 = distance(pipeRow.ep1, snapBreak);
    const distToEp2 = distance(pipeRow.ep2, snapBreak);

    // Minimum distance from endpoint: 10mm
    const MIN_DIST = 10.0;
    const length = Math.sqrt(lenSq);

    if (length < MIN_DIST * 2) {
        // Pipe is too short to break safely with 10mm margins. Return original.
        return [pipeRow];
    }

    if (distToEp1 < MIN_DIST) {
        t = MIN_DIST / length;
        snapBreak = { x: x1 + t * vx, y: y1 + t * vy, z: z1 + t * vz };
    } else if (distToEp2 < MIN_DIST) {
        t = (length - MIN_DIST) / length;
        snapBreak = { x: x1 + t * vx, y: y1 + t * vy, z: z1 + t * vz };
    }

    const rowA = cloneRow(pipeRow);
    const rowB = cloneRow(pipeRow);

    rowA.ep2 = { ...snapBreak };
    rowB.ep1 = { ...snapBreak };

    return [rowA, rowB];
}

// ------------------------------------------------------------------
// DIRECTIVE 1.4: insertSupportAtPipe(pipeRow, position, attrs)
// ------------------------------------------------------------------
export function insertSupportAtPipe(pipeRow, position = null, attrs = {}) {
    if (!pipeRow || !pipeRow.ep1 || !pipeRow.ep2) return null;

    let pos = position;
    if (!pos) {
        const x1 = parseFloat(pipeRow.ep1.x), y1 = parseFloat(pipeRow.ep1.y), z1 = parseFloat(pipeRow.ep1.z);
        const x2 = parseFloat(pipeRow.ep2.x), y2 = parseFloat(pipeRow.ep2.y), z2 = parseFloat(pipeRow.ep2.z);
        pos = { x: (x1 + x2) / 2, y: (y1 + y2) / 2, z: (z1 + z2) / 2 };
    }

    const stubPos = { ...pos, y: parseFloat(pos.y) - 100.0 }; // Stub downwards by convention

    return {
        type: 'SUPPORT',
        ep1: { ...pos },
        ep2: { ...stubPos },
        bore: pipeRow.bore,
        CA1: attrs.CA1 || pipeRow.CA1 || '',
        CA2: attrs.CA2 || pipeRow.CA2 || '',
        CA3: attrs.CA3 || pipeRow.CA3 || ''
    };
}
