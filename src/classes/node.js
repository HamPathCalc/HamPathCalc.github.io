class Node {
    static idCounter = 0;
    constructor() {
        this.id = Node.idCounter++;
    }   
}

export { Node };