//const fs = require("fs");

const graphArea = document.getElementById("graph-area");
const graphTxt = document.getElementById("graph-txt");
const oneIndex = document.getElementById("one-index");
const zeroIndex = document.getElementById("zero-index");
const fixInPlace = document.getElementById("fix-in-place");
const methodItems = document.querySelectorAll(".method-item");
const cycles = document.getElementById("cycles");
const visualize = document.getElementById("visualize");
const resultTxt = document.getElementById("result-txt");
const visualizationStatus = document.getElementById("visualization-status");
const pauseVisualization = document.getElementById("pause-visualization");
const stopVisualization = document.getElementById("stop-visualization");
const heldKarp = document.getElementById("held-karp");
const baxKarp = document.getElementById("bax-karp");
const rectangular = document.getElementById("rectangular");
let methodName = "default";

heldKarp.addEventListener("click", () => {
    methodName = "HeldKarp";
});

baxKarp.addEventListener("click", () => {
    methodName = "BaxKarp";
});

rectangular.addEventListener("click", () => {
    methodName = "Rectangular";
});

methodItems.forEach((methodItem) => {
    methodItem.addEventListener("click", () => {
        methodItems.forEach((item) => item.classList.remove("active"));
        methodItem.classList.add("active");
    });
});

document.querySelectorAll(".method-info").forEach((methodInfo) => {
    methodInfo.addEventListener("click", (event) => event.stopPropagation());
});

let nodeBeingPlaced = null;
let selectingNode = false;
let selectedNodes = [];
let nodeIdCounter = 0;
let deletingItem = false;
let nodeToInsert = Infinity;
let nodeToDrag = null;
let draggingNode = false;
let pyodide = null;
let pyodideReady = null;
let visualizationEvents = [];
let visualizationTimers = [];
let visualizationPaused = false;

function clearVisualizationStatus() {
    visualizationStatus.textContent = "";
}

function formatVisualizationVertex(vertex) {
    return oneIndex.checked ? Number(vertex) + 1 : vertex;
}

function showVisualizationStep(subset, vertex) {
    const displayedSubset = subset.map((item) => formatVisualizationVertex(item)).join(", ");
    visualizationStatus.textContent = `Evaluating subset {${displayedSubset}}; last node: ${formatVisualizationVertex(vertex)}`;
}

function showPathVisualizationStep(vertex) {
    visualizationStatus.textContent = `Reconstructing path; current node: ${formatVisualizationVertex(vertex)}`;
}

function clearVisualizationTimers() {
    for (const timer of visualizationTimers) {
        clearTimeout(timer);
    }
    visualizationTimers = [];
}

function scheduleVisualizationEvents() {
    clearVisualizationTimers();
    const startTime = Date.now();

    for (const event of visualizationEvents) {
        if (!event.active) {
            continue;
        }
        const timer = setTimeout(() => {
            if (!event.active || visualizationPaused) {
                return;
            }
            event.active = false;
            event.callback();
            if (!visualizationEvents.some((pendingEvent) => pendingEvent.active)) {
                visualizationEvents = [];
            }
        }, event.remaining);
        visualizationTimers.push(timer);
    }

    visualizationEvents.startTime = startTime;
}

function pauseVisualizationAnimation() {
    if (visualizationPaused || !visualizationEvents.some((event) => event.active)) {
        return;
    }

    const elapsed = Date.now() - visualizationEvents.startTime;
    clearVisualizationTimers();
    for (const event of visualizationEvents) {
        if (event.active) {
            event.remaining = Math.max(0, event.remaining - elapsed);
        }
    }
    visualizationPaused = true;
    pauseVisualization.setAttribute("aria-label", "Resume visualization");
    pauseVisualization.setAttribute("title", "Resume visualization");
    pauseVisualization.innerHTML = '<i class="bi bi-play-fill"></i>';
    alert("Visualization paused.");
}

