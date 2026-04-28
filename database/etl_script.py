import pandas as pd
import oracledb
import re
import random
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# Oracle connection settings from .env
DB_CONFIG = {
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'dsn': os.getenv('DB_DSN')
}

CSV_PATH = os.getenv('CSV_PATH', 'csv/')


def clean_name(name):
    """Remove non-English alphabet characters from name."""
    if pd.isna(name):
        return None
    return re.sub(r'[^a-zA-Z]', '', str(name))


def generate_contact_number():
    """Generate a random phone number."""
    return f"+1-{random.randint(200, 999)}-{random.randint(100, 999)}-{random.randint(1000, 9999)}"


def parse_date(date_str):
    """Parse date from various formats."""
    if pd.isna(date_str) or date_str == '':
        return None
    try:
        # Handle ISO format with time
        if 'T' in str(date_str):
            return datetime.fromisoformat(str(date_str).replace('Z', '+00:00')).date()
        # Handle date only format
        return datetime.strptime(str(date_str), '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


def load_patients(connection):
    """Load patients from CSV to database."""
    print("Loading patients...")
    df = pd.read_csv(f'{CSV_PATH}patients.csv')
    
    inserted_ids = set()
    cursor = connection.cursor()
    
    for _, row in df.iterrows():
        birthdate = parse_date(row['BIRTHDATE'])
        if birthdate is None:
            print(f"  Skipping patient {row['Id']} - no birthdate")
            continue
        
        patient_id = row['Id']
        firstname = clean_name(row['FIRST'])
        lastname = clean_name(row['LAST'])
        gender = row['GENDER'] if row['GENDER'] in ('M', 'F') else None
        contact_number = generate_contact_number()
        
        try:
            cursor.execute("""
                INSERT INTO patients (id, birthdate, firstname, lastname, gender, contact_number)
                VALUES (:1, :2, :3, :4, :5, :6)
            """, [patient_id, birthdate, firstname, lastname, gender, contact_number])
            inserted_ids.add(patient_id)
        except oracledb.IntegrityError as e:
            print(f"  Skipping duplicate patient {patient_id}")
    
    connection.commit()
    print(f"  Inserted {len(inserted_ids)} patients")
    return inserted_ids


def load_procedures(connection, valid_patient_ids):
    """Load procedures from CSV to database."""
    print("Loading procedures...")
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
        
        cursor.execute("""
            INSERT INTO procedures (procedure_date, patient, description, reason)
            VALUES (:1, :2, :3, :4)
        """, [procedure_date, patient_id, description, reason])
        count += 1
    
    connection.commit()
    print(f"  Inserted {count} procedures")


def load_observations(connection, valid_patient_ids):
    """Load observations from CSV to database."""
    print("Loading observations...")
    df = pd.read_csv(f'{CSV_PATH}observations.csv')
    
    cursor = connection.cursor()
    count = 0
    
    for _, row in df.iterrows():
        observation_date = parse_date(row['DATE'])
        if observation_date is None:
            continue
        
        patient_id = row['PATIENT']
        if patient_id not in valid_patient_ids:
            continue
        
        description = str(row['DESCRIPTION'])[:500] if pd.notna(row['DESCRIPTION']) else None
        value = str(row['VALUE'])[:100] if pd.notna(row['VALUE']) else None
        units = str(row['UNITS'])[:50] if pd.notna(row['UNITS']) else None
        obs_type = str(row['TYPE'])[:20] if pd.notna(row['TYPE']) else None
        
        cursor.execute("""
            INSERT INTO observations (observation_date, patient, description, value, units, type)
            VALUES (:1, :2, :3, :4, :5, :6)
        """, [observation_date, patient_id, description, value, units, obs_type])
        count += 1
    
    connection.commit()
    print(f"  Inserted {count} observations")


def load_medications(connection, valid_patient_ids):
    """Load medications from CSV to database."""
    print("Loading medications...")
    df = pd.read_csv(f'{CSV_PATH}medications.csv')
    
    cursor = connection.cursor()
    count = 0
    
    for _, row in df.iterrows():
        start_date = parse_date(row['START'])
        stop_date = parse_date(row['STOP'])
        
        # Both start and stop must exist
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
    print("Loading conditions...")
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
    print("Loading allergies...")
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
    print("Connecting to Oracle database...")
    connection = oracledb.connect(**DB_CONFIG)
    print("Connected successfully!")
    
    try:
        # Load patients first to get valid IDs
        valid_patient_ids = load_patients(connection)
        
        # Load other tables using valid patient IDs
        load_procedures(connection, valid_patient_ids)
        load_observations(connection, valid_patient_ids)
        load_medications(connection, valid_patient_ids)
        load_conditions(connection, valid_patient_ids)
        load_allergies(connection, valid_patient_ids)
        
        print("\nETL completed successfully!")
    finally:
        connection.close()


if __name__ == '__main__':
    main()
