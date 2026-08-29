from .classes.helpfunctions import generate_subsets
from .classes.hampathsolver import HamPathSolver
from .classes.graph import Graph

class HeldKarp(HamPathSolver):
    def __init__(self, graph):
        super().__init__(graph)
    
    def solve(self, cycle=False):
        subsets = {}
        V = [i for i in range(self.n)]
        real_subsets = generate_subsets(V)[1:]
        for subs in real_subsets:
            subsets[str(subs)] = subs
        
        dp_row = {}
        for subs in subsets.keys():
            dp_row[subs] = [False for _ in range(len(V))]
        
        if cycle:
            dp_row[str([0])][0] = True
        else:
            for i in range(len(V)):
                dp_row[str([i])][i] = True
        
        for subset_k, subset in subsets.items():
            for v in subset:
                new_subset = [x for x in subset if x != v]
                for u in new_subset:
                    if self.graph.adj_matrix[u][v] == 1 and dp_row[str(new_subset)][u]:
                        dp_row[subset_k][v] = True
                        break
        
        path = []
        for i in range(len(V)):
            if not dp_row[str(V)][i]:
                continue

            if cycle and self.graph.adj_matrix[i][0] != 1:
                continue

            path.append(i)
            break
        
        if len(path) == 0:
            return "No Hamiltonian Path exists"
        
        while len(path) < len(V):
            new_subset = [x for x in V if x not in path]
            for v in new_subset:
                if dp_row[str(new_subset)][v] and self.graph.adj_matrix[path[-1]][v] == 1:
                    path.append(v)
                    break
        
        path.reverse()
        if cycle:
            path.append(path[0])
        return path


if __name__ == "__main__":
    graph = Graph(3, [(0, 1), (1, 2), (2, 0)])
    solver = HeldKarp(graph)
    result = solver.solve(cycle=False)
    print(result)