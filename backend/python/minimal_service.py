"""
Minimal Custom Code Execution Service for testing
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/custom-code/execute', methods=['POST'])
def execute_code():
    """Execute user-provided Python code"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input_data', [])
        
        if not code:
            return jsonify({'error': 'No code provided'}), 400
        
        # Simple execution test
        result = {
            'success': True,
            'output_data': [],
            'stdout': 'Code execution placeholder',
            'stderr': '',
            'error': None
        }
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'custom-code-executor'}), 200


if __name__ == '__main__':
    port = 6004
    print(f"Starting Minimal Custom Code Service on port {port}...")
    print(f"Service is running at http://127.0.0.1:{port}")
    print("Press CTRL+C to stop")
    try:
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Service stopped")
