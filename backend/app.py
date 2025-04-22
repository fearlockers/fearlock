from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/login', methods=['POST'])
def login():
    # フロントエンドからのデータを受け取る
    data = request.json
    email = data.get('email')
    password = data.get('password')

    # SupabaseのAPIを使って認証を行う
    # ここにSupabaseの認証ロジックを追加

    return jsonify({"message": "ログイン成功"})

if __name__ == '__main__':
    app.run(debug=True) 