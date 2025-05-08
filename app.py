from flask import Flask, render_template, request, redirect, url_for, session, flash,jsonify
from flask import current_app
import requests
import mysql.connector
import hashlib
import json
import os
import openai


app = Flask(__name__)
app.secret_key = 'super_secret_key'  # 🔐 Use env var in production

# ------------------------
# Database Connection
# ------------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="conocancer"
    )
# ------------------------
# Root route to redirect to app 
# ------------------------
@app.route("/")
def root():
    return redirect(url_for("index.html"))

# ------------------------
# Inject user_name globally into all templates
# ------------------------
@app.context_processor
def inject_user():
    return dict(user_name=session.get("user_name"))

# ------------------------
# Landing Page
# ------------------------
@app.route("/")
def index():
    show_questionnaire = session.pop("show_questionnaire", False)
    return render_template("index.html", show_questionnaire=show_questionnaire)

# ------------------------
# Signup
# ------------------------
@app.route("/signup", methods=["POST"])
def signup():
    name = request.form.get("name")
    email = request.form.get("email")
    password = request.form.get("password")
    confirm_password = request.form.get("confirmPassword")

    if password != confirm_password:
        return {"error": "Passwords do not match"}, 400

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (name, email, password_hash, preferred_language)
            VALUES (%s, %s, %s, %s)
        """, (name, email, password_hash, "English"))
        conn.commit()
        cursor.close()
        conn.close()

        print("User signup successful:", email)  # ✅ Optional debug line
        session["user_email"] = email

        return {"success": True}, 200

    except mysql.connector.IntegrityError:
        return {"error": "That email already exists."}, 400

    except Exception as e:
        print("Unexpected error during signup:", e)
        return {"error": "An unexpected error occurred."}, 500



# ------------------------
# Login
# ------------------------
@app.route("/login", methods=["POST"])
def login():
    email = request.form.get("loginEmail")
    password = request.form.get("loginPassword")
    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s AND password_hash = %s", (email, password_hash))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    if user:
        session["user_id"] = user["user_id"]
        session["user_name"] = user["name"]
        session["user_email"] = email
        flash(f"Welcome back, {user['name']}!", "success")
        return redirect(url_for("dashboard"))
    else:
        flash("Invalid login credentials", "error")
        return redirect(url_for("index"))

# ------------------------
# Questionnaire Submission
# ------------------------
@app.route("/submit_questionnaire", methods=["POST"])
def submit_questionnaire():
    if "user_email" not in session:
        return "Unauthorized", 403

    preferred_language = request.form.get("language")
    email = session["user_email"]

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE users SET preferred_language = %s WHERE email = %s
    """, (preferred_language, email))
    conn.commit()
    cursor.close()
    conn.close()

    # Refresh session
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()

    session.pop("user_email", None)
    session["user_id"] = user["user_id"]
    session["user_name"] = user["name"]

    return render_template("overview-dashboard.html")

# ------------------------
# Main Dashboard
# ------------------------
@app.route("/dashboard")
def dashboard():
    if "user_id" not in session:
        return redirect(url_for("index"))
    return render_template("overview-dashboard.html")

# ------------------------
# Static Pages
# ------------------------
@app.route("/videos-and-articles")
def videos_and_articles():
    return render_template("videos-and-articles.html")

@app.route("/progress")
def progress():
    return render_template("progress.html")

@app.route("/setting")
def setting():
    return render_template("setting.html")

# ------------------------
# Category Pages
# ------------------------
@app.route("/introduction")
def introduction():
    return render_template("introduction.html")

@app.route("/screening-detection")
def screening_detection():
    return render_template("screening-detection.html")

@app.route("/diagnosis")
def diagnosis():
    return render_template("diagnosis.html")

@app.route("/treatment")
def treatment():
    return render_template("treatment.html")

@app.route("/survivorship")
def survivorship():
    return render_template("survivorship.html")

