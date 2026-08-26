const graphArea = document.getElementById("graph-area");
const graphTxt = document.getElementById("graph-txt");
const oneIndex = document.getElementById("one-index");
const zeroIndex = document.getElementById("zero-index");
const fixInPlace = document.getElementById("fix-in-place");

let nodeBeingPlaced = null;
let selectingNode = false;
let selectedNodes = [];
let nodeIdCounter = 0;
let deletingItem = false;
let nodeToInsert = Infinity;
let nodeToDrag = null;
let draggingNode = false;

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
    button = document.getElementById("add-node");
    button.style.backgroundColor = "#d3d4d5";
    if (nodeBeingPlaced !== null) {
        return;
    }

    nodeBeingPlaced = document.createElement("div");
    nodeBeingPlaced.classList.add("node");
    nodeBeingPlaced.classList.add("clickable");
    nodeBeingPlaced.id = nodeToInsert !== Infinity ? nodeToInsert : nodeIdCounter++;
    nodeBeingPlaced.textContent = nodeBeingPlaced.id;

    graphArea.appendChild(nodeBeingPlaced);
}

function onEdgeButtonClick() {
    resetToDefaults();
    button = document.getElementById("add-edge");
    button.style.backgroundColor = "#d3d4d5";
    const nodes = document.querySelectorAll(".node");
    selectingNode = true;
}

function onRemoveButtonClick() {
    resetToDefaults();
    button = document.getElementById("remove-item");
    button.style.backgroundColor = "#bb2d3b";
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
    button = document.getElementById("remove-item");
    button.style.backgroundColor = "#dc3545";
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
    button = document.getElementById("add-node");
    button.style.backgroundColor = "#f8f9fa";
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
        button = document.getElementById("add-edge");
        button.style.backgroundColor = "#f8f9fa";
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
            node.id = i;
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
    alert("Mrzim svoj život")
}