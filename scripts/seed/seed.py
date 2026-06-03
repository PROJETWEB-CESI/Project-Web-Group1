#!/usr/bin/env python3
"""
NovaCampus Alliance ERP — polyglot seeder.

Reads the single source of truth (data/NOVACAMPUS_ALLIANCE_DATABASE.xlsx) and
loads each dataset into the store dictated by the architecture (Deliverable 1):

    PostgreSQL   transactional core (campuses, programs, students, courses,
                 instructors, rooms, schedules, enrollments, payments)
    ClickHouse   KPI snapshots for executive dashboards
    MongoDB      documents & logs (course materials, audit trail, notifications)
    Redis        cache & sessions (latest KPI cache, demo sessions)
    Qdrant       AI-agent vector store (institutional procedures, RAG) [optional]

Each store is independent: if one is unreachable the seeder reports it and
moves on, so partial runs work. Re-running is safe (drops/recreates).

Usage:
    python seed.py                 # core stores (PG, ClickHouse, Mongo, Redis)
    python seed.py --with-vectors  # also seed Qdrant
    python seed.py --only pg mongo # subset

Connection defaults match docker-compose.yml / .env.exemple.
Override any value with the corresponding env var (see each section below).
"""

import argparse
import datetime as dt
import hashlib
import os
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
XLSX = HERE / "data" / "EN_-_NOVACAMPUS_ALLIANCE_DATABASE.xlsx"
SCHEMA_SQL = HERE / "schema.sql"


# --------------------------------------------------------------------------- #
#  Excel reading helpers
# --------------------------------------------------------------------------- #
def load_sheets():
    """Return {sheet_name: list[dict]} with header row as keys."""
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    data = {}
    for ws in wb.worksheets:
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue
        headers = [str(h).strip() if h is not None else "" for h in rows[0]]
        records = []
        for r in rows[1:]:
            if all(c is None for c in r):
                continue
            records.append({headers[i]: r[i] for i in range(len(headers))})
        data[ws.title] = records
    return data


def txt(v):
    if v is None:
        return None
    s = str(v).strip()
    return s if s != "" else None


def num(v):
    if v is None or str(v).strip() == "":
        return None
    try:
        return Decimal(str(v).strip())
    except (InvalidOperation, ValueError):
        return None


def integer(v):
    n = num(v)
    return int(n) if n is not None else None


def flt(v, default=0.0):
    """num() → float, with a safe default for NULL cells."""
    n = num(v)
    return float(n) if n is not None else default


def to_date(v):
    if isinstance(v, dt.datetime):
        return v.date()
    if isinstance(v, dt.date):
        return v
    return None


def to_time_str(v):
    """datetime.time -> 'HH:MM:SS' string (BSON / display friendly)."""
    if isinstance(v, dt.time):
        return v.strftime("%H:%M:%S")
    return txt(v)


def require_sheet(sheets, name):
    """Return the sheet rows or raise a clear error."""
    if name not in sheets:
        available = ", ".join(sheets.keys())
        raise KeyError(
            f"Sheet '{name}' not found in workbook. "
            f"Available sheets: {available}"
        )
    return sheets[name]


