from .graph import Graph

class HamPathSolver:
    def __init__(self, graph = Graph(0)):
        self.graph = graph
        self.n = graph.n
        self.visited = [False] * self.n
        self.path = []
    
    def solve(self, cycle=False):
        pass