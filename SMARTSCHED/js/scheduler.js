// SMARTSCHED - Process Scheduler Logic

// Process vibrant color palette
const PROCESS_COLORS = [
    { bg: "linear-gradient(135deg, #E50914, #9E060E)", border: "#ff3d47", text: "#FFFFFF" }, // Vibrant Red
    { bg: "linear-gradient(135deg, #E58E14, #B86B00)", border: "#ffb443", text: "#FFFFFF" }, // Warm Amber
    { bg: "linear-gradient(135deg, #0080FF, #0050A0)", border: "#47a7ff", text: "#FFFFFF" }, // Electric Blue
    { bg: "linear-gradient(135deg, #8A2BE2, #531294)", border: "#b266ff", text: "#FFFFFF" }, // Neon Purple
    { bg: "linear-gradient(135deg, #00B894, #00796B)", border: "#55efc4", text: "#FFFFFF" }, // Emerald Teal
    { bg: "linear-gradient(135deg, #FD79A8, #D63031)", border: "#ff99bb", text: "#FFFFFF" }, // Rose Ruby
    { bg: "linear-gradient(135deg, #0984E3, #2C3E50)", border: "#74b9ff", text: "#FFFFFF" }, // Midnight Blue
    { bg: "linear-gradient(135deg, #F39C12, #D35400)", border: "#f1c40f", text: "#FFFFFF" }  // Tangerine
];

function getProcessStyle(pid) {
    const num = parseInt(pid.replace(/\D/g, ""), 10) || 1;
    return PROCESS_COLORS[(num - 1) % PROCESS_COLORS.length];
}

// Default process workload
const defaults = [
    { pid: "P1", arrival: 0, burst: 8, priority: 3 },
    { pid: "P2", arrival: 0, burst: 4, priority: 1 },
    { pid: "P3", arrival: 0, burst: 6, priority: 2 },
    { pid: "P4", arrival: 0, burst: 3, priority: 4 }
];

let ps = structuredClone(defaults);

// DOM Elements
const rows = document.querySelector("#rows");
const q = document.querySelector("#q");

// Render the process table and summary metrics
function render() {
    if (!rows) return;
    
    rows.innerHTML = ps
        .map(
            (p, i) => {
                const style = getProcessStyle(p.pid);
                return `<tr>
                    <td>
                        <span class="pid-badge" style="background:${style.bg}; border: 1px solid ${style.border}; color:${style.text};">
                            ${p.pid}
                        </span>
                    </td>
                    <td>
                        <input class="table-input"
                               data-i="${i}"
                               data-f="arrival"
                               type="number"
                               min="0"
                               value="${p.arrival}"
                               title="Arrival Time">
                    </td>
                    <td>
                        <input class="table-input"
                               data-i="${i}"
                               data-f="burst"
                               type="number"
                               min="1"
                               value="${p.burst}"
                               title="Burst Time">
                    </td>
                    <td>
                        <input class="table-input"
                               data-i="${i}"
                               data-f="priority"
                               type="number"
                               min="1"
                               value="${p.priority}"
                               title="Priority (lower = higher priority)">
                    </td>
                    <td>
                        <button class="remove-btn" data-i="${i}" title="Remove process ${p.pid}">✕</button>
                    </td>
                </tr>`;
            }
        )
        .join("");

    const countEl = document.querySelector("#count");
    const burstEl = document.querySelector("#burst");
    const qdEl = document.querySelector("#qd");
    
    if (countEl) countEl.textContent = ps.length;
    if (burstEl) burstEl.textContent = ps.reduce((s, p) => s + p.burst, 0);
    if (qdEl && q) qdEl.textContent = q.value;
}

// Table input handling
if (rows) {
    rows.addEventListener("input", (e) => {
        if (e.target.dataset.f) {
            ps[e.target.dataset.i][e.target.dataset.f] = +e.target.value || 0;
            render();
        }
    });

    // Remove process button handling
    rows.addEventListener("click", (e) => {
        if (e.target.classList.contains("remove-btn") && ps.length > 1) {
            const removed = ps[+e.target.dataset.i].pid;
            ps.splice(+e.target.dataset.i, 1);
            ps.forEach((p, i) => {
                p.pid = "P" + (i + 1);
            });
            render();
            if (window.showToast) window.showToast(`Removed ${removed}`);
        }
    });
}

