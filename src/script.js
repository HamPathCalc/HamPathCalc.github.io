const graphArea = document.getElementById("graph-area");
const addNodeButton = document.getElementById("add-node");

let nodeBeingPlaced = null;
let selectingNode = false;
let selectedNodes = [];
let nodeIdCounter = 0;
let deletingItem = false;
let nodeToInsert = Infinity;
let nodeToDrag = null;
let draggingNode = false;

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
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

    const edge = document.createElement("div");
    edge.classList.add("edge");
    edge.style.left = `${node1x}px`;
    edge.style.top = `${node1y}px`;
    edge.style.width = `${centerDistance}px`;
    edge.style.transform = `rotate(${angle}deg)`;
    edge.id = `${node1.id}_${node2.id}`;
    graphArea.appendChild(edge);

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

    if (clickedNode) {
        nodeToInsert = parseInt(clickedNode.id);
        clickedNode.remove();
    } else if (event.target.closest(".edge")) {
        event.target.closest(".edge").remove();
    }
    deletingItem = false;
    const nodes = document.querySelectorAll(".node");
    const edges = document.querySelectorAll(".edge");
    for (const edge of edges) {
        edge.classList.remove("clickable");
    }
    button = document.getElementById("remove-item");
    button.style.backgroundColor = "#dc3545";
});

//drag node
graphArea.addEventListener("mousemove", (event) => {
    if (nodeBeingPlaced === null) {
        return;
    }

    const rect = graphArea.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    nodeBeingPlaced.style.left = `${x}px`;
    nodeBeingPlaced.style.top = `${y}px`;
});

//fix node in place
graphArea.addEventListener("click", (event) => {
    if (nodeBeingPlaced === null) {
        return;
    }

    const rect = graphArea.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    nodeBeingPlaced.style.left = `${x}px`;
    nodeBeingPlaced.style.top = `${y}px`;

    nodeBeingPlaced = null;
    button = document.getElementById("add-node");
    button.style.backgroundColor = "#f8f9fa";
    nodeToInsert = Infinity;
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
    console.log(nodeToDrag);
});

graphArea.addEventListener("mousemove", (event) => {
    if (nodeToDrag === null || !draggingNode) {
        return;
    }

    const rect = graphArea.getBoundingClientRect();
    const edges = document.querySelectorAll(".edge");
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const node_id = nodeToDrag.id;
    for (const edge of edges) {
        const edge_id = edge.id;
        const [node1_id, node2_id] = edge_id.split("_");
        if(node1_id === node_id || node2_id === node_id) {
            const node1 = document.getElementById(node1_id);
            const node2 = document.getElementById(node2_id);
            const node1Rect = node1.getBoundingClientRect();
            const node2Rect = node2.getBoundingClientRect();
            const graphRect = graphArea.getBoundingClientRect();
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
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            edge.style.left = `${node1x}px`;
            edge.style.top = `${node1y}px`;
            edge.style.width = `${centerDistance}px`;
            edge.style.transform = `rotate(${angle}deg)`;
        }
    }

    nodeToDrag.style.left = `${x}px`;
    nodeToDrag.style.top = `${y}px`;
});

graphArea.addEventListener("mouseup", (event) => {
    if (nodeToDrag === null) {
        return;
    }
    nodeToDrag = null;
    draggingNode = false;
});