function resumeVisualizationAnimation() {
    if (!visualizationPaused) {
        return;
    }

    visualizationPaused = false;
    pauseVisualization.setAttribute("aria-label", "Pause visualization");
    pauseVisualization.setAttribute("title", "Pause visualization");
    pauseVisualization.innerHTML = '<i class="bi bi-pause-fill"></i>';
    scheduleVisualizationEvents();
}

function stopVisualizationAnimation(notify = false) {
    clearVisualizationTimers();
    visualizationEvents = [];
    visualizationPaused = false;
    clearVisualizationStatus();
    pauseVisualization.setAttribute("aria-label", "Pause visualization");
    pauseVisualization.setAttribute("title", "Pause visualization");
    pauseVisualization.innerHTML = '<i class="bi bi-pause-fill"></i>';

    for (const node of graphArea.querySelectorAll(".node")) {
        node.style.backgroundColor = "white";
    }
    if (notify) {
        alert("Visualization stopped.");
    }
}

pauseVisualization.addEventListener("click", () => {
    if (visualizationPaused) {
        resumeVisualizationAnimation();
    } else if (visualizationEvents.some((event) => event.active)) {
        pauseVisualizationAnimation();
    } else {
        alert("No visualization is currently running.");
    }
});

stopVisualization.addEventListener("click", () => {
    if (visualizationPaused || visualizationEvents.some((event) => event.active)) {
        stopVisualizationAnimation(true);
    } else {
        alert("No visualization is currently running.");
    }
});

function setNodePosition(node, clientX, clientY) {
    const graphRect = graphArea.getBoundingClientRect();
    const graphStyle = getComputedStyle(graphArea);
    const borderLeft = parseFloat(graphStyle.borderLeftWidth);
    const borderTop = parseFloat(graphStyle.borderTopWidth);
    const graphWidth = graphArea.clientWidth;
    const graphHeight = graphArea.clientHeight;
    const nodeRadiusX = node.offsetWidth / 2;
    const nodeRadiusY = node.offsetHeight / 2;
    const x = Math.max(nodeRadiusX, Math.min(
        clientX - graphRect.left - borderLeft,
        graphWidth - nodeRadiusX
    ));
    const y = Math.max(nodeRadiusY, Math.min(
        clientY - graphRect.top - borderTop,
        graphHeight - nodeRadiusY
    ));

    node.style.left = `${x / graphWidth * 100}%`;
    node.style.top = `${y / graphHeight * 100}%`;
}

function constrainNode(node) {
    const graphWidth = graphArea.clientWidth;
    const graphHeight = graphArea.clientHeight;
    const nodeRadiusX = node.offsetWidth / 2;
    const nodeRadiusY = node.offsetHeight / 2;
    const x = Math.max(nodeRadiusX, Math.min(node.offsetLeft, graphWidth - nodeRadiusX));
    const y = Math.max(nodeRadiusY, Math.min(node.offsetTop, graphHeight - nodeRadiusY));

    node.style.left = `${x / graphWidth * 100}%`;
    node.style.top = `${y / graphHeight * 100}%`;
}

function placeNodeRandomly(node) {
    const graphWidth = graphArea.clientWidth;
    const graphHeight = graphArea.clientHeight;
    const nodeRadiusX = node.offsetWidth / 2;
    const nodeRadiusY = node.offsetHeight / 2;
    const x = nodeRadiusX + Math.random() * (graphWidth - 2 * nodeRadiusX);
    const y = nodeRadiusY + Math.random() * (graphHeight - 2 * nodeRadiusY);

    node.style.left = `${x / graphWidth * 100}%`;
    node.style.top = `${y / graphHeight * 100}%`;
}

