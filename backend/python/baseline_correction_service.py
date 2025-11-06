from flask import Flask, request, jsonify
import math

app = Flask(__name__)


def is_number(s):
    if s is None:
        return False
    if isinstance(s, (int, float)):
        return True
    if isinstance(s, str):
        try:
            float(s)
            return True
        except Exception:
            return False
    return False


def numeric_columns(table):
    if not table or len(table) == 0:
        return []
    first = table[0]
    # detect numeric columns but exclude common x-axis names (shift/wavenumber/index/time/label)
    x_candidates = ['x', 'shift', 'wavenumber', 'raman', 'index', 'time', 'label', 'raman_shift', 'wavenumber_cm']
    numeric_cols = [k for k, v in first.items() if is_number(v)]
    y_cols = [c for c in numeric_cols if not any(x in c.lower() for x in x_candidates)]
    # if we didn't find any y-like numeric columns, return all numeric columns as a fallback
    return y_cols if len(y_cols) > 0 else numeric_cols


def table_to_array(table, cols):
    arr = []
    for row in table:
        vals = []
        for col in cols:
            v = row.get(col, 0)
            try:
                vals.append(float(v) if v is not None else 0.0)
            except Exception:
                vals.append(0.0)
        arr.append(vals)
    return arr


def array_to_table(original_table, cols, arr):
    out = []
    for i, row in enumerate(original_table):
        new_row = dict(row)
        for j, col in enumerate(cols):
            val = arr[i][j]
            # keep ints as ints if original was int
            if isinstance(row.get(col, None), int):
                new_row[col] = int(round(val))
            else:
                # round to 6 decimals
                new_row[col] = float(round(val, 6))
        out.append(new_row)
    return out


def min_subtract(arr):
    if not arr:
        return arr
    ncols = len(arr[0])
    minima = [min((row[c] for row in arr), default=0.0) for c in range(ncols)]
    corrected = [[row[c] - minima[c] for c in range(ncols)] for row in arr]
    return corrected


def rolling_min(arr, window=5):
    if not arr:
        return arr
    n = len(arr)
    ncols = len(arr[0])
    half = window // 2
    padded = []
    for i in range(n):
        padded.append(arr[i])
    # pad boundaries by repeating edge values
    for _ in range(half):
        padded.insert(0, arr[0])
        padded.append(arr[-1])
    corrected = [[0.0] * ncols for _ in range(n)]
    for c in range(ncols):
        col = [p[c] for p in padded]
        roll_min = []
        for i in range(0, len(col) - window + 1):
            roll_min.append(min(col[i:i+window]))
        for i in range(n):
            corrected[i][c] = arr[i][c] - roll_min[i]
    return corrected


@app.route('/api/baseline-correction', methods=['POST'])
def baseline_correction():
    payload = request.get_json() or {}
    table = payload.get('tableData') or payload.get('data') or []
    params = payload.get('params', {})
    method = params.get('method', 'min_subtract')

    if not isinstance(table, list):
        return jsonify({'error': 'tableData must be a list of rows (objects)'}), 400

    cols = numeric_columns(table)
    if not cols:
        return jsonify({'error': 'No numeric columns found'}), 400

    arr = table_to_array(table, cols)

    if method == 'min_subtract':
        corrected = min_subtract(arr)
    elif method == 'rolling_min':
        window = int(params.get('window', 5))
        if window < 1:
            window = 5
        corrected = rolling_min(arr, window)
    elif method == 'polynomial':
        # Polynomial fitting without numpy is expensive; fall back to min_subtract for now
        corrected = min_subtract(arr)
    else:
        return jsonify({'error': f'Unknown method {method}'}), 400

    out_table = array_to_table(table, cols, corrected)
    return jsonify({'tableData': out_table})


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=6001)
