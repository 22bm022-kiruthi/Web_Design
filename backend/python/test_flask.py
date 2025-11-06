from flask import Flask

app = Flask(__name__)

@app.route('/test')
def test():
    return 'OK'

if __name__ == '__main__':
    print("Starting test Flask service...")
    try:
        app.run(host='127.0.0.1', port=6003, debug=False)
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