function updateEdgePosition(edge) {
    const [node1Id, node2Id] = edge.id.split("_");
    const node1 = document.getElementById(node1Id);
    const node2 = document.getElementById(node2Id);
    const graphRect = graphArea.getBoundingClientRect();
    const node1Rect = node1.getBoundingClientRect();
    const node2Rect = node2.getBoundingClientRect();
    const node1x = node1Rect.left + node1Rect.width / 2 - graphRect.left;
    const node1y = node1Rect.top + node1Rect.height / 2 - graphRect.top;
    const node2x = node2Rect.left + node2Rect.width / 2 - graphRect.left;
    const node2y = node2Rect.top + node2Rect.height / 2 - graphRect.top;
    const deltaX = node2x - node1x;
    const deltaY = node2y - node1y;
    const centerDistance = Math.hypot(deltaX, deltaY);
    if (centerDistance === 0) {
        return;
    }

    edge.style.left = `${node1x}px`;
    edge.style.top = `${node1y}px`;
    edge.style.width = `${centerDistance}px`;
    edge.style.transform = `rotate(${Math.atan2(deltaY, deltaX) * 180 / Math.PI}deg)`;
}

const graphResizeObserver = new ResizeObserver(() => {
    for (const node of graphArea.querySelectorAll(".node")) {
        constrainNode(node);
    }
    for (const edge of graphArea.querySelectorAll(".edge")) {
        updateEdgePosition(edge);
    }
});
graphResizeObserver.observe(graphArea);

function resetToDefaults() {
    nodeBeingPlaced = null;
    selectingNode = false;
    selectedNodes = [];
    deletingItem = false;
    nodeToDrag = null;
    draggingNode = false;

    const nodes = document.querySelectorAll(".node");
    for (const node of nodes) {
        node.style.backgroundColor = "white";
    }

    const buttons = [
        document.getElementById("add-node"),
        document.getElementById("add-edge"),
        document.getElementById("remove-item"),
        document.getElementById("clean-all")
    ];

    for (const button of buttons) {
        button?.classList.remove("active");
    }

    //methodItems.forEach((item) => item.classList.remove("active"));
}

function makeEdge(node1, node2) {
    const edgeId1 = `${node1.id}_${node2.id}`;
    const edgeId2 = `${node2.id}_${node1.id}`;
    if (document.getElementById(edgeId1) || document.getElementById(edgeId2)) {
        node1.style.backgroundColor = "white";
        node2.style.backgroundColor = "white";
        return;
    }

    const edge = document.createElement("div");
    edge.classList.add("edge");
    edge.id = `${node1.id}_${node2.id}`;
    graphArea.appendChild(edge);
    updateEdgePosition(edge);

    node1.style.backgroundColor = "white";
    node2.style.backgroundColor = "white";
}

function onNodeButtonClick() {
    resetToDefaults();
    const addNodeButton = document.getElementById("add-node");
    addNodeButton.classList.add("active");
    if (nodeBeingPlaced !== null) {
        return;
    }

    nodeBeingPlaced = document.createElement("div");
    nodeBeingPlaced.classList.add("node");
    nodeBeingPlaced.classList.add("clickable");
    nodeBeingPlaced.id = nodeToInsert !== Infinity ? nodeToInsert : nodeIdCounter++;
    nodeBeingPlaced.textContent = zeroIndex.checked ? nodeBeingPlaced.id : parseInt(nodeBeingPlaced.id) + 1;

    graphArea.appendChild(nodeBeingPlaced);
}

function onEdgeButtonClick() {
    resetToDefaults();
    const addEdgeButton = document.getElementById("add-edge");
    addEdgeButton.classList.add("active");
    const nodes = document.querySelectorAll(".node");
    for (const node of nodes) {
        node.style.backgroundColor = "white";
    }
    selectingNode = true;
}

function onRemoveButtonClick() {
    resetToDefaults();
    const removeItemButton = document.getElementById("remove-item");
    removeItemButton.classList.add("active");
    deletingItem = true;
    const nodes = document.querySelectorAll(".node");
    const edges = document.querySelectorAll(".edge");
    for (const edge of edges) {
        edge.classList.add("clickable");
    }
}

function onCleanAllButtonClick() {
    graphArea.replaceChildren();
    resetToDefaults();
    nodeIdCounter = 0;
    nodeToInsert = Infinity;
    updateGraphTxt();
}