# --------------------------------------------------------------------------- #
#  PostgreSQL — transactional core
# --------------------------------------------------------------------------- #
def seed_postgres(sheets):
    import psycopg2
    from psycopg2.extras import execute_values

    # Defaults match docker-compose.yml (POSTGRES_USER=nova, POSTGRES_PASSWORD=nova123)
    conn = psycopg2.connect(
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", "5432")),
        dbname=os.getenv("PG_DB", "novacampus"),
        user=os.getenv("PG_USER", "nova"),
        password=os.getenv("PG_PASSWORD", "nova123"),
    )
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute(SCHEMA_SQL.read_text())

    def bulk(table, cols, rows):
        if not rows:
            return
        execute_values(
            cur,
            f"INSERT INTO {table} ({', '.join(cols)}) VALUES %s",
            rows,
        )

    # campuses
    bulk("campuses",
         ["campus_id", "campus_name", "address", "city", "zip_code", "region",
          "campus_director", "phone", "email", "capacity_students",
          "opening_date", "status"],
         [(txt(r["Campus_ID"]), txt(r["Campus_Name"]), txt(r["Address"]),
           txt(r["City"]), txt(r["Zip_Code"]), txt(r["Region"]),
           txt(r["Campus_Director"]), txt(r["Phone"]), txt(r["Email"]),
           integer(r["Capacity_Students"]), to_date(r["Opening_Date"]),
           txt(r["Status"])) for r in sheets["CAMPUSES"]])

    # programs
    bulk("programs",
         ["program_id", "program_name", "program_type", "duration_years",
          "annual_tuition", "campus_id", "department", "coordinator",
          "max_students", "status"],
         [(txt(r["Program ID"]), txt(r["Program_Name"]), txt(r["Program_Type"]),
           integer(r["Duration_Years"]), num(r["Annual_Tuition"]),
           txt(r["Campus_ID"]), txt(r["Department"]), txt(r["Coordinator"]),
           integer(r["Maximum Students"]), txt(r["Status"]))
          for r in sheets["PROGRAMS"]])

    # instructors
    bulk("instructors",
         ["instructor_id", "first_name", "last_name", "email", "phone",
          "campus_id", "department", "status", "hire_date", "specialization"],
         [(txt(r["Instructor ID"]), txt(r["First_Name"]), txt(r["Last_Name"]),
           txt(r["Email"]), txt(r["Phone"]), txt(r["Campus_ID"]),
           txt(r["Department"]), txt(r["Status"]), to_date(r["Hire_Date"]),
           txt(r["Specialization"])) for r in sheets["INSTRUCTORS"]])

    # rooms
    bulk("rooms",
         ["room_id", "room_name", "campus_id", "building", "floor", "capacity",
          "room_type", "equipment", "status"],
         [(txt(r["Room ID"]), txt(r["Room_Name"]), txt(r["Campus_ID"]),
           txt(r["Building"]), integer(r["Floor"]), integer(r["Capacity"]),
           txt(r["Room_Type"]), txt(r["Equipment"]), txt(r["Status"]))
          for r in sheets["ROOMS"]])

    # students
    bulk("students",
         ["student_id", "first_name", "last_name", "email", "phone",
          "date_of_birth", "campus_id", "program_id", "enrollment_year",
          "status", "payment_status", "address", "city", "zip_code",
          "emergency_contact", "emergency_phone"],
         [(txt(r["Student ID"]), txt(r["First_Name"]), txt(r["Last_Name"]),
           txt(r["Email"]), txt(r["Phone"]), to_date(r["Date_of_Birth"]),
           txt(r["Campus_ID"]), txt(r["Program ID"]),
           integer(r["Enrollment_Year"]), txt(r["Status"]),
           txt(r["Payment_Status"]), txt(r["Address"]), txt(r["City"]),
           txt(r["Zip_Code"]), txt(r["Emergency_Contact"]),
           txt(r["Emergency_Phone"])) for r in sheets["STUDENTS"]])

    # courses
    bulk("courses",
         ["course_id", "course_name", "course_code", "program_id", "semester",
          "credits", "hours_total", "instructor_id", "room_id", "status"],
         [(txt(r["Course_ID"]), txt(r["Course_Name"]), txt(r["Course_Code"]),
           txt(r["Program ID"]), integer(r["Semester"]), integer(r["Credits"]),
           integer(r["Hours_Total"]), txt(r["Instructor ID"]),
           txt(r["Room ID"]), txt(r["Status"])) for r in sheets["COURSES"]])

    # schedules
    bulk("schedules",
         ["schedule_id", "course_id", "instructor_id", "room_id",
          "day_of_week", "start_time", "end_time", "semester",
          "academic_year", "status", "last_modified"],
         [(txt(r["Schedule_ID"]), txt(r["Course_ID"]), txt(r["Instructor ID"]),
           txt(r["Room ID"]), txt(r["Day_Of_Week"]), r["Start_Time"],
           r["End_Time"], integer(r["Semester"]), txt(r["Academic_Year"]),
           txt(r["Status"]), r["Last Modified"]) for r in sheets["SCHEDULES"]])

    # enrollments
    bulk("enrollments",
         ["enrollment_id", "student_id", "course_id", "semester",
          "academic_year", "status", "final_grade", "attendance_rate",
          "enrollment_date"],
         [(txt(r["Enrollment_ID"]), txt(r["Student ID"]), txt(r["Course_ID"]),
           integer(r["Semester"]), txt(r["Academic_Year"]), txt(r["Status"]),
           num(r["Final_Grade"]), num(r["Attendance_Rate"]),
           to_date(r["Enrollment_Date"])) for r in sheets["ENROLLMENTS"]])

    # payments
    bulk("payments",
         ["payment_id", "student_id", "invoice_date", "due_date", "amount",
          "status", "payment_date", "payment_method", "academic_year",
          "semester", "notes"],
         [(txt(r["Payment_ID"]), txt(r["Student ID"]), to_date(r["Invoice_Date"]),
           to_date(r["Due_Date"]), num(r["Amount"]), txt(r["Status"]),
           to_date(r["Payment_Date"]), txt(r["Payment_Method"]),
           txt(r["Academic_Year"]), integer(r["Semester"]), txt(r["Notes"]))
          for r in sheets["PAYMENTS"]])

    conn.commit()
    cur.execute("""
        SELECT 'campuses',   COUNT(*) FROM campuses   UNION ALL
        SELECT 'programs',   COUNT(*) FROM programs   UNION ALL
        SELECT 'instructors',COUNT(*) FROM instructors UNION ALL
        SELECT 'rooms',      COUNT(*) FROM rooms       UNION ALL
        SELECT 'students',   COUNT(*) FROM students    UNION ALL
        SELECT 'courses',    COUNT(*) FROM courses     UNION ALL
        SELECT 'schedules',  COUNT(*) FROM schedules   UNION ALL
        SELECT 'enrollments',COUNT(*) FROM enrollments UNION ALL
        SELECT 'payments',   COUNT(*) FROM payments;""")
    counts = ", ".join(f"{t}={n}" for t, n in cur.fetchall())
    cur.close()
    conn.close()
    print(f"  [PostgreSQL] OK  ({counts})")


