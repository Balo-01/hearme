import hashlib
import pandas as pd
import oracledb
import re
import random
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'dsn': os.getenv('DB_DSN')
}

CSV_PATH = os.getenv('CSV_PATH', 'csv/')
MAX_NUMBER_OF_PATIENTS = 15
DATE_YEAR_OFFSET = 7


def add_years_safe(date_value, years):
    """Add years to a date, adjusting leap-day dates to Feb 28 when needed."""
    try:
        return date_value.replace(year=date_value.year + years)
    except ValueError:
        return date_value.replace(month=2, day=28, year=date_value.year + years)

def clean_name(name):
    """Remove non-English alphabet characters from name."""
    if pd.isna(name):
        return None
    return re.sub(r'[^a-zA-Z]', '', str(name)).capitalize()


def generate_contact_number():
    """Generate a random Romanian phone number in international format."""
    return f"+40 7{random.randint(0, 9)} {random.randint(100, 999)} {random.randint(100, 999)}"


def generate_cnp(birthdate, gender, patient_id):
    """Generate a deterministic Romanian CNP based on birthdate, gender, and patient_id."""
    year = birthdate.year
    month = birthdate.month
    day = birthdate.day

    if 1900 <= year <= 1999:
        s = 1 if gender == 'M' else 2
    elif 2000 <= year <= 2099:
        s = 5 if gender == 'M' else 6
    else:
        s = 3 if gender == 'M' else 4

    yy = year % 100

    h = int(hashlib.md5(patient_id.encode()).hexdigest(), 16)
    county = (h % 46) + 1
    sequence = (h % 999) + 1

    base = f"{s}{yy:02d}{month:02d}{day:02d}{county:02d}{sequence:03d}"

    weights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9]
    remainder = sum(int(base[i]) * weights[i] for i in range(12)) % 11
    control = 1 if remainder == 10 else remainder

    return base + str(control)

def parse_date(date_str):
    """Parse date from various formats."""
    if pd.isna(date_str) or date_str == '':
        return None
    try:
        if 'T' in str(date_str):
            parsed_date = datetime.fromisoformat(str(date_str).replace('Z', '+00:00')).date()
            return add_years_safe(parsed_date, DATE_YEAR_OFFSET)
        parsed_date = datetime.strptime(str(date_str), '%Y-%m-%d').date()
        return add_years_safe(parsed_date, DATE_YEAR_OFFSET)
    except (ValueError, TypeError):
        return None


def load_patients(connection):
    """Load patients from CSV to database."""
    df = pd.read_csv(f'{CSV_PATH}patients.csv')

    number_of_patients = 0
    inserted_ids = set()
    cursor = connection.cursor()
    
    for _, row in df.iterrows():
        birthdate = parse_date(row['BIRTHDATE'])
        if birthdate is None:
            continue
        
        patient_id = row['Id']
        firstname = clean_name(row['FIRST'])
        lastname = clean_name(row['LAST'])
        gender = row['GENDER'] if row['GENDER'] in ('M', 'F') else None
        contact_number = generate_contact_number()
        cnp = generate_cnp(birthdate, gender, patient_id) if gender else None
        
        try:
            cursor.execute("""
                INSERT INTO patients (id, birthdate, firstname, lastname, gender, contact_number, cnp)
                VALUES (:1, :2, :3, :4, :5, :6, :7)
            """, [patient_id, birthdate, firstname, lastname, gender, contact_number, cnp])
            inserted_ids.add(patient_id)
            number_of_patients += 1
        except oracledb.IntegrityError as e:
            print(f"  Skipping duplicate patient {patient_id}")
        
        if number_of_patients == MAX_NUMBER_OF_PATIENTS:
            break  
    
    connection.commit()
    print(f"  Inserted {len(inserted_ids)} patients")
    return inserted_ids


def load_procedures(connection, valid_patient_ids):
    """Load procedures from CSV to database."""
    df = pd.read_csv(f'{CSV_PATH}procedures.csv')
    
    cursor = connection.cursor()
    count = 0
    
    for _, row in df.iterrows():
        procedure_date = parse_date(row['DATE'])
        if procedure_date is None:
            continue
        
        patient_id = row['PATIENT']
        if patient_id not in valid_patient_ids:
            continue
        
        description = str(row['DESCRIPTION'])[:500] if pd.notna(row['DESCRIPTION']) else None
        reason = str(row['REASONDESCRIPTION'])[:500] if pd.notna(row['REASONDESCRIPTION']) else None
        
        if description and 'medication reconciliation' in description.lower():
            continue
        
        cursor.execute("""
            INSERT INTO procedures (procedure_date, patient, description, reason)
            VALUES (:1, :2, :3, :4)
        """, [procedure_date, patient_id, description, reason])
        count += 1
    
    connection.commit()
    print(f"  Inserted {count} procedures")


def load_medications(connection, valid_patient_ids):
    """Load medications from CSV to database."""
    df = pd.read_csv(f'{CSV_PATH}medications.csv')
    
    cursor = connection.cursor()
    count = 0
    
    for _, row in df.iterrows():
        start_date = parse_date(row['START'])
        stop_date = parse_date(row['STOP'])
        
        if start_date is None or stop_date is None:
            continue
        
        patient_id = row['PATIENT']
        if patient_id not in valid_patient_ids:
            continue
        
        description = str(row['DESCRIPTION'])[:500] if pd.notna(row['DESCRIPTION']) else None
        reason = str(row['REASONDESCRIPTION'])[:500] if pd.notna(row['REASONDESCRIPTION']) else None
        
        cursor.execute("""
            INSERT INTO medications (start_date, stop_date, patient, description, reason)
            VALUES (:1, :2, :3, :4, :5)
        """, [start_date, stop_date, patient_id, description, reason])
        count += 1
    
    connection.commit()
    print(f"  Inserted {count} medications")


def load_conditions(connection, valid_patient_ids):
    """Load conditions from CSV to database."""
    df = pd.read_csv(f'{CSV_PATH}conditions.csv')
    
    cursor = connection.cursor()
    count = 0
    
    for _, row in df.iterrows():
        patient_id = row['PATIENT']
        if patient_id not in valid_patient_ids:
            continue
        
        start_date = parse_date(row['START'])
        stop_date = parse_date(row['STOP'])
        description = str(row['DESCRIPTION'])[:500] if pd.notna(row['DESCRIPTION']) else None
        
        cursor.execute("""
            INSERT INTO conditions (start_date, stop_date, patient, description)
            VALUES (:1, :2, :3, :4)
        """, [start_date, stop_date, patient_id, description])
        count += 1
    
    connection.commit()
    print(f"  Inserted {count} conditions")


def load_allergies(connection, valid_patient_ids):
    """Load allergies from CSV to database."""
    df = pd.read_csv(f'{CSV_PATH}allergies.csv')
    
    cursor = connection.cursor()
    count = 0
    
    for _, row in df.iterrows():
        patient_id = row['PATIENT']
        if patient_id not in valid_patient_ids:
            continue
        
        description = str(row['DESCRIPTION'])[:500] if pd.notna(row['DESCRIPTION']) else None
        
        cursor.execute("""
            INSERT INTO allergies (patient, description)
            VALUES (:1, :2)
        """, [patient_id, description])
        count += 1
    
    connection.commit()
    print(f"  Inserted {count} allergies")


def main():
    connection = oracledb.connect(**DB_CONFIG)
    
    try:
        valid_patient_ids = load_patients(connection)
        
        load_procedures(connection, valid_patient_ids)
        load_medications(connection, valid_patient_ids)
        load_conditions(connection, valid_patient_ids)
        load_allergies(connection, valid_patient_ids)
        
    finally:
        connection.close()


if __name__ == '__main__':
    main()