//remove item
graphArea.addEventListener("click", (event) => {
    if (!deletingItem) {
        return;
    }

    const clickedNode = [...graphArea.querySelectorAll(".node")].find((node) => {
        const rect = node.getBoundingClientRect();
        if (event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom) {
            return node;
        }
    });
    const edges = document.querySelectorAll(".edge");

    if (clickedNode) {
        nodeToInsert = parseInt(clickedNode.id);
        for (const edge of edges) {
            if (edge.id.includes(clickedNode.id)) {
                edge.remove();
            }
        }
        clickedNode.remove();
    } else if (event.target.closest(".edge")) {
        event.target.closest(".edge").remove();
    }
    deletingItem = false;
    const nodes = document.querySelectorAll(".node");
    
    for (const edge of edges) {
        edge.classList.remove("clickable");
    }
    const removeItemButton = document.getElementById("remove-item");
    removeItemButton.classList.remove("active");
    updateGraphTxt();
});

//drag node
graphArea.addEventListener("mousemove", (event) => {
    if (nodeBeingPlaced === null) {
        return;
    }

    setNodePosition(nodeBeingPlaced, event.clientX, event.clientY);
});

//fix node in place
graphArea.addEventListener("click", (event) => {
    if (nodeBeingPlaced === null) {
        return;
    }

    setNodePosition(nodeBeingPlaced, event.clientX, event.clientY);

    nodeBeingPlaced = null;
    const addNodeButton = document.getElementById("add-node");
    addNodeButton.classList.remove("active");
    nodeToInsert = Infinity;
    updateGraphTxt();
});

//add edge
graphArea.addEventListener("click", (event) => {
    if (!selectingNode) {
        return;
    }

    const selectedNode = [...graphArea.querySelectorAll(".node")].find((node) => {
        const rect = node.getBoundingClientRect();
        if (event.clientX >= rect.left &&
            event.clientX <= rect.right &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom) {
            return node;
        }
    });

    if (selectedNode === undefined) {
        return;
    }
    selectedNode.style.backgroundColor = "green";

    selectedNodes.push(selectedNode);
    if(selectedNodes.length === 2) {
        makeEdge(selectedNodes[0], selectedNodes[1]);
        selectedNodes = [];
        selectingNode = false;
        const addEdgeButton = document.getElementById("add-edge");
        addEdgeButton.classList.remove("active");
    }
    updateGraphTxt();
});

/*graphArea.addEventListener("click", (event) => {
    if (nodeBeingPlaced !== null || deletingItem || selectingNode) {
        return;
    }

    nodeToDrag = event.target.closest(".node");
});*/

graphArea.addEventListener("mousedown", (event) => {
    if (nodeBeingPlaced !== null || deletingItem || selectingNode) {
        return;
    }
    nodeToDrag = event.target.closest(".node");
    if (nodeToDrag === null) {
        return;
    }
    draggingNode = true;
});

graphArea.addEventListener("mousemove", (event) => {
    if (nodeToDrag === null || !draggingNode) {
        return;
    }

    const edges = document.querySelectorAll(".edge");
    setNodePosition(nodeToDrag, event.clientX, event.clientY);
    const nodeId = nodeToDrag.id;
    for (const edge of edges) {
        const [node1Id, node2Id] = edge.id.split("_");
        if (node1Id === nodeId || node2Id === nodeId) {
            updateEdgePosition(edge);
        }
    }
});

graphArea.addEventListener("mouseup", (event) => {
    if (nodeToDrag === null) {
        return;
    }
    nodeToDrag = null;
    draggingNode = false;
});

oneIndex.addEventListener("click", () => {
    updateGraphTxt();
});

zeroIndex.addEventListener("click", () => {
    updateGraphTxt();
});

//update graph text area
function updateGraphTxt() {
    const nodes = document.querySelectorAll(".node");
    const edges = document.querySelectorAll(".edge");
    let n = nodes.length;
    let graphText = `${n}\n`;
    for (const edge of edges) {
        const [node1_id, node2_id] = edge.id.split("_");
        if (oneIndex.checked) {
            graphText += `${parseInt(node1_id) + 1} ${parseInt(node2_id) + 1}\n`;
        } else {
            graphText += `${node1_id} ${node2_id}\n`;
        }
    }
    for (const node of nodes) {
        node.textContent = oneIndex.checked ? parseInt(node.id) + 1 : node.id;
    }
    graphTxt.value = graphText;
}