# ------------------------
# Logout
# ------------------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))
@app.route("/video")
def video():
    return render_template("video_quiz.html")

@app.route("/api/questions/<video_id>")
def get_video_questions(video_id):
    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    cur.execute("""
        SELECT q.practice_question_id, q.practice_question_text, q.question_type, q.timestamp_seconds,
               q.category_id, o.option_number, o.option_text, o.is_correct
        FROM practice_questions q
        JOIN practice_question_options o
        ON q.practice_question_id = o.practice_question_id AND q.category_id = o.category_id
        WHERE q.video_id = %s
        ORDER BY q.timestamp_seconds, o.option_number
    """, (video_id,))
    rows = cur.fetchall()

    questions = {}
    for row in rows:
        qid = row['practice_question_id']
        if qid not in questions:
            questions[qid] = {
                'id': qid,
                'text': row['practice_question_text'],
                'type': row['question_type'],
                'timestamp': row['timestamp_seconds'],
                'category_id': row['category_id'],
                'options': []
            }
        questions[qid]['options'].append({
            'number': row['option_number'],
            'text': row['option_text']
        })
          # ✅ If this option is correct → save it
        if row['is_correct']:
            questions[qid]['correct_option'] = row['option_text']

    cur.close()
    conn.close()
    return jsonify(list(questions.values()))

@app.route("/submit_answer", methods=["POST"])
def submit_answer():
    data = request.get_json()
    user_id = data.get("user_id")  # ✅ This is already the correct user_id sent from frontend
    question_id = data.get("question_id")
    answer = data.get("answer")
    category_id = data.get("category_id")

    if not user_id:
        return jsonify({"error": "User ID missing"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Insert into user_practice_progress
    cur.execute("""
        INSERT INTO user_practice_progress (
            user_id, category_id, practice_question_id, question_type, user_answer
        )
        SELECT %s, %s, %s, question_type, %s
        FROM practice_questions
        WHERE practice_question_id = %s AND category_id = %s
    """, (user_id, category_id, question_id, answer, question_id, category_id))

    # Insert into practice_evaluation
    cur.execute("""
        INSERT INTO practice_evaluation (
            user_id, category_id, practice_question_id, user_answer
        ) VALUES (%s, %s, %s, %s)
    """, (user_id, category_id, question_id, answer))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({"message": "Answer recorded successfully"})

@app.route("/check_answer", methods=["POST"])
def check_answer():
    data = request.get_json()
    user_id = data.get("user_id")
    question_id = data.get("question_id")
    answer = data.get("answer")
    category_id = data.get("category_id")

    conn = get_db_connection()
    cur = conn.cursor(dictionary=True)

    # Check if answer is correct
    cur.execute("""
        SELECT is_correct FROM practice_question_options
        WHERE category_id = %s AND practice_question_id = %s AND option_text = %s
    """, (category_id, question_id, answer))
    
    row = cur.fetchone()
    conn.close()

    if row and row["is_correct"]:
        return jsonify({"correct": True})
    else:
        return jsonify({"correct": False})
    
@app.route("/api/progress", methods=["GET", "POST"])
def api_progress():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify([])

    if request.method == "POST":
        data = request.get_json()
        lesson_key = data.get("lessonKey")
        status = data.get("status")

        if lesson_key.startswith("video"):
            lesson_type = "video"
            lesson_id = int(lesson_key.replace("video", ""))
        elif lesson_key.startswith("quiz"):
            lesson_type = "quiz"
            lesson_id = int(lesson_key.replace("quiz", ""))
        else:
            lesson_type = "reading"
            lesson_id = 1

        conn = get_db_connection()
        cur = conn.cursor()

        # Check if progress already exists
        cur.execute("""
            SELECT * FROM user_progress_VQR
            WHERE user_id = %s AND lesson_type = %s AND lesson_id = %s
        """, (user_id, lesson_type, lesson_id))

        if cur.fetchone():
            # Update existing record → FIXED THIS LINE TO use status column
            cur.execute("""
                UPDATE user_progress_VQR SET status = %s WHERE user_id = %s AND lesson_type = %s AND lesson_id = %s
            """, (status, user_id, lesson_type, lesson_id))
        else:
            # Insert new record → FIXED THIS LINE to insert into status column
            cur.execute("""
                INSERT INTO user_progress_VQR (user_id, lesson_type, lesson_id, status)
                VALUES (%s, %s, %s, %s)
            """, (user_id, lesson_type, lesson_id, status))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"success": True})

    else:
        # GET request → load progress
        conn = get_db_connection()
        cur = conn.cursor(dictionary=True)

        # FIX THIS TOO → Fetch status column not completed
        cur.execute("""
            SELECT lesson_type, lesson_id, status FROM user_progress_VQR
            WHERE user_id = %s
        """, (user_id,))

        rows = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify(rows)
    