# --------------------------------------------------------------------------- #
#  ClickHouse — KPI snapshots
# --------------------------------------------------------------------------- #
def seed_clickhouse(sheets):
    import clickhouse_connect

    # CH_HOST / CH_PORT / CH_USER / CH_PASSWORD — not in docker-compose yet;
    # add a clickhouse service and set these env vars when ready.
    client = clickhouse_connect.get_client(
        host=os.getenv("CH_HOST", "localhost"),
        port=int(os.getenv("CH_PORT", "8123")),
        username=os.getenv("CH_USER", "default"),
        password=os.getenv("CH_PASSWORD", ""),
        database="default",
    )
    client.command("CREATE DATABASE IF NOT EXISTS novacampus")
    client.command("DROP TABLE IF EXISTS novacampus.kpi_snapshots")
    client.command("""
        CREATE TABLE novacampus.kpi_snapshots (
            period                 String,
            campus_id              String,
            total_students         UInt32,
            enrollment_rate_pct    Float32,
            avg_attendance_pct     Float32,
            success_rate_pct       Float32,
            revenue                Float64,
            payment_default_pct    Float32,
            room_occupancy_pct     Float32
        ) ENGINE = MergeTree
        ORDER BY (period, campus_id)
    """)

    kpi_rows = require_sheet(sheets, "KPI_DASHBOARD")
    rows = [[
        txt(r["Period"]),
        txt(r["Campus_ID"]),
        integer(r["Total_Students"]) or 0,
        flt(r["Enrollment Rate Percent"]),
        flt(r["Average_Attendance_Percent"]),
        flt(r["Success Rate Percent"]),
        flt(r["Revenue"]),
        flt(r["Payment Default Rate Percent"]),
        flt(r["Room Occupancy Percent"]),
    ] for r in kpi_rows]

    client.insert(
        "novacampus.kpi_snapshots", rows,
        column_names=["period", "campus_id", "total_students",
                      "enrollment_rate_pct", "avg_attendance_pct",
                      "success_rate_pct", "revenue", "payment_default_pct",
                      "room_occupancy_pct"])
    n = client.query("SELECT count() FROM novacampus.kpi_snapshots").result_rows[0][0]
    print(f"  [ClickHouse] OK  (kpi_snapshots={n})")


