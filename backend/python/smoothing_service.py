from flask import Flask, request, jsonify
import numpy as np
from scipy.ndimage import gaussian_filter1d
from scipy.signal import savgol_filter, medfilt

app = Flask(__name__)

# Identify numeric columns
def numeric_columns(table):
    if not table or len(table) == 0:
        return []
    first = table[0]
    return [k for k, v in first.items() if isinstance(v, (int, float)) or (isinstance(v, str) and v.replace('.', '', 1).replace('-', '', 1).isdigit())]

# Convert to numpy array
def table_to_array(table, cols):
    arr = np.zeros((len(table), len(cols)), dtype=float)
    for i, row in enumerate(table):
        for j, col in enumerate(cols):
            try:
                arr[i, j] = float(row.get(col, 0) if row.get(col, None) is not None else 0)
            except Exception:
                arr[i, j] = 0.0
    return arr

# Convert back to rows
def array_to_table(original_table, cols, arr):
    out = []
    for i, row in enumerate(original_table):
        new_row = dict(row)
        for j, col in enumerate(cols):
            val = arr[i, j]
            if isinstance(row.get(col, None), int):
                new_row[col] = int(round(val))
            else:
                new_row[col] = float(round(val, 6))
        out.append(new_row)
    return out

@app.route('/api/smoothing', methods=['POST'])
def smoothing():
    payload = request.get_json() or {}
    table = payload.get('tableData') or payload.get('data') or []
    params = payload.get('params', {})
    method = params.get('method', 'moving_average')

    if not isinstance(table, list):
        return jsonify({'error': 'tableData must be a list of rows (objects)'}), 400

    cols = numeric_columns(table)
    if not cols:
        return jsonify({'error': 'No numeric columns found'}), 400

    arr = table_to_array(table, cols)

    if method == 'moving_average':
        window = int(params.get('window', 3))
        if window < 1:
            window = 3
        kernel = np.ones(window) / float(window)
        padded = np.pad(arr, ((window//2, window//2), (0,0)), mode='edge')
        smoothed = np.empty_like(arr)
        for c in range(arr.shape[1]):
            smoothed[:, c] = np.convolve(padded[:, c], kernel, mode='valid')

    elif method == 'gaussian':
        sigma = float(params.get('sigma', 1.0))
        smoothed = gaussian_filter1d(arr, sigma=sigma, axis=0, mode='nearest')

    elif method == 'savgol':
        window = int(params.get('window', 5))
        poly = int(params.get('poly', 2))
        # window must be odd and >= poly+2
        if window % 2 == 0:
            window += 1
        if window <= poly:
            window = poly + 3
        smoothed = np.empty_like(arr)
        for c in range(arr.shape[1]):
            try:
                smoothed[:, c] = savgol_filter(arr[:, c], window_length=window, polyorder=poly, mode='interp')
            except Exception:
                smoothed[:, c] = arr[:, c]

    elif method == 'median':
        kernel = int(params.get('kernel', 3))
        if kernel % 2 == 0:
            kernel += 1
        smoothed = np.empty_like(arr)
        for c in range(arr.shape[1]):
            try:
                smoothed[:, c] = medfilt(arr[:, c], kernel_size=kernel)
            except Exception:
                smoothed[:, c] = arr[:, c]

    else:
        return jsonify({'error': f'Unknown method {method}'}), 400

    out_table = array_to_table(table, cols, smoothed)
    return jsonify({'tableData': out_table})

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=6002)