@app.route("/api/study_quiz/<int:category_id>")
def get_study_quiz(category_id):
    lang = request.args.get("lang", "en")
    lang_suffix = "E" if lang == "en" else "S"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get study questions filtered by language
    cursor.execute("""
        SELECT * FROM study_questions
        WHERE category_id = %s AND study_question_id LIKE %s
    """, (category_id, f"%{lang_suffix}"))

    questions = cursor.fetchall()

    result = []
    for q in questions:
        question_data = {
            "study_question_id": q["study_question_id"],
            "question_text": q["study_question_text"],
            "question_type": q["question_type"],
            "options": []
        }

        if q["question_type"] in ("Multiple Choice", "T/F"):
            cursor.execute("""
                SELECT option_text, is_correct
                FROM study_question_options
                WHERE category_id = %s AND study_question_id = %s
                ORDER BY option_number ASC
            """, (category_id, q["study_question_id"]))
            question_data["options"] = cursor.fetchall()

        result.append(question_data)

    conn.close()
    return jsonify(result)
@app.route("/api/submit_study_quiz", methods=["POST"])
def submit_study_quiz():
    data = request.get_json()
    # 1) Quick sanity check / logging
    print(" /api/submit_study_quiz got:", data)

    user_id     = data.get("user_id")
    category_id = data.get("category_id")
    answers     = data.get("answers", [])

    if not user_id or not category_id or not isinstance(answers, list):
        return jsonify({"error": "Malformed payload"}), 400

    conn   = get_db_connection()
    cursor = conn.cursor()

    for ans in answers:
        qid  = ans.get("question_id")
        qtyp = ans.get("question_type")
        # 2) grab either 'answer' or 'user_answer' from your JSON
        ua   = ans.get("answer", ans.get("user_answer", "")).strip()

        print(f" → inserting q={qid}, type={qtyp}, ua='{ua}'")

        try:
            cursor.execute("""
                INSERT INTO user_study_progress
                  (user_id, category_id, study_question_id, question_type, user_answer)
                VALUES (%s,      %s,          %s,               %s,            %s)
            """, (user_id, category_id, qid, qtyp, ua))
        except Exception as e:
            # 3) If something goes wrong, roll back & show the error
            conn.rollback()
            print("❌ SQL Error:", e)
            return jsonify({"error": str(e)}), 500

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True})


@app.route("/api/save_study_answer", methods=["POST"])
def save_study_answer():
    data = request.get_json()

    user_id = data.get("user_id")
    category_id = data.get("category_id")
    question_id = data.get("question_id")
    question_type = data.get("question_type")
    answer = data.get("answer")

    conn = get_db_connection()
    cursor = conn.cursor()

    # UPSERT (Insert or Update)
    cursor.execute("""
        INSERT INTO user_study_progress (user_id, category_id, study_question_id, question_type, user_answer)
        VALUES (%s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE user_answer = VALUES(user_answer), time_answered = CURRENT_TIMESTAMP
    """, (user_id, category_id, question_id, question_type, answer))

    conn.commit()
    conn.close()

    return jsonify({"success": True})

