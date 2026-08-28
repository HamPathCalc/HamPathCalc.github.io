from .classes.helpfunctions import generate_subsets
from .classes.hampathsolver import HamPathSolver

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
        
        for i in range(len(V)):
            dp_row[str([i])][i] = True
        
        for subset_k, subset in subsets.items():
            for v in subset:
                new_subset = [x for x in subset if x != v]
                for u in new_subset:
                    if self.graph.adj_matrix[u][v] == 1 and dp_row[str(new_subset)][u]:
                        dp_row[subset_k][v] = True
                        break
        
        return dp_row[str(V)]


# if __name__ == "__main__":
#     subsets = {}

#     graf = [[0, 1, 0, 0, 0, 0],
#             [1, 0, 1, 0, 1, 0],
#             [0, 1, 0, 1, 0, 0],
#             [0, 0, 1, 0, 1, 1],
#             [0, 1, 0, 1, 0, 0],
#             [0, 0, 0, 1, 0, 0]]

#     def generate_subsets(V: list) -> list:
#         if len(V) == 0:
#             return [[]]
#         _head = V[0]
#         _tail = V[1:]
#         x = list(map(lambda x : [_head] + x, generate_subsets(_tail))) + generate_subsets(_tail)
#         x.sort(key=lambda x: len(x))
#         return x

#     V = [i for i in range(len(graf))]
#     real_subsets = generate_subsets(V)[1:]
#     for subs in real_subsets:
#         subsets[str(subs)] = subs

#     dp_row = {}
#     for subs in subsets.keys():
#         dp_row[subs] = [False for _ in range(len(V))]

#     for i in range(len(V)):
#         dp_row[str([i])][i] = True

#     for subset_k, subset in subsets.items():
#         for v in subset:
#             new_subset = [x for x in subset if x != v]
#             for u in new_subset:
#                 if graf[u][v] == 1 and dp_row[str(new_subset)][u]:
#                     dp_row[subset_k][v] = True
#                     break

#     print(sum(dp_row[str(V)]) > 0)