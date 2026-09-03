from algorithms.bax_karp import BaxKarp
from algorithms.held_karp import HeldKarp
from algorithms.rectangular import Rectangular
from algorithms.classes.hampathsolver import HamPathSolver
from algorithms.classes.graph import Graph

def main(graph_text: str, Solver: HamPathSolver = BaxKarp):
    # Parse the graph from the input text
    lines = graph_text.strip().split('\n')
    n = int(lines[0])
    edges = list(map(lambda x: tuple(map(int, x.split())), lines[1:-1]))
    isCycle = lines[-1].strip().lower() == "true"  # Get the last line for the method
    #cycles = lines[-1].strip().lower() == "true"  # Get the last line for the method
    
    # Create the adjacency matrix
    graph = Graph(n, edges)
    
    solver = Solver(graph)
    
    result = solver.solve(cycle=isCycle)
    
    return result

if __name__ == "__main__":
    pass