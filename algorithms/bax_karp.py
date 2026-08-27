from .classes.helpfunctions import fast_matrix_power, generate_subsets, sum_all_matrix_elements
from .classes.hampathsolver import HamPathSolver
from .classes.graph import Graph

class BaxKarp(HamPathSolver):
    def __init__(self, graph):
        super().__init__(graph)
    
    def solve(self, cycle=False):
        self.V = [i for i in range(self.n)]
        self.subsets = generate_subsets(self.V)
        
        suma = 0
        
        for subset in self.subsets:
            A = [[0 for _ in range(len(self.graph.adj_matrix))] for _ in range(len(self.graph.adj_matrix))]
            sign = -1 if len(subset) % 2 else 1
            for i in range(len(self.graph.adj_matrix)):
                for j in range(len(self.graph.adj_matrix)):
                    if i in subset or j in subset:
                        A[i][j] = 0
                    else:
                        A[i][j] = self.graph.adj_matrix[i][j]
            if cycle:
                A = fast_matrix_power(A, len(self.graph.adj_matrix))
                suma += sign * sum(A[i][i] for i in range(self.n))
            else:
                A = fast_matrix_power(A, len(self.graph.adj_matrix)-1)
                suma += sign * sum_all_matrix_elements(A)

        if cycle:
            return suma // (2 * self.n) if self.n else 0
        return suma

if __name__ == "__main__":
    graf = Graph(2, [(0, 1)])
    
    V = [i for i in range(graf.n)]
    subsets = generate_subsets(V)
    
    suma = 0
    
    for subset in subsets:
        A = [[0 for _ in range(len(graf.adj_matrix))] for _ in range(len(graf.adj_matrix))]
        m = len(subset)
        if m % 2 == 0:
            m = 1
        else:
            m = -1
        for i in range(len(graf.adj_matrix)):
            for j in range(len(graf.adj_matrix)):
                if i in subset or j in subset:
                    A[i][j] = 0
                else:
                    A[i][j] = graf.adj_matrix[i][j]
        A = fast_matrix_power(A, len(graf.adj_matrix)-1)
        suma += m * sum_all_matrix_elements(A)
    print(suma)