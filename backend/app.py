from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import bcrypt
import jwt
import os
from dotenv import load_dotenv
from functools import wraps

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET')

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI'))
db = client['leaderboard_db']

# Collections
users = db['users']
login_logs = db['login_logs']
contributions = db['contributions']

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token.split()[1], app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = users.find_one({'username': data['username']})
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if users.find_one({'username': data['username']}):
        return jsonify({'message': 'Username already exists!'}), 400
    
    hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
    
    user = {
        'username': data['username'],
        'password': hashed_password,
        'is_admin': data.get('is_admin', False),
        'points': 0,
        'created_at': datetime.utcnow()
    }
    
    users.insert_one(user)
    return jsonify({'message': 'User created successfully!'}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = users.find_one({'username': data['username']})
    
    if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
        token = jwt.encode({
            'username': user['username'],
            'is_admin': user['is_admin']
        }, app.config['SECRET_KEY'])
        
        # Log login activity
        login_logs.insert_one({
            'username': user['username'],
            'timestamp': datetime.utcnow(),
            'ip_address': request.remote_addr
        })
        
        return jsonify({
            'token': token,
            'is_admin': user['is_admin']
        })
    
    return jsonify({'message': 'Invalid credentials!'}), 401

@app.route('/contribution', methods=['POST'])
@token_required
def add_contribution(current_user):
    data = request.get_json()
    
    contribution = {
        'username': current_user['username'],
        'activity': data['activity'],
        'points': data['points'],
        'timestamp': datetime.utcnow()
    }
    
    contributions.insert_one(contribution)
    users.update_one(
        {'username': current_user['username']},
        {'$inc': {'points': data['points']}}
    )
    
    return jsonify({'message': 'Contribution added successfully!'}), 201

@app.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    leaderboard = list(users.find({}, {'password': 0}).sort('points', -1))
    for user in leaderboard:
        user['_id'] = str(user['_id'])
    return jsonify(leaderboard)

@app.route('/user/activities', methods=['GET'])
@token_required
def get_user_activities(current_user):
    user_contributions = list(contributions.find(
        {'username': current_user['username']}
    ).sort('timestamp', -1))
    
    for contribution in user_contributions:
        contribution['_id'] = str(contribution['_id'])
        contribution['timestamp'] = contribution['timestamp'].isoformat()
    
    return jsonify(user_contributions)

@app.route('/admin/login-logs', methods=['GET'])
@token_required
def get_login_logs(current_user):
    if not current_user.get('is_admin'):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    logs = list(login_logs.find().sort('timestamp', -1))
    for log in logs:
        log['_id'] = str(log['_id'])
        log['timestamp'] = log['timestamp'].isoformat()
    
    return jsonify(logs)

@app.route('/admin/users', methods=['GET'])
@token_required
def get_users(current_user):
    if not current_user.get('is_admin'):
        return jsonify({'message': 'Unauthorized!'}), 403
    
    all_users = list(users.find({}, {'password': 0}))
    for user in all_users:
        user['_id'] = str(user['_id'])
        user['created_at'] = user['created_at'].isoformat()
    
    return jsonify(all_users)

if __name__ == '__main__':
    app.run(debug=True)
