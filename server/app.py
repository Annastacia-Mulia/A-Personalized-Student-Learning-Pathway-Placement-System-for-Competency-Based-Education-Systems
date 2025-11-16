# Import statements at the top
import pickle
import smtplib
from email.mime.text import MIMEText
import os
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask import send_from_directory
from flask_cors import CORS
import pandas as pd
from supabase import create_client, Client
import smtplib
from email.mime.text import MIMEText

# Load environment variables

# Load ML model for pathway prediction
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'pathguider.pkl')
try:
    with open(MODEL_PATH, 'rb') as f:
        pathway_model = pickle.load(f)
except Exception as e:
    print(f"Error loading ML model: {e}")
    pathway_model = None


load_dotenv()

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError("Supabase URL and Service Role Key must be set in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])


# --- Appeal Routes ---
@app.route('/appeal', methods=['POST'])
def submit_appeal():
    """Endpoint to submit a student appeal"""
    data = request.json
    required_fields = ['student_email', 'appeal_text', 'placement_id']
    
    # Validate required fields
    if not all(field in data and str(data[field]).strip() != '' for field in required_fields):
        return jsonify({'message': f'Missing required fields: {required_fields}'}), 400

    # Enforce appeal limit (max 2 per student)
    try:
        count_response = supabase.table('appeal').select('id').eq('student_email', data['student_email']).execute()
        appeal_count = len(count_response.data) if count_response.data else 0
        if appeal_count >= 2:
            return jsonify({'message': 'Appeal limit reached. You can only appeal twice.'}), 403
    except Exception as e:
        return jsonify({'message': f'Error checking appeal limit: {str(e)}'}), 500

    # Create appeal record
    appeal_record = {
        'student_email': data['student_email'],
        'appeal_text': data['appeal_text'],
        'placement_id': data['placement_id'],
        'created_at': datetime.utcnow().isoformat(),
        'status': 'pending'
    }
    try:
        response = supabase.table('appeal').insert(appeal_record).execute()
        return jsonify({
            'message': 'Appeal submitted successfully!', 
            'appeal': appeal_record
        }), 201
    except Exception as e:
        return jsonify({'message': f'Error submitting appeal: {str(e)}'}), 500


@app.route('/appeals', methods=['GET'])
def get_appeals():
    """Endpoint for admin to fetch all appeals"""
    try:
        response = supabase.table('appeal').select('*').execute()
        appeals = response.data if response.data else []
        return jsonify({'appeals': appeals}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching appeals: {str(e)}'}), 500


@app.route('/appeal_status/<appeal_id>', methods=['PUT'])
def update_appeal_status(appeal_id):
    """Endpoint to update appeal status"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    status = data.get('status')
    rejection_reason = data.get('rejection_reason', None)
    
    # Validate status value
    if status not in ['pending', 'approved', 'rejected']:
        return jsonify({
            'message': 'Invalid status. Must be one of: pending, approved, rejected'
        }), 400
    
    try:
        response = supabase.table('appeal').update({'status': status}).eq('id', int(appeal_id)).execute()
        if not response.data:
            return jsonify({'message': 'Appeal not found'}), 404

        appeal = response.data[0]
        student_email = appeal['student_email']

        if status == 'rejected':
            # Insert into rejected_appeals
            supabase.table('rejected_appeals').insert({
                'pathway_id': appeal['placement_id'],
                'appeal_id': int(appeal_id),
                'rejection_reason': rejection_reason,
                'rejected_at': datetime.utcnow().isoformat()
            }).execute()
            send_appeal_email(student_email, status, rejection_reason)
        elif status == 'approved':
            # Insert into accepted_appeals
            supabase.table('accepted_appeals').insert({
                'pathway_id': appeal['placement_id'],
                'appeal_id': int(appeal_id),
                'old_pathway': appeal.get('old_pathway', ''),
                'new_pathway': appeal.get('new_pathway', ''),
                'accepted_at': datetime.utcnow().isoformat()
            }).execute()
            send_appeal_email(student_email, status)

        return jsonify({
            'message': 'Status updated successfully',
            'appeal': appeal
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error updating status: {str(e)}'}), 500


# --- Placement Routes ---
@app.route('/placements', methods=['GET'])
def get_placements():
    """Fetch all placements from Supabase"""
    try:
        response = supabase.table('student_pathways').select('*').execute()
        placements = response.data if response.data else []
        return jsonify({'placements': placements}), 200
    except Exception as e:
        return jsonify({'message': f'Error fetching placements: {str(e)}'}), 500


@app.route('/placements/<id>', methods=['PUT'])
def edit_placement(id):
    """Admin: Edit a placement"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    try:
        response = supabase.table('student_pathways').update(data).eq('id', id).execute()
        
        if not response.data:
            return jsonify({'message': 'Placement not found'}), 404
            
        return jsonify({
            'message': 'Placement updated successfully',
            'placement': response.data[0]
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error updating placement: {str(e)}'}), 500


@app.route('/placements/<id>', methods=['DELETE'])
def delete_placement(id):
    """Admin: Delete a placement"""
    try:
        response = supabase.table('student_pathways').delete().eq('id', id).execute()
        
        if not response.data:
            return jsonify({'message': 'Placement not found'}), 404
            
        return jsonify({'message': 'Placement deleted successfully'}), 200
    except Exception as e:
        return jsonify({'message': f'Error deleting placement: {str(e)}'}), 500


# --- File Upload Routes ---
@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload and process student data from CSV/Excel file"""
    # Validate file presence
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400

    # Read the file into a DataFrame
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file)
        else:
            return jsonify({'message': 'Unsupported file format. Use CSV or Excel.'}), 400
    except Exception as e:
        return jsonify({'message': f'Error reading file: {str(e)}'}), 400

    # Debug logging for DataFrame
    print(f"[DEBUG] DataFrame shape: {df.shape}")
    print(f"[DEBUG] DataFrame columns: {df.columns.tolist()}")
    print(f"[DEBUG] Number of rows: {len(df)}")

    # Check if DataFrame is empty
    if df.empty:
        return jsonify({'message': 'File is empty or has no valid data'}), 400

    # Normalize column names: lowercase and strip spaces
    df.columns = df.columns.str.strip().str.lower()


    # Accept both sets of column names and map accordingly
    # If Math/Reading/Writing are present, map them to stem/social_sciences/arts
    if {'Math', 'Reading', 'Writing'}.issubset(set(df.columns.str.title())):
        # Normalize to lowercase for consistency
        df.columns = df.columns.str.strip().str.title()
        df.rename(columns={
            'Math': 'stem',
            'Reading': 'social_sciences',
            'Writing': 'arts'
        }, inplace=True)
    else:
        # Mapping incoming columns to Supabase columns
        rename_map = {
            'email': 'email',
            'first name': 'first_name',
            'last name': 'last_name',
            'grade in stem': 'stem',
            'stem': 'stem',
            'grade in social sciences': 'social_sciences',
            'social sciences': 'social_sciences',
            'grade in arts': 'arts',
            'arts': 'arts',
            'arts and sports': 'arts'
        }
        df.rename(columns={col: rename_map.get(col, col) for col in df.columns}, inplace=True)

    # Validate required columns
    required_columns = {'stem', 'social_sciences', 'arts'}
    missing = required_columns - set(df.columns)
    if missing:
        return jsonify({
            'message': f'Missing columns: {missing}. Required: {required_columns}'
        }), 400

    pathways = []
    skipped_emails = []
    errors = []

    for index, row in df.iterrows():
        try:
            # Convert grades to float, default to 0 if invalid
            grades = [
                float(row.get('stem', 0)) if pd.notna(row.get('stem')) else 0,
                float(row.get('social_sciences', 0)) if pd.notna(row.get('social_sciences')) else 0,
                float(row.get('arts', 0)) if pd.notna(row.get('arts')) else 0
            ]
        except (ValueError, TypeError) as e:
            errors.append(f"Row {index + 2}: Invalid grade values - {str(e)}")
            continue

        first_name = str(row.get('first_name', 'Unknown')).strip() if pd.notna(row.get('first_name')) else 'Unknown'
        last_name = str(row.get('last_name', 'Unknown')).strip() if pd.notna(row.get('last_name')) else 'Unknown'
        email = str(row.get('email', '')).strip() if pd.notna(row.get('email')) else ''

        # Validate email
        if not email or '@' not in email:
            errors.append(f"Row {index + 2}: Invalid or missing email address")
            continue

        # Use ML model for pathway prediction
        if pathway_model is not None:
            try:
                grade_df = pd.DataFrame([grades], columns=['stem', 'social_sciences', 'arts'])
                predicted_pathway = pathway_model.predict(grade_df)[0]
            except Exception as e:
                predicted_pathway = 'Unknown'
                errors.append(f"Row {index + 2}: ML prediction error - {str(e)}")
        else:
            predicted_pathway = 'Unknown'

        pathway_data = {
            'first_name': first_name,
            'last_name': last_name,
            'email': email,
            'pathway': predicted_pathway
        }
        pathways.append(pathway_data)

        # Upsert into Supabase
        try:
            supabase.table('student_pathways').upsert({
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'stem': grades[0],
                'social_sciences': grades[1],
                'arts': grades[2],
                'gender': row.get('gender', None) if pd.notna(row.get('gender')) else None,
                'role': 'student',
                'interests': row.get('interests', None) if pd.notna(row.get('interests')) else None,
                'pathway': predicted_pathway
            }, on_conflict='email').execute()
        except Exception as e:
            error_str = str(e)
            if 'duplicate key' in error_str.lower() or 'unique constraint' in error_str.lower():
                skipped_emails.append(email)
            else:
                errors.append(f"Row {index + 2} ({email}): {error_str}")

    # Save processed file for download
    processed_filename = f"processed_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}.csv"
    processed_path = os.path.join(os.path.dirname(__file__), processed_filename)
    pd.DataFrame(pathways).to_csv(processed_path, index=False)

    # Save uploaded file metadata
    try:
        supabase.table('uploaded_files').insert({
            'name': file.filename,
            'uploaded_at': datetime.utcnow().isoformat(),
            'size': file.content_length or 0,
            'type': file.content_type or file.mimetype
        }).execute()
    except Exception as e:
        # Log but don't fail the entire upload
        print(f"Warning: Could not save file metadata: {str(e)}")

    # Check if processed file exists before returning download link
    processed_folder = os.path.join(os.getcwd(), 'processed')
    processed_file_path = os.path.join(processed_folder, processed_filename)
    download_link = None
    if os.path.exists(processed_file_path):
        download_link = f'/download/{processed_filename}'
    else:
        print(f"Processed file not found: {processed_file_path}")

    # Insert processed student data into Supabase (student_pathways table)
    for pathway_data in pathways:
        try:
            supabase.table('student_pathways').upsert(pathway_data, on_conflict='email').execute()
        except Exception as e:
            print(f"Warning: Could not upsert student data: {str(e)}")

    response_data = {
        'message': 'File processed successfully! \n Open the Placements tab to view sorted students.',
        'data': pathways,
        'skipped_emails': skipped_emails,
        'total_processed': len(pathways),
        'total_skipped': len(skipped_emails),
        'download_link': download_link
    }
    if errors:
        response_data['errors'] = errors
        response_data['total_errors'] = len(errors)
    return jsonify(response_data), 200
# --- Download processed file route ---
@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    processed_folder = os.path.join(os.getcwd(), 'processed')
    if os.path.exists(os.path.join(processed_folder, filename)):
        # Use send_from_directory for robust file serving
        return send_from_directory(processed_folder, filename, as_attachment=True)
    else:
        return jsonify({'error': 'File not found'}), 404


@app.route('/manual_upload', methods=['POST'])
def manual_upload():
    """Manual upload endpoint for teacher manual entry"""
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided'}), 400
    
    # Validate required fields
    required_fields = ['first_name', 'last_name', 'email', 'stem', 'social_sciences', 'arts']
    missing_fields = [field for field in required_fields if field not in data or str(data[field]).strip() == '']
    
    if missing_fields:
        return jsonify({
            'message': f'Missing or empty fields: {missing_fields}'
        }), 400

    # Validate and convert grades to numbers
    try:
        grades = {
            'stem': float(data['stem']),
            'social_sciences': float(data['social_sciences']),
            'arts': float(data['arts'])
        }
        
        # Validate grade ranges (optional - adjust as needed)
        for subject, grade in grades.items():
            if grade < 0 or grade > 100:
                return jsonify({
                    'message': f'Grade for {subject} must be between 0 and 100'
                }), 400
                
    except (ValueError, TypeError):
        return jsonify({'message': 'Grades must be valid numbers'}), 400

    # Validate email format
    email = str(data['email']).strip()
    if not email or '@' not in email or '.' not in email.split('@')[1]:
        return jsonify({'message': 'Invalid email address format'}), 400

    # Determine best pathway based on highest grade
    best_pathway = max(grades, key=grades.get)

    # Prepare student record
    student_record = {
        'first_name': str(data['first_name']).strip(),
        'last_name': str(data['last_name']).strip(),
        'email': email,
        'stem': grades['stem'],
        'social_sciences': grades['social_sciences'],
        'arts': grades['arts'],
        'pathway': best_pathway,
        'role': 'student',
        'gender': data.get('gender', None),
        'interests': data.get('interests', None)
    }

    # Upsert into Supabase
    try:
        response = supabase.table('student_pathways').upsert(
            student_record, 
            on_conflict='email'
        ).execute()
        
        return jsonify({
            'message': 'Student uploaded and sorted successfully!',
            'student': student_record
        }), 201
    except Exception as e:
        return jsonify({
            'message': f'Error uploading student: {str(e)}'
        }), 500


# Health check endpoint
@app.route('/predict-pathway', methods=['POST'])
def predict_pathway():
    """Predict student pathway using ML model"""
    if pathway_model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    data = request.json
    # Adjust feature extraction as needed for your model
    features = [
        float(data.get('stem', 0)),
        float(data.get('social_sciences', 0)),
        float(data.get('arts', 0))
    ]
    try:
        prediction = pathway_model.predict([features])
        return jsonify({'pathway': str(prediction[0])})
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500
@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# --- Email Sending Function ---
def send_appeal_email(to_email, status, reason=None):
    subject = f"Your Appeal Has Been {status.capitalize()}"
    body = f"Dear Student,\n\nYour appeal was {status}."
    if status == "rejected" and reason:
        body += f"\nReason: {reason}"
    body += "\n\nBest regards,\nPathGuider Team"

    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = "annastacia.nzoka@strathmore.edu"  # <-- Replace with your Gmail
    msg['To'] = to_email

    try:
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login("annastacia.nzoka@strathmore.edu", "dltd lnxk yoqy mjhz")  # <-- Replace with your app password
            server.sendmail(msg['From'], [msg['To']], msg.as_string())
    except Exception as e:
        print(f"Error sending email: {e}")

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'message': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({'message': 'Internal server error'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)