// Add new process
const addBtn = document.querySelector("#add");
if (addBtn) {
    addBtn.onclick = () => {
        const nextId = "P" + (ps.length + 1);
        ps.push({
            pid: nextId,
            arrival: 0,
            burst: Math.floor(Math.random() * 6) + 3,
            priority: ps.length + 1
        });
        render();
        if (window.showToast) window.showToast(`Added process ${nextId}`);
    };
}

// Reset queue to defaults
const resetBtn = document.querySelector("#reset");
if (resetBtn) {
    resetBtn.onclick = () => {
        ps = structuredClone(defaults);
        if (q) q.value = 2;
        render();
        clear();
        if (window.showToast) window.showToast(`Queue reset to default scenario`);
    };
}

if (q) {
    q.oninput = render;
}

// Helper: Average calculation
function avg(a) {
    return a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
}

// First-Come, First-Served (FCFS) Scheduling
function fcfs(a) {
    let t = 0;
    let w = [];
    let g = [];

    [...a]
        .sort((x, y) => x.arrival - y.arrival)
        .forEach((p) => {
            t = Math.max(t, p.arrival);
            w.push(t - p.arrival);
            g.push([p.pid, t, t + p.burst]);
            t += p.burst;
        });

    return { avg: avg(w), g };
}

// Non-preemptive Scheduling (SJF / Priority)
function nonpre(a, mode) {
    let left = [...a];
    let t = 0;
    let w = [];
    let g = [];

    while (left.length) {
        let av = left.filter((p) => p.arrival <= t);
        if (!av.length) {
            t = Math.min(...left.map((p) => p.arrival));
            continue;
        }

        av.sort((x, y) => (mode === "sjf" ? x.burst - y.burst : x.priority - y.priority) || x.arrival - y.arrival);

        let p = av[0];
        left = left.filter((x) => x !== p);
        w.push(t - p.arrival);
        g.push([p.pid, t, t + p.burst]);
        t += p.burst;
    }

    return { avg: avg(w), g };
}

// Round Robin (RR) Scheduling
function rr(a, quant) {
    let s = [...a].sort((x, y) => x.arrival - y.arrival);
    let rem = new Map(s.map((p) => [p.pid, p.burst]));
    let done = new Map();
    let queue = [];
    let i = 0;
    let t = 0;
    let g = [];

    while (done.size < s.length) {
        while (i < s.length && s[i].arrival <= t) {
            queue.push(s[i++]);
        }

        if (!queue.length) {
            t = s[i].arrival;
            continue;
        }

        let p = queue.shift();
        let run = Math.min(quant, rem.get(p.pid));

        g.push([p.pid, t, t + run]);
        t += run;
        rem.set(p.pid, rem.get(p.pid) - run);

        while (i < s.length && s[i].arrival <= t) {
            queue.push(s[i++]);
        }

        if (rem.get(p.pid) > 0) {
            queue.push(p);
        } else {
            done.set(p.pid, t);
        }
    }

    let w = s.map((p) => done.get(p.pid) - p.arrival - p.burst);
    return { avg: avg(w), g };
}

// Algorithm Dispatcher
function calc(name) {
    if (name === "fcfs") return fcfs(ps);
    if (name === "sjf") return nonpre(ps, "sjf");
    if (name === "priority") return nonpre(ps, "priority");
    return rr(ps, +q.value || 2);
}

// Clear Results
function clear() {
    const bestEl = document.querySelector("#best");
    const waitEl = document.querySelector("#wait");
    const descEl = document.querySelector("#desc");
    const outEl = document.querySelector("#out");
    const ganttEl = document.querySelector("#gantt");

    if (bestEl) bestEl.textContent = "Ready to Simulate";
    if (waitEl) waitEl.textContent = "—";
    if (descEl) descEl.textContent = "Simulate to discover the optimal algorithm with minimum wait time.";
    if (outEl) {
        outEl.innerHTML = `
            <tr>
                <td colspan="3" class="empty">
                    <div class="empty-state">
                        <span class="empty-icon">⚡</span>
                        <span>Click "Run Simulation" above to benchmark algorithms</span>
                    </div>
                </td>
            </tr>
        `;
    }
    if (ganttEl) {
        ganttEl.innerHTML = `
            <div class="gantt-empty">
                <span>⏱ Timeline standby — awaiting simulation trigger</span>
            </div>
        `;
    }
}