function onGenerateButtonClick() {
    const nodePositions = new Map();
    resetToDefaults();
    nodeIdCounter = 0;
    if (fixInPlace.checked) {
        for (const node of graphArea.querySelectorAll(".node")) {
            nodePositions.set(node.id, {
                left: node.style.left,
                top: node.style.top
            });
        }
    }

    graphArea.replaceChildren();
    const graph_text = document.getElementById("graph-txt");
    const graph = graph_text.value.trim().split("\n");
    let n = parseInt(graph[0]);
    let n_edges = graph.length - 1;
    for (let i = 0; i < n; i++) {
            const node = document.createElement("div");
            node.classList.add("node");
            node.classList.add("clickable");
            node.id = nodeIdCounter++;
            node.textContent = zeroIndex.checked ? node.id : parseInt(node.id) + 1;
            graphArea.appendChild(node);
            const savedPosition = nodePositions.get(node.id);
            if (savedPosition) {
                node.style.left = savedPosition.left;
                node.style.top = savedPosition.top;
            } else {
                placeNodeRandomly(node);
            }
        }
    for (let i = 1; i <= n_edges; i++) {
        const [node1_id, node2_id] = graph[i].trim().split(/\s+/);
        const indexOffset = oneIndex.checked ? 1 : 0;
        const node1 = document.getElementById(parseInt(node1_id) - indexOffset);
        const node2 = document.getElementById(parseInt(node2_id) - indexOffset);
        if (node1 && node2) {
            makeEdge(node1, node2);
        }
    }
    updateGraphTxt();
}

function onCalcButtonClick() {
    let graphText = graphTxt.value.trim();
    if (oneIndex.checked) {
        const lines = graphText.split("\n");
        let txtEdges = lines.slice(1);
        txtEdges = txtEdges.map(line => {
            const [node1_id, node2_id] = line.trim().split(/\s+/);
            return `${parseInt(node1_id) - 1} ${parseInt(node2_id) - 1}`;
        }).join("\n");
        graphText = `${lines[0]}\n${txtEdges}`;
    }
    const edges = document.querySelectorAll(".edge");
    for(const edge of edges) {
        edge.style.backgroundColor = "black";
    }

    const cyclesOption = cycles.checked ? "True" : "False";

    if (!graphText) {
        alert("Graph input is empty.");
        return;
    }
    graphText = `${graphText}\n${cyclesOption}`;

    doPyodide(graphText);
}

async function loadPythonFile(path) {
    const response = await fetch(`./${path}`);

    if (!response.ok) {
        throw new Error(`Could not load ${path}: ${response.status}`);
    }

    const code = await response.text();

    pyodide.FS.writeFile(path, code);
}

async function initializePyodide() {
    pyodide = await loadPyodide();

    pyodide.FS.mkdirTree("./algorithms/classes");

    await loadPythonFile("./algorithms/__init__.py");
    await loadPythonFile("./algorithms/classes/__init__.py");

    await loadPythonFile("./algorithms/classes/graph.py");
    await loadPythonFile("./algorithms/classes/hampathsolver.py");
    await loadPythonFile("./algorithms/classes/helpfunctions.py");

    await loadPythonFile("./algorithms/bax_karp.py");
    await loadPythonFile("./algorithms/held_karp.py");
    await loadPythonFile("./algorithms/rectangular.py");

    const response = await fetch("./main.py");

    if (!response.ok) {
        throw new Error(`Could not load main.py: ${response.status}`);
    }

    const mainCode = await response.text();

    await pyodide.runPythonAsync(mainCode);
}

