"""
Custom Code Execution Service
Executes user-provided Python code in a sandboxed environment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import io
import traceback
import json
from contextlib import redirect_stdout, redirect_stderr
import numpy as np
import pandas as pd
import scipy

app = Flask(__name__)
CORS(app)

# Create a restricted import function that only allows safe modules
def safe_import(name, *args, **kwargs):
    """Only allow importing numpy, pandas, and scipy"""
    allowed_modules = ['numpy', 'pandas', 'scipy', 'np', 'pd']
    if name in allowed_modules or name.startswith('numpy.') or name.startswith('pandas.') or name.startswith('scipy.'):
        return __import__(name, *args, **kwargs)
    raise ImportError(f"Import of '{name}' is not allowed. Only numpy, pandas, and scipy are permitted.")

# Safe built-ins allowed in custom code
SAFE_BUILTINS = {
    'abs': abs,
    'all': all,
    'any': any,
    'bool': bool,
    'dict': dict,
    'enumerate': enumerate,
    'float': float,
    'int': int,
    'len': len,
    'list': list,
    'max': max,
    'min': min,
    'range': range,
    'round': round,
    'sorted': sorted,
    'sum': sum,
    'str': str,
    'zip': zip,
    'print': print,
    '__import__': safe_import,
}

# Safe libraries available to user code
SAFE_LIBRARIES = {
    'np': np,
    'pd': pd,
    'numpy': np,
    'pandas': pd,
    'scipy': scipy,
}


def execute_custom_code(code: str, input_data: list) -> dict:
    """
    Execute user-provided Python code in a restricted environment.
    
    Args:
        code: Python code string to execute
        input_data: List of dictionaries (table data)
    
    Returns:
        dict with 'success', 'output_data', 'stdout', 'stderr', 'error'
    """
    # Create restricted globals
    restricted_globals = {
        '__builtins__': SAFE_BUILTINS,
        **SAFE_LIBRARIES,
    }
    
    # Add input data to execution environment
    restricted_globals['input_data'] = input_data
    restricted_globals['output_data'] = None
    
    # Capture stdout and stderr
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    
    try:
        # Execute code with restricted globals
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            exec(code, restricted_globals)
        
        # Get output data (user should set 'output_data' variable)
        output_data = restricted_globals.get('output_data', input_data)
        
        return {
            'success': True,
            'output_data': output_data,
            'stdout': stdout_capture.getvalue(),
            'stderr': stderr_capture.getvalue(),
            'error': None
        }
    
    except Exception as e:
        return {
            'success': False,
            'output_data': None,
            'stdout': stdout_capture.getvalue(),
            'stderr': stderr_capture.getvalue(),
            'error': f"{type(e).__name__}: {str(e)}\n{traceback.format_exc()}"
        }


@app.route('/api/custom-code/execute', methods=['POST'])
def execute_code():
    """Execute user-provided Python code"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        input_data = data.get('input_data', [])
        
        if not code:
            return jsonify({'error': 'No code provided'}), 400
        
        # Execute the code
        result = execute_custom_code(code, input_data)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/custom-code/validate', methods=['POST'])
def validate_code():
    """Validate Python code syntax without executing"""
    try:
        data = request.get_json()
        code = data.get('code', '')
        
        if not code:
            return jsonify({'valid': False, 'error': 'No code provided'}), 400
        
        try:
            compile(code, '<string>', 'exec')
            return jsonify({'valid': True, 'error': None}), 200
        except SyntaxError as e:
            return jsonify({
                'valid': False,
                'error': f"Syntax Error on line {e.lineno}: {e.msg}"
            }), 200
    
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'custom-code-executor'}), 200


if __name__ == '__main__':
    port = 6004  # Changed from 6003 to avoid port conflict
    print(f"Starting Custom Code Execution Service on port {port}...")
    print(f"Service is running at http://127.0.0.1:{port}")
    print("Press CTRL+C to stop")
    try:
        app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)
    except Exception as e:
        print(f"ERROR starting Flask: {e}")
        import traceback
        traceback.print_exc()
    finally:
        print("Flask service stopped")
