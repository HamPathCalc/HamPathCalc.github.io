def matrix_multiply(A, B):
    n = len(A)
    result = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                result[i][j] += A[i][k] * B[k][j]
    return result

def fast_matrix_power(matrix, power):
    n = len(matrix)
    result = [[1 if i == j else 0 for j in range(n)] for i in range(n)]
    base = [row[:] for row in matrix]
    
    while power > 0:
        if power % 2 == 1:
            result = matrix_multiply(result, base)
        base = matrix_multiply(base, base)
        power //= 2
    return result

def generate_subsets(V: list) -> list:
    if len(V) == 0:
        return [[]]
    _head = V[0]
    _tail = V[1:]
    x = list(map(lambda x : [_head] + x, generate_subsets(_tail))) + generate_subsets(_tail)
    x.sort(key=lambda x: len(x))
    return x

def sum_all_matrix_elements(matrix):
    return sum(sum(row) for row in matrix)