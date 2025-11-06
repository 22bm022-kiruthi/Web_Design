from flask import Flask, request, jsonify, send_from_directory
import os
import csv
import json
import base64
from io import BytesIO
from uuid import uuid4
from datetime import datetime
from openpyxl import load_workbook

app = Flask(__name__)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

METADATA_EXT = '.json'

def parse_csv_bytes(buffer: bytes):
    text = buffer.decode('utf-8', errors='replace')
    reader = csv.DictReader(text.splitlines())
    return [dict(r) for r in reader]

def parse_xlsx_bytes(buffer: bytes):
    wb = load_workbook(filename=BytesIO(buffer), data_only=True)
    ws = wb.worksheets[0]
    rows = list(ws.values)
    if not rows:
        return []
    headers = [str(h) if h is not None else f'col_{i}' for i, h in enumerate(rows[0])]
    out = []
    for r in rows[1:]:
        row_obj = {}
        for i, v in enumerate(r):
            key = headers[i] if i < len(headers) else f'col_{i}'
            row_obj[key] = v
        out.append(row_obj)
    return out

def save_metadata(obj):
    path = os.path.join(UPLOAD_DIR, f"{obj['id']}{METADATA_EXT}")
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, default=str)

def load_metadata(id):
    path = os.path.join(UPLOAD_DIR, f"{id}{METADATA_EXT}")
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def list_metadata():
    files = []
    for fn in os.listdir(UPLOAD_DIR):
        if fn.endswith(METADATA_EXT):
            try:
                with open(os.path.join(UPLOAD_DIR, fn), 'r', encoding='utf-8') as f:
                    obj = json.load(f)
                    files.append(obj)
            except Exception:
                continue
    # sort most recent first
    files.sort(key=lambda x: x.get('uploadDate', ''), reverse=True)
    return files

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request (expected field name "file")'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    fname = f.filename
    buf = f.read()
    parsed = []
    try:
        if fname.lower().endswith('.csv'):
            parsed = parse_csv_bytes(buf)
        elif fname.lower().endswith('.xls') or fname.lower().endswith('.xlsx'):
            parsed = parse_xlsx_bytes(buf)
        else:
            return jsonify({'error': 'Unsupported file type'}), 400
    except Exception as e:
        return jsonify({'error': 'Failed to parse file', 'details': str(e)}), 500

    fid = str(uuid4())
    content_b64 = base64.b64encode(buf).decode('ascii')
    meta = {
        'id': fid,
        'filename': fname,
        'uploadDate': datetime.utcnow().isoformat() + 'Z',
        'active': False,
        'parsedData': parsed,
        'content': content_b64,
    }
    save_metadata(meta)

    return jsonify({'message': 'File uploaded and parsed', 'fileId': fid, 'parsedData': parsed})

@app.route('/api/upload', methods=['GET'])
def list_files():
    files = list_metadata()
    # only return summary fields to match Node API
    summaries = [{' _id': f['id'], 'filename': f['filename'], 'uploadDate': f['uploadDate'], 'active': f.get('active', False), 'id': f['id']} for f in files]
    return jsonify({'files': summaries})

@app.route('/api/upload/<id>', methods=['GET'])
def get_file(id):
    meta = load_metadata(id)
    if not meta:
        return jsonify({'error': 'File not found'}), 404
    return jsonify({'file': meta})

@app.route('/api/upload/<id>/activate', methods=['POST'])
def activate_file(id):
    files = list_metadata()
    found = False
    for f in files:
        if f['id'] == id:
            f['active'] = True
            save_metadata(f)
            found = True
        else:
            if f.get('active'):
                f['active'] = False
                save_metadata(f)
    if not found:
        return jsonify({'error': 'File not found'}), 404
    meta = load_metadata(id)
    return jsonify({'message': 'Activated', 'file': meta})

if __name__ == '__main__':
    # Allow requests from local dev servers (simple CORS for convenience)
    from flask_cors import CORS
    CORS(app, origins=['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://localhost'])
    app.run(host='127.0.0.1', port=6003)
