from algorithms.bax_karp import BaxKarp
from algorithms.held_karp import HeldKarp
from algorithms.rectangular import Rectangular
from algorithms.classes.hampathsolver import HamPathSolver
from algorithms.classes.graph import Graph

def main(graph_text: str, Solver: HamPathSolver = BaxKarp):
    if not isinstance(graph_text, str) or not graph_text.strip():
        raise ValueError("Graph input is empty")

    lines = [line.strip() for line in graph_text.strip().splitlines() if line.strip()]
    if len(lines) < 2:
        raise ValueError("Graph input must include a node count and cycle option")

    s = None
    t = None
    header = lines[0].split()
    if len(header) == 2:
        try:
            s, t = map(int, header)
        except ValueError as error:
            raise ValueError("Start and end nodes must be integers") from error
        lines = lines[1:]
    if len(lines[0].split()) != 1:
        raise ValueError("Node count must be a single integer")

    try:
        n = int(lines[0])
    except ValueError as error:
        raise ValueError("Node count must be an integer") from error

    if n < 0:
        raise ValueError("Node count cannot be negative")

    cycle_value = lines[-1].lower()
    if cycle_value not in {"true", "false"}:
        raise ValueError("Cycle option must be true or false")
    isCycle = cycle_value == "true"

    edges = []
    for line in lines[1:-1]:
        values = line.split()
        if len(values) != 2:
            raise ValueError(f"Invalid edge: {line}")
        try:
            edge = tuple(map(int, values))
        except ValueError as error:
            raise ValueError(f"Invalid edge: {line}") from error
        edges.append(edge)

    if s is not None and not (0 <= s < n and 0 <= t < n):
        raise ValueError("Start and end nodes must be within the graph")

    graph = Graph(n, edges)
    solver = Solver(graph)
    result = solver.solve(cycle=isCycle, s=s, t=t)
    
    return result

if __name__ == "__main__":
    pass