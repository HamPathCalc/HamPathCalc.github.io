from collections import deque

class Graph:
    def __init__(self, n, edges=None):
        self.n = n
        self.adj_matrix = [[1 if (i, j) in edges or (j, i) in edges else 0 for j in range(n)] for i in range(n)] if edges else [[0] * n for _ in range(n)]

    def add_edge(self, u, v):
        self.adj_matrix[u][v] = 1
        self.adj_matrix[v][u] = 1

    def remove_edge(self, u, v):
        if(self.adj_matrix[u][v] == 1):
            self.adj_matrix[u][v] = 0
            self.adj_matrix[v][u] = 0

    def remove_node(self, u):
        for v in range(self.n):
            if self.adj_matrix[u][v] == 1:
                self.adj_matrix[u][v] = 0
                self.adj_matrix[v][u] = 0
        self.adj_matrix = [row[:u] + row[u+1:] for row in self.adj_matrix[:u] + self.adj_matrix[u+1:]]
        self.n = len(self.adj_matrix)

    def get_edges(self):
        edges = []
        for u in range(self.n):
            for v in range(u + 1, self.n):
                if self.adj_matrix[u][v] == 1:
                    edges.append((u, v))
        return edges

    def get_nodes(self):
        return [i for i in range(self.n) if any(self.adj_matrix[i])]
    
    def bfs_distances(self, start):
        distances = [-1] * self.n
        distances[start] = 0
        queue = deque([start])
        
        while queue:
            node = queue.popleft()
            for neighbor in range(self.n):
                if self.adj_matrix[node][neighbor] == 1 and distances[neighbor] == -1:
                    distances[neighbor] = distances[node] + 1
                    queue.append(neighbor)
        
        return distances
    
    def degree(self, node):
        return sum(self.adj_matrix[node])