from .classes.hampathsolver import HamPathSolver
from .classes.graph import Graph

class Rectangular(HamPathSolver):
    def __init__(self, graph):
        super().__init__(graph)
        result = self.isRectangular()
        if isinstance(result, tuple):
            self.m, self.n, self.vertex_coords, self.coords = result
        else:
            self.m, self.n, self.vertex_coords, self.coords = (None, None, None, None)
    
    def isRectangular(self):
        nodes = self.graph.get_nodes()
        
        #1 A Graph must be connected
        distances = self.graph.bfs_distances(0)
        if any(distances[v] == -1 for v in nodes):
            return False
        
        #2 A Graph must have a maximum degree of 4
        degrees = {
            u: sum(self.graph.adj_matrix[u][v] for v in nodes)
            for u in nodes
        }

        if any(degrees[v] > 4 for v in nodes):
            return False
        
        #3 case n=1
        degree_one = [v for v in nodes if degrees[v] == 1]

        if len(degree_one) == 2 and all(degrees[v] <= 2 for v in nodes):
            start = degree_one[0]
            path = [start]
            prev = None
            current = start

            while True:
                next_nodes = [v for v in nodes if self.graph.adj_matrix[current][v] == 1 and v != prev]
                if not next_nodes:
                    break
                next_node = next_nodes[0]
                if next_node in path:
                    break
                path.append(next_node)
                prev, current = current, next_node

            vertex_coords = {v: (0, i) for i, v in enumerate(path)}
            coords = {(0, i): v for i, v in enumerate(path)}
            return 1, len(path), vertex_coords, coords
        
        #4 finding four corners
        corners = [v for v in nodes if degrees[v] == 2]

        if len(corners) != 4:
            return False
        
        #5 pick one corner and trying to rest.
        c0 = corners[0]
        
        d0 = self.graph.bfs_distances(c0)
        opposite_corner = max([c for c in corners if c != c0], key=lambda c: d0[c])
        c1, c2 = [c for c in corners if c != c0 and c != opposite_corner]

        if d0[c1] < d0[c2]:
            c1, c2 = c2, c1
        
        #6 determine rectangle dimensions
        m = d0[c1] + 1
        n = d0[c2] + 1
        
        if m * n != len(nodes):
            return False

        if d0[opposite_corner] != m + n - 2:
            return False
        
        d1 = self.graph.bfs_distances(c1)

        coords = {}
        vertex_coords = {}

        for v in nodes:
            numerator = d0[v] - d1[v] + m - 1

            # x must be an integer
            if numerator % 2 != 0:
                return False

            x = numerator // 2
            y = d0[v] - x

            # Must lie inside the rectangle
            if not (0 <= x <= m - 1):
                return False

            if not (0 <= y <= n - 1):
                return False

            # Two vertices cannot occupy the
            # same grid position.
            if (x, y) in coords:
                return False

            coords[(x, y)] = v
            vertex_coords[v] = (x, y)

        # Every position must exist.
        if len(coords) != m * n:
            return False

        #8 verify all edges

        for u in nodes:
            x1, y1 = vertex_coords[u]

            for v in nodes:
                if u == v:
                    continue

                x2, y2 = vertex_coords[v]

                should_be_edge = (
                    abs(x1 - x2) +
                    abs(y1 - y2)
                    == 1
                )

                is_edge = self.graph.adj_matrix[u][v] == 1

                if should_be_edge != is_edge:
                    return False
        
        return m, n, vertex_coords, coords
        
    def color(self, node):
        #white - 1, black - 0
        x, y = self.vertex_coords[node]
        return (x + y) % 2 == 0
    
    def color_compatible(self, s, t):
        if (self.m*self.n) % 2 == 0:
            return self.color(s) != self.color(t)
        else:
            return self.color(s) == self.color(t) == 1

    def isHamiltonian(self, s, t):
        return self._is_hamiltonian_rect(self._full_rect(), s, t)

    def _full_rect(self):
        return (0, self.m - 1, 0, self.n - 1)

    def _rect_dims(self, rect):
        xmin, xmax, ymin, ymax = rect
        return xmax - xmin + 1, ymax - ymin + 1

    def _in_rect(self, rect, vertex):
        x, y = self.vertex_coords[vertex]
        xmin, xmax, ymin, ymax = rect
        return xmin <= x <= xmax and ymin <= y <= ymax

    def _local_coords(self, rect, vertex):
        xmin, _, ymin, _ = rect
        x, y = self.vertex_coords[vertex]
        return x - xmin, y - ymin

    def _f3_rect(self, rect, s, t):
        width, height = self._rect_dims(rect)
        if min(width, height) != 3:
            return False

        length = max(width, height)
        if length % 2:
            return False

        sx, sy = self._local_coords(rect, s)
        tx, ty = self._local_coords(rect, t)
        if height == 3:
            s_long, s_short, t_long, t_short = sx, sy, tx, ty
        else:
            s_long, s_short, t_long, t_short = sy, sx, ty, tx

        for reverse_long in (False, True):
            for reverse_short in (False, True):
                sl = length - 1 - s_long if reverse_long else s_long
                tl = length - 1 - t_long if reverse_long else t_long
                ss = 2 - s_short if reverse_short else s_short
                ts = 2 - t_short if reverse_short else t_short

                for swap in (False, True):
                    ax, ay, bx, by = (tl, ts, sl, ss) if swap else (sl, ss, tl, ts)
                    if (ax + ay) % 2 != 1 or (bx + by) % 2 != 0:
                        continue
                    if (ay == 1 and ax < bx) or (ay != 1 and ax < bx - 1):
                        return True

        return False

    def _is_hamiltonian_rect(self, rect, s, t):
        width, height = self._rect_dims(rect)
        size = width * height
        if not self._in_rect(rect, s) or not self._in_rect(rect, t):
            return False
        if size == 1:
            return s == t
        if s == t:
            return False

        sx, sy = self._local_coords(rect, s)
        tx, ty = self._local_coords(rect, t)
        s_white = (sx + sy) % 2 == 0
        t_white = (tx + ty) % 2 == 0
        if size % 2 == 0:
            if s_white == t_white:
                return False
        elif not (s_white and t_white):
            return False

        if min(width, height) == 1:
            if width == 1:
                return {sy, ty} == {0, height - 1}
            return {sx, tx} == {0, width - 1}

        if min(width, height) == 2:
            if height == 2:
                s_long, s_short, t_long, t_short, length = sx, sy, tx, ty, width
            else:
                s_long, s_short, t_long, t_short, length = sy, sx, ty, tx, height
            if s_long == t_long and abs(s_short - t_short) == 1 and 0 < s_long < length - 1:
                return False

        return not self._f3_rect(rect, s, t)

    def _strip_candidates(self, rect, s, t):
        xmin, xmax, ymin, ymax = rect
        width, height = self._rect_dims(rect)
        for size in range(2, width):
            for strip, remainder in (
                ((xmin, xmin + size - 1, ymin, ymax), (xmin + size, xmax, ymin, ymax)),
                ((xmax - size + 1, xmax, ymin, ymax), (xmin, xmax - size, ymin, ymax)),
            ):
                sw, sh = self._rect_dims(strip)
                if sw > 1 and sh > 1 and sw * sh % 2 == 0 and self._in_rect(remainder, s) and self._in_rect(remainder, t) and self._is_hamiltonian_rect(remainder, s, t):
                    yield strip, remainder

        for size in range(2, height):
            for strip, remainder in (
                ((xmin, xmax, ymin, ymin + size - 1), (xmin, xmax, ymin + size, ymax)),
                ((xmin, xmax, ymax - size + 1, ymax), (xmin, xmax, ymin, ymax - size)),
            ):
                sw, sh = self._rect_dims(strip)
                if sw > 1 and sh > 1 and sw * sh % 2 == 0 and self._in_rect(remainder, s) and self._in_rect(remainder, t) and self._is_hamiltonian_rect(remainder, s, t):
                    yield strip, remainder

    def _split_candidates(self, rect, s, t):
        xmin, xmax, ymin, ymax = rect
        for cut_x in range(xmin, xmax):
            left = (xmin, cut_x, ymin, ymax)
            right = (cut_x + 1, xmax, ymin, ymax)
            if self._in_rect(left, s) and self._in_rect(right, t):
                first, second = left, right
            elif self._in_rect(right, s) and self._in_rect(left, t):
                first, second = right, left
            else:
                continue
            for y in range(ymin, ymax + 1):
                p = self.coords[(cut_x if first is left else cut_x + 1, y)]
                q = self.coords[(cut_x + 1 if first is left else cut_x, y)]
                if self._is_hamiltonian_rect(first, s, p) and self._is_hamiltonian_rect(second, q, t):
                    yield first, second, p, q

        for cut_y in range(ymin, ymax):
            top = (xmin, xmax, ymin, cut_y)
            bottom = (xmin, xmax, cut_y + 1, ymax)
            if self._in_rect(top, s) and self._in_rect(bottom, t):
                first, second = top, bottom
            elif self._in_rect(bottom, s) and self._in_rect(top, t):
                first, second = bottom, top
            else:
                continue
            for x in range(xmin, xmax + 1):
                p = self.coords[(x, cut_y if first is top else cut_y + 1)]
                q = self.coords[(x, cut_y + 1 if first is top else cut_y)]
                if self._is_hamiltonian_rect(first, s, p) and self._is_hamiltonian_rect(second, q, t):
                    yield first, second, p, q

    def _canonical_even_width_cycle(self, width, height):
        cycle = [(0, 0)]
        cycle.extend((0, y) for y in range(1, height))
        for x in range(1, width):
            values = range(height - 1, 0, -1) if x % 2 else range(1, height)
            cycle.extend((x, y) for y in values)
        cycle.append((width - 1, 0))
        cycle.extend((x, 0) for x in range(width - 2, 0, -1))
        return cycle

    def _hamiltonian_cycle_variants(self, rect):
        xmin, xmax, ymin, ymax = rect
        width, height = self._rect_dims(rect)
        bases = []
        if width % 2 == 0:
            bases.append(self._canonical_even_width_cycle(width, height))
        if height % 2 == 0:
            bases.append([(y, x) for x, y in self._canonical_even_width_cycle(height, width)])
        result = []
        seen = set()
        for base in bases:
            for reflect_x in (False, True):
                for reflect_y in (False, True):
                    cycle = []
                    for x, y in base:
                        x = width - 1 - x if reflect_x else x
                        y = height - 1 - y if reflect_y else y
                        cycle.append(self.coords[(xmin + x, ymin + y)])
                    if tuple(cycle) not in seen:
                        seen.add(tuple(cycle))
                        result.append(cycle)
        return result

    def _interface_delta(self, strip, remainder):
        if strip[1] + 1 == remainder[0] and strip[2:] == remainder[2:]:
            return -1, 0
        if remainder[1] + 1 == strip[0] and strip[2:] == remainder[2:]:
            return 1, 0
        if strip[3] + 1 == remainder[2] and strip[:2] == remainder[:2]:
            return 0, -1
        if remainder[3] + 1 == strip[2] and strip[:2] == remainder[:2]:
            return 0, 1
        return None

    def _merge_strip(self, path, cycle, strip, remainder):
        delta = self._interface_delta(strip, remainder)
        if delta is None:
            return None
        dx, dy = delta
        cycle_edges = {frozenset((cycle[i], cycle[(i + 1) % len(cycle)])): i for i in range(len(cycle))}
        cycle_pos = {vertex: i for i, vertex in enumerate(cycle)}
        for i, (a, b) in enumerate(zip(path, path[1:])):
            ax, ay = self.vertex_coords[a]
            bx, by = self.vertex_coords[b]
            ca, cb = (ax + dx, ay + dy), (bx + dx, by + dy)
            if not all(strip[0] <= x <= strip[1] and strip[2] <= y <= strip[3] for x, y in (ca, cb)):
                continue
            c, d = self.coords[ca], self.coords[cb]
            edge_index = cycle_edges.get(frozenset((c, d)))
            if edge_index is None:
                continue
            u, v = cycle[edge_index], cycle[(edge_index + 1) % len(cycle)]
            if self.graph.adj_matrix[a][u] and self.graph.adj_matrix[b][v]:
                start, end, step = u, v, -1
            elif self.graph.adj_matrix[a][v] and self.graph.adj_matrix[b][u]:
                start, end, step = v, u, 1
            else:
                continue
            opened = [start]
            index = (cycle_pos[start] + step) % len(cycle)
            while cycle[index] != end:
                opened.append(cycle[index])
                index = (index + step) % len(cycle)
            opened.append(end)
            return path[:i + 1] + opened + path[i + 1:]
        return None

    def _neighbors_in_rect(self, rect, vertex):
        x, y = self.vertex_coords[vertex]
        xmin, xmax, ymin, ymax = rect
        return [self.coords[(x + dx, y + dy)] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)) if xmin <= x + dx <= xmax and ymin <= y + dy <= ymax]

    def _small_hamiltonian_path(self, rect, s, t):
        xmin, xmax, ymin, ymax = rect
        vertices = [self.coords[(x, y)] for x in range(xmin, xmax + 1) for y in range(ymin, ymax + 1)]
        vertex_set = set(vertices)
        path, visited = [s], {s}

        def connected_from(current):
            allowed, stack, seen = vertex_set - visited | {current}, [current], {current}
            while stack:
                vertex = stack.pop()
                for neighbor in self._neighbors_in_rect(rect, vertex):
                    if neighbor in allowed and neighbor not in seen:
                        seen.add(neighbor)
                        stack.append(neighbor)
            return len(seen) == len(allowed)

        def dfs(current):
            if len(path) == len(vertices):
                return current == t
            if current == t:
                return False
            candidates = [v for v in self._neighbors_in_rect(rect, current) if v not in visited]
            candidates.sort(key=lambda v: (v == t, sum(z not in visited for z in self._neighbors_in_rect(rect, v))))
            for vertex in candidates:
                if vertex == t and len(path) != len(vertices) - 1:
                    continue
                visited.add(vertex)
                path.append(vertex)
                allowed = vertex_set - visited | {vertex}
                possible = all(u == vertex or any(z in allowed for z in self._neighbors_in_rect(rect, u)) for u in allowed)
                if possible and len(path) < len(vertices):
                    possible = connected_from(vertex)
                if possible and dfs(vertex):
                    return True
                path.pop()
                visited.remove(vertex)
            return False

        return path.copy() if dfs(s) else None

    def _line_path(self, rect, s, t):
        sx, sy = self.vertex_coords[s]
        tx, ty = self.vertex_coords[t]
        if sx == tx:
            step = 1 if ty > sy else -1
            return [self.coords[(sx, y)] for y in range(sy, ty + step, step)]
        step = 1 if tx > sx else -1
        return [self.coords[(x, sy)] for x in range(sx, tx + step, step)]

    def _solve_rect(self, rect, s, t, memo):
        key = (rect, s, t)
        if key in memo:
            return None if memo[key] is None else memo[key].copy()
        if not self._is_hamiltonian_rect(rect, s, t):
            memo[key] = None
            return None
        width, height = self._rect_dims(rect)
        if width * height == 1:
            result = [s]
        elif min(width, height) == 1:
            result = self._line_path(rect, s, t)
        elif width * height <= 20:
            result = self._small_hamiltonian_path(rect, s, t)
        else:
            result = None
            for strip, remainder in self._strip_candidates(rect, s, t):
                path = self._solve_rect(remainder, s, t, memo)
                if path is None:
                    continue
                for cycle in self._hamiltonian_cycle_variants(strip):
                    result = self._merge_strip(path, cycle, strip, remainder)
                    if result is not None:
                        break
                if result is not None:
                    break
            if result is None:
                for first, second, p, q in self._split_candidates(rect, s, t):
                    left = self._solve_rect(first, s, p, memo)
                    right = self._solve_rect(second, q, t, memo)
                    if left is not None and right is not None:
                        result = left + right
                        break
        memo[key] = result
        return None if result is None else result.copy()
    
    def solve(self, s = None, t = None, cycle=False):
        if self.vertex_coords is None:
            return "Graph is not rectangular"
        if s is None or t is None:
            s = 0
            t = self.n * self.m - 1
        if cycle:
            return "This solver currently supports Hamiltonian paths only"
        if not self.isHamiltonian(s, t):
            return "Hamiltonian Path does not exist"
        path = self._solve_rect(self._full_rect(), s, t, {})
        if path is None:
            return "Hamiltonian Path construction failed"
        return path, [], []