async function doPyodide(graphText) {
    try {
        if (pyodideReady === null) {
            pyodideReady = initializePyodide();
        }

        await pyodideReady;

        const main = pyodide.globals.get("main");
        let resultPy;
        
        if (methodName === "default") {
            resultPy = main(graphText);
        }
        else if (methodName === "Rectangular") {
            const method = pyodide.globals.get(methodName);
            resultPy = main(graphText, method);
        }
        else {
            const method = pyodide.globals.get(methodName);
            resultPy = main(graphText, method);
        }

        if (resultPy === null) {
            resultTxt.value = "No Hamiltonian path found.";
            return;
        }

        let result = null;

        if (Array.isArray(resultPy)|| (typeof resultPy === "object" && resultPy !== null && typeof resultPy.toJs === "function")) {
            result = resultPy.toJs();
        }
        else {
            result = resultPy.toString();
        }

        let path;
        let visualization;
        let path_visualization;

        main.destroy();

        if (Array.isArray(result)) {
            result = result === null ? "No Hamiltonian path found." : result;
            path = result[0];
            visualization = result[1];
            path_visualization = result[2];
            console.log(path_visualization);
            result = "Method used: " + methodName + "\nCycles: " + cycles.checked + "\n" + path.join(" -> ");
            resultTxt.value = result;
            stopVisualizationAnimation();
            if (visualize.checked) {
                if (visualization.length === 0 || path_visualization.length === 0) {
                    alert("No visualization available for this type of graph.");
                    return;
                }
                visualizationEvents = [];
                let stepDelay = 0;
                const stepDuration = 3500;

                for (const step of visualization) {
                    const S = step[0];
                    const v = step[1];
                    const Hamiltonian = step[2];

                    visualizationEvents.push({
                        remaining: stepDelay,
                        active: true,
                        callback: () => {
                        showVisualizationStep(S, v);
                        for (const nodeId of S) {
                            const node = document.getElementById(nodeId);
                            if (node) {
                                node.style.backgroundColor = "yellow";
                            }
                        }
                        const nodeV = document.getElementById(v);
                        if (nodeV) {
                            nodeV.style.backgroundColor = "purple";
                        }
                        }
                    });

                    visualizationEvents.push({
                        remaining: stepDelay + stepDuration / 2,
                        active: true,
                        callback: () => {
                        for (const nodeId of S) {
                            const node = document.getElementById(nodeId);
                            if (node) {
                                node.style.backgroundColor = Hamiltonian ? "green" : "red";
                            }
                        }
                        }
                    });

                    visualizationEvents.push({
                        remaining: stepDelay + stepDuration,
                        active: true,
                        callback: () => {
                        for (const nodeId of S) {
                            const node = document.getElementById(nodeId);
                            if (node) {
                                node.style.backgroundColor = "white";
                            }
                        }
                        }
                    });

                    stepDelay += stepDuration + 2000;
                }

                for (const step of path_visualization) {
                    const nodeId = step[0];
                    const isValid = step[1];

                    visualizationEvents.push({
                        remaining: stepDelay,
                        active: true,
                        callback: () => {
                        showPathVisualizationStep(nodeId);
                        const node = document.getElementById(nodeId);
                        if (node) {
                            node.style.backgroundColor = isValid ? "green" : "red";
                        }
                        }
                    });

                    stepDelay += stepDuration + 500;
                }

                visualizationEvents.push({
                    remaining: stepDelay + stepDuration,
                    active: true,
                    callback: () => {
                    clearVisualizationStatus();
                    for (const node of document.querySelectorAll(".node")) {
                        node.style.backgroundColor = "white";
                    }
                    }
                });
                scheduleVisualizationEvents();
            }
            for(let i = 0; i < path.length - 1; i++) {
                const edgeId1 = `${path[i]}_${path[i + 1]}`;
                const edgeId2 = `${path[i + 1]}_${path[i]}`;
                const edge = document.getElementById(edgeId1) || document.getElementById(edgeId2);
                if (edge) {
                    edge.style.backgroundColor = "red";
                }
            }
        } else {
            result = result === null ? "No Hamiltonian path found." : result;
            result = "Method used: " + methodName + "\nCycles: " + cycles.checked + "\n" + result;
            resultTxt.value = result;
            if (visualize.checked) {
                alert("No visualization available for this type of graph.");
            }
        }

    } catch (error) {
        console.error(error);
        alert(`Python error:\n${error.message}`);
    }
}