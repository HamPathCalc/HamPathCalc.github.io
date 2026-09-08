from collections import deque

class Graph:
    def __init__(self, n, edges=None):
        if n < 0:
            raise ValueError("Node count cannot be negative")

        edges = edges or []
        for edge in edges:
            if len(edge) != 2 or any(not isinstance(node, int) for node in edge):
                raise ValueError(f"Invalid edge: {edge}")
            u, v = edge
            if not (0 <= u < n and 0 <= v < n):
                raise ValueError(f"Edge endpoint outside graph: {edge}")
            if u == v:
                raise ValueError(f"Self-loop is not allowed: {edge}")

        self.n = n
        self.adj_matrix = [[1 if (i, j) in edges or (j, i) in edges else 0 for j in range(n)] for i in range(n)]

    def add_edge(self, u, v):
        self._validate_edge(u, v)
        self.adj_matrix[u][v] = 1
        self.adj_matrix[v][u] = 1

    def remove_edge(self, u, v):
        self._validate_edge(u, v)
        if(self.adj_matrix[u][v] == 1):
            self.adj_matrix[u][v] = 0
            self.adj_matrix[v][u] = 0

    def _validate_edge(self, u, v):
        if not isinstance(u, int) or not isinstance(v, int):
            raise ValueError(f"Invalid edge: {(u, v)}")
        if not (0 <= u < self.n and 0 <= v < self.n):
            raise ValueError(f"Edge endpoint outside graph: {(u, v)}")
        if u == v:
            raise ValueError(f"Self-loop is not allowed: {(u, v)}")

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