@app.route("/api/evaluate_study_quiz", methods=["POST"])
def evaluate_study_quiz():
    data = request.get_json()
    user_id     = data["user_id"]
    category_id = data["category_id"]

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # 1) fetch saved answers
    cursor.execute("""
      SELECT study_question_id, question_type, user_answer
      FROM user_study_progress
      WHERE user_id=%s AND category_id=%s
    """, (user_id, category_id))
    answers = cursor.fetchall()

    summary = []
    for ans in answers:
        qid   = ans["study_question_id"]
        ua    = (ans["user_answer"] or "").lower()
        qtype = ans["question_type"]

        if qtype in ("Multiple Choice", "T/F"):
            cursor.execute("""
              SELECT is_correct
              FROM study_question_options
              WHERE category_id=%s AND study_question_id=%s AND option_text=%s
            """, (category_id, qid, ans["user_answer"]))
            row = cursor.fetchone()
            status = "correct" if row and row["is_correct"] else "incorrect"

        else:
            # strip E/S suffix and pull both language variants
            base = qid[:-1]
            ids  = (base + "E", base + "S")
            cursor.execute("""
              SELECT response_type, answer_text
              FROM study_short_response
              WHERE study_question_id IN (%s, %s)
            """, ids)
            rows = cursor.fetchall()

            kws = {"correct": set(), "semi_correct": set()}
            for r in rows:
                for phrase in (r["answer_text"] or "").split(","):
                    p = phrase.strip().lower()
                    if p: kws[r["response_type"]].add(p)

            status = "incorrect"
            for kw in kws["correct"]:
                if kw in ua:
                    status = "correct"
                    break
            else:
                for kw in kws["semi_correct"]:
                    if kw in ua:
                        status = "semi_correct"
                        break

        summary.append({
            "question_id": qid,
            "user_answer": ans["user_answer"],
            "status": status
        })

    conn.close()
    return jsonify({"summary": summary})


openai.api_key = os.getenv('openai_key')  # set this in your environment

@app.route("/api/transcribe_whisper", methods=["POST"])
def transcribe_whisper():
    try:
        # Grab the raw audio bytes from the request
        audio_data = request.data
        if not audio_data:
            return jsonify({"error": "No audio data received"}), 400

        # OpenAI expects a file-like object, so wrap the bytes
        transcript_resp = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_data,             # raw bytes
            response_format="json"       # gives you .text and even timestamps if you want
        )

        # transcript_resp is a dict like {"text": "..."}
        return jsonify({"transcript": transcript_resp["text"]})

    except Exception as e:
        current_app.logger.exception("Whisper transcription failed")
        return jsonify({"error": str(e)}), 500
    
@app.route('/resources')
def resources():
    return render_template('resources.html')

# API: Load enriched hospitals from file
@app.route('/api/hospitals')
def hospitals():
    with open("northwell_enriched.json") as f:
        hospitals_data = json.load(f)
    return jsonify(hospitals_data)

@app.route('/api/hospitals/<int:hospital_id>')
def get_hospital_detail(hospital_id):
    with open("northwell_enriched.json") as f:
        hospitals_data = json.load(f)
    result = next((h for h in hospitals_data if h["id"] == hospital_id), None)
    return jsonify(result or {"error": "Hospital not found"}), 200 if result else 404

# API: Support groups
@app.route('/api/support-groups')
def support_groups():
    return jsonify(get_all_support_groups())

@app.route('/api/support-groups/<int:group_id>')
def get_support_group_detail(group_id):
    groups = get_all_support_groups()
    grp = next((g for g in groups if g["id"] == group_id), None)
    return jsonify(grp or {"error": "Support group not found"}), 200 if grp else 404

if __name__ == "__main__":
    app.run(debug=True)