# --------------------------------------------------------------------------- #
#  MongoDB — documents & logs (derived from relational data)
# --------------------------------------------------------------------------- #
def seed_mongo(sheets):
    from pymongo import MongoClient

    # Default matches docker-compose.yml (no auth on mongo service)
    client = MongoClient(
        os.getenv("MONGO_URI", "mongodb://localhost:27017/"))
    db = client[os.getenv("MONGO_DB", "novacampus")]

    for c in ("course_materials", "audit_logs", "notifications"):
        db[c].drop()

    # --- course_materials: one flexible document per course (syllabus + rubric)
    materials = []
    for c in sheets["COURSES"]:
        cid = txt(c["Course_ID"])
        materials.append({
            "_id": cid,
            "course_code": txt(c["Course_Code"]),
            "course_name": txt(c["Course_Name"]),
            "program_id": txt(c["Program ID"]),
            "semester": integer(c["Semester"]),
            "syllabus": {
                "objectives": [
                    f"Understand the core concepts of {txt(c['Course_Name'])}",
                    "Apply methods through practical work",
                    "Pass the final assessment",
                ],
                "sessions": integer(c["Hours_Total"]) // 3
                if integer(c["Hours_Total"]) else None,
                "bibliography": [
                    f"{txt(c['Course_Name'])} — Reference Handbook",
                    "Lecture notes (internal)",
                ],
            },
            "rubric": {
                "criteria": [
                    {"name": "Continuous assessment", "weight": 0.4},
                    {"name": "Final exam", "weight": 0.5},
                    {"name": "Participation", "weight": 0.1},
                ],
                "scale_max": 20,
            },
            "resources": [
                {"type": "pdf", "label": f"Syllabus {txt(c['Course_Code'])}"},
                {"type": "pdf", "label": "Session plan"},
            ],
        })
    db.course_materials.insert_many(materials)

    # --- audit_logs: immutable trail derived from enrollments / payments / schedules
    logs = []
    for e in sheets["ENROLLMENTS"]:
        logs.append({
            "event": "EnrollmentCreated",
            "service": "enrollment",
            "entity_id": txt(e["Enrollment_ID"]),
            "student_id": txt(e["Student ID"]),
            "course_id": txt(e["Course_ID"]),
            "ts": to_date(e["Enrollment_Date"]) and dt.datetime.combine(
                to_date(e["Enrollment_Date"]), dt.time()),
        })
        grade = num(e["Final_Grade"])
        if txt(e["Status"]) == "Validated" and grade is not None:
            logs.append({
                "event": "GradePublished",
                "service": "grades",
                "entity_id": txt(e["Enrollment_ID"]),
                "student_id": txt(e["Student ID"]),
                "course_id": txt(e["Course_ID"]),
                "final_grade": float(grade),
                "ts": dt.datetime(2024, 1, 20),
            })
    for p in sheets["PAYMENTS"]:
        if txt(p["Status"]) == "Paid":
            logs.append({
                "event": "PaymentReceived", "service": "billing",
                "entity_id": txt(p["Payment_ID"]),
                "student_id": txt(p["Student ID"]),
                "amount": flt(p["Amount"]),
                "ts": to_date(p["Payment_Date"]) and dt.datetime.combine(
                    to_date(p["Payment_Date"]), dt.time()),
            })
        else:
            logs.append({
                "event": "PaymentLate", "service": "billing",
                "entity_id": txt(p["Payment_ID"]),
                "student_id": txt(p["Student ID"]),
                "amount": flt(p["Amount"]),
                "ts": to_date(p["Due_Date"]) and dt.datetime.combine(
                    to_date(p["Due_Date"]), dt.time()),
            })
    for s in sheets["SCHEDULES"]:
        logs.append({
            "event": "ScheduleChanged", "service": "scheduling",
            "entity_id": txt(s["Schedule_ID"]),
            "course_id": txt(s["Course_ID"]),
            "room_id": txt(s["Room ID"]),
            "ts": s["Last Modified"],
        })
    db.audit_logs.insert_many(logs)

    # --- notifications: a small role-aware inbox sample
    notifs = [
        {"user_id": "STU002", "role": "student", "type": "deadline",
         "title": "Tuition reminder", "read": False,
         "body": "Semester 1 tuition is overdue. Please settle the balance."},
        {"user_id": "STU001", "role": "student", "type": "timetable",
         "title": "Room change", "read": False,
         "body": "Introduction to Business moved to Commerce A Lecture Hall."},
        {"user_id": "INST001", "role": "teacher", "type": "grades",
         "title": "Grades pending", "read": False,
         "body": "5 students still missing a grade for COM101."},
        {"user_id": "CAMP001", "role": "admin", "type": "billing",
         "title": "Overdue accounts", "read": False,
         "body": "3 accounts flagged for R1/R2 dunning at Paris Center."},
    ]
    db.notifications.insert_many(notifs)

    print(f"  [MongoDB] OK  (course_materials={db.course_materials.count_documents({})}, "
          f"audit_logs={db.audit_logs.count_documents({})}, "
          f"notifications={db.notifications.count_documents({})})")


# --------------------------------------------------------------------------- #
#  Redis — cache & sessions
# --------------------------------------------------------------------------- #
def seed_redis(sheets):
    import json
    import redis

    # Default matches docker-compose.yml (no auth on redis service)
    r = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", "6379")),
        decode_responses=True)
    r.ping()

    # latest KPI per campus (cache for executive/admin dashboards)
    kpi_rows = require_sheet(sheets, "KPI_DASHBOARD")
    latest = {}
    for row in kpi_rows:
        period, cid = txt(row["Period"]), txt(row["Campus_ID"])
        if cid not in latest or period > latest[cid][0]:
            latest[cid] = (period, row)
    for cid, (period, row) in latest.items():
        key = f"cache:kpi:{cid}"
        r.set(key, json.dumps({
            "period": period,
            "total_students": integer(row["Total_Students"]),
            "success_rate_pct": flt(row["Success Rate Percent"]),
            "revenue": flt(row["Revenue"]),
            "room_occupancy_pct": flt(row["Room Occupancy Percent"]),
        }), ex=3600)  # 1 h TTL

    # demo sessions (one per role) — token -> session hash, 30 min TTL
    demo = [
        ("student",   "STU001",  "CAMP001"),
        ("teacher",   "INST001", "CAMP001"),
        ("admin",     "CAMP001", "CAMP001"),
        ("executive", "DIR001",  None),
    ]
    for role, uid, campus in demo:
        token = "sess_" + hashlib.sha1(f"{role}:{uid}".encode()).hexdigest()[:24]
        r.hset(f"session:{token}", mapping={
            "user_id": uid, "role": role, "campus_id": campus or "ALL"})
        r.expire(f"session:{token}", 1800)

    print(f"  [Redis] OK  (kpi caches={len(latest)}, demo sessions={len(demo)})")


# --------------------------------------------------------------------------- #
#  Qdrant — AI-agent vector store (optional, offline embeddings)
# --------------------------------------------------------------------------- #
def _local_embed(text, dim=128):
    """Deterministic offline embedding (hashed bag-of-words). No downloads.
    Good enough to demonstrate the RAG pipeline; swap for a real model
    (e.g. nomic-embed via Ollama) in production."""
    vec = [0.0] * dim
    for tok in text.lower().split():
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        vec[h % dim] += 1.0
    norm = sum(x * x for x in vec) ** 0.5 or 1.0
    return [x / norm for x in vec]


def seed_qdrant(sheets):
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, PointStruct, VectorParams

    client = QdrantClient(
        host=os.getenv("QDRANT_HOST", "localhost"),
        port=int(os.getenv("QDRANT_PORT", "6333")))

    DIM = 128
    # recreate_collection is deprecated in qdrant-client >= 1.7
    client.delete_collection("institutional_procedures")
    client.create_collection(
        "institutional_procedures",
        vectors_config=VectorParams(size=DIM, distance=Distance.COSINE))

    procedures = [
        ("dunning", "Dunning workflow R1 R2 R3: first reminder at 15 days "
                    "overdue, second at 30 days, third and escalation at 45 days."),
        ("registration", "Student registration self-service workflow completed "
                          "in under one day, creates enrollment, billing record "
                          "and welcome notification via a saga."),
        ("absence", "Absence justification: any unjustified absence must be "
                    "justified within 5 working days or triggers an administrative "
                    "convocation."),
        ("ects", "ECTS credits are awarded per validated course; a semester "
                 "validates when the weighted average reaches the pass threshold."),
        ("conflict", "Scheduling conflict detection flags overlapping room or "
                     "instructor bookings; the assistant proposes free slots for "
                     "human confirmation."),
        ("ai_scope", "The NovaCampus assistant only proposes, explains and "
                     "synthesises; it never executes critical writes and filters "
                     "every answer by the user's role."),
    ]
    points = [
        PointStruct(id=i, vector=_local_embed(body),
                    payload={"topic": topic, "text": body})
        for i, (topic, body) in enumerate(procedures)
    ]
    client.upsert("institutional_procedures", points=points)
    n = client.count("institutional_procedures").count
    print(f"  [Qdrant] OK  (institutional_procedures={n})")


# --------------------------------------------------------------------------- #
#  Orchestration
# --------------------------------------------------------------------------- #
TASKS = {
    "pg":         ("PostgreSQL",  seed_postgres),
    "clickhouse": ("ClickHouse",  seed_clickhouse),
    "mongo":      ("MongoDB",     seed_mongo),
    "redis":      ("Redis",       seed_redis),
    "qdrant":     ("Qdrant",      seed_qdrant),
}


def main():
    ap = argparse.ArgumentParser(description="NovaCampus polyglot seeder")
    ap.add_argument("--with-vectors", action="store_true",
                    help="also seed the Qdrant vector store")
    ap.add_argument("--only", nargs="+", choices=list(TASKS),
                    help="seed only these stores")
    args = ap.parse_args()

    if not XLSX.exists():
        sys.exit(f"ERROR: source workbook not found at {XLSX}")
    if not SCHEMA_SQL.exists():
        sys.exit(f"ERROR: schema file not found at {SCHEMA_SQL}")

    sheets = load_sheets()
    print(f"Loaded workbook: {sum(len(v) for v in sheets.values())} rows "
          f"across {len(sheets)} sheets\n")

    if args.only:
        selected = args.only
    else:
        selected = ["pg", "clickhouse", "mongo", "redis"]
        if args.with_vectors:
            selected.append("qdrant")

    failures = 0
    for key in selected:
        name, fn = TASKS[key]
        try:
            fn(sheets)
        except Exception as exc:  # keep going if a store is down
            failures += 1
            print(f"  [{name}] SKIPPED — {type(exc).__name__}: {exc}")

    print(f"\nDone. {len(selected) - failures}/{len(selected)} stores seeded.")
    sys.exit(1 if failures == len(selected) else 0)


if __name__ == "__main__":
    main()