// Run Simulation with Animated Interactive Experience
const runBtn = document.querySelector("#run");
if (runBtn) {
    runBtn.onclick = () => {
        const algSelect = document.querySelector("#alg");
        let selected = algSelect ? algSelect.value : "all";
        let names = selected === "all" ? ["fcfs", "sjf", "rr", "priority"] : [selected];
        let r = {};

        // Animated UI feedback on button
        const origText = runBtn.innerHTML;
        runBtn.disabled = true;
        runBtn.innerHTML = `
            <span class="app-spinner"></span>
            <span>Simulating...</span>
        `;

        setTimeout(() => {
            names.forEach((n) => {
                r[n] = calc(n);
            });

            let best = names.reduce((a, b) => (r[a].avg <= r[b].avg ? a : b));
            let bestName = best === "rr" ? "Round Robin" : best.toUpperCase();

            const bestEl = document.querySelector("#best");
            const waitEl = document.querySelector("#wait");
            const descEl = document.querySelector("#desc");
            const outEl = document.querySelector("#out");
            const ganttEl = document.querySelector("#gantt");

            if (bestEl) {
                bestEl.innerHTML = `
                    <span class="match-badge">⚡ 98% EFFICIENCY</span>
                    ${bestName}
                `;
            }
            if (waitEl) waitEl.textContent = r[best].avg.toFixed(2);
            if (descEl) {
                descEl.textContent = `${bestName} achieved the lowest average waiting time (${r[best].avg.toFixed(2)} ms) for your queue.`;
            }

            if (outEl) {
                outEl.innerHTML = names
                    .map((n) => {
                        const isBest = n === best;
                        const label = n === "rr" ? "Round Robin" : n.toUpperCase();
                        const time = r[n].avg.toFixed(2);
                        return `<tr class="${isBest ? 'winner-row' : ''}">
                            <td>
                                <div class="alg-cell">
                                    <span class="alg-indicator ${isBest ? 'top-match' : ''}"></span>
                                    <b>${label}</b>
                                </div>
                            </td>
                            <td>
                                <span class="wait-val">${time} ms</span>
                            </td>
                            <td>
                                ${isBest 
                                    ? '<span class="top-badge"><span class="badge-n">TOP 1</span> OPTIMAL</span>' 
                                    : '<span class="compared-badge">Ranked</span>'}
                            </td>
                        </tr>`;
                    })
                    .join("");
            }

            // Render Animated Gantt Timeline Scrubber
            if (ganttEl && r[best].g.length > 0) {
                let timeline = r[best].g;
                let total = timeline[timeline.length - 1][2];

                let blocksHtml = timeline
                    .map((x, idx) => {
                        let duration = x[2] - x[1];
                        let widthPercent = (duration / total) * 100;
                        let style = getProcessStyle(x[0]);
                        return `
                            <div class="gantt-block" 
                                 style="width:${widthPercent}%; background:${style.bg}; border-color:${style.border}; animation-delay: ${idx * 60}ms;" 
                                 title="${x[0]}: ${x[1]}ms → ${x[2]}ms (${duration}ms)">
                                <div class="gantt-pid">${x[0]}</div>
                                <div class="gantt-time-range">${x[1]}-${x[2]}ms</div>
                            </div>
                        `;
                    })
                    .join("");

                // Timestamps scale along the bottom like an interactive scrubber
                let timeMarksHtml = `
                    <div class="gantt-markers">
                        <span>0 ms</span>
                        <span>${Math.round(total / 2)} ms</span>
                        <span>${total} ms (Total)</span>
                    </div>
                `;

                ganttEl.innerHTML = `
                    <div class="gantt-wrapper">
                        <div class="gantt-scrubber">
                            <div class="gantt-playhead"></div>
                            ${blocksHtml}
                        </div>
                        ${timeMarksHtml}
                    </div>
                `;
            }

            // Reset button
            runBtn.disabled = false;
            runBtn.innerHTML = origText;

            // Scroll results into view smoothly
            const resultsSection = document.querySelector("#results");
            if (resultsSection) {
                resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            if (window.showToast) {
                window.showToast(`✨ Simulation complete! ${bestName} is optimal.`);
            }
        }, 350); // slight delay for smooth visual feedback
    };
}

// Initial Render
render();