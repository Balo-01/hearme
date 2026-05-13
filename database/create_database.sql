-- Create patients table
CREATE TABLE patients (
    id VARCHAR2(50) PRIMARY KEY,
    birthdate DATE,
    firstname VARCHAR2(100),
    lastname VARCHAR2(100),
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    contact_number VARCHAR2(20),
    cnp VARCHAR2(13)
);

-- Create procedures table
CREATE TABLE procedures (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    procedure_date DATE,
    patient VARCHAR2(50) NOT NULL,
    description VARCHAR2(500),
    reason VARCHAR2(500),
    CONSTRAINT fk_procedures_patient FOREIGN KEY (patient) REFERENCES patients(id)
);

-- Create medications table
CREATE TABLE medications (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_date DATE,
    stop_date DATE,
    patient VARCHAR2(50) NOT NULL,
    description VARCHAR2(500),
    reason VARCHAR2(500),
    CONSTRAINT fk_medications_patient FOREIGN KEY (patient) REFERENCES patients(id)
);

-- Create conditions table
CREATE TABLE conditions (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    start_date DATE,
    stop_date DATE,
    patient VARCHAR2(50) NOT NULL,
    description VARCHAR2(500),
    CONSTRAINT fk_conditions_patient FOREIGN KEY (patient) REFERENCES patients(id)
);

-- Create allergies table
CREATE TABLE allergies (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient VARCHAR2(50) NOT NULL,
    description VARCHAR2(500),
    CONSTRAINT fk_allergies_patient FOREIGN KEY (patient) REFERENCES patients(id)
);

-- Create requests table
CREATE TABLE requests (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    patient_id VARCHAR2(50) NOT NULL,
    request_date TIMESTAMP,
    request_type VARCHAR2(100),
    description VARCHAR2(500),
    path CLOB,
    status VARCHAR2(20) DEFAULT 'active' NOT NULL,
    dismissed_at TIMESTAMP,
    CONSTRAINT fk_requests_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- select * from patients;
-- select * from procedures;
-- select * from medications;
-- select * from conditions;
-- select * from allergies;
-- select * from requests;

-- DELETE FROM procedures;
-- DELETE FROM medications;
-- DELETE FROM conditions;
-- DELETE FROM allergies;
-- DELETE FROM requests;
-- DELETE FROM patients;
-- COMMIT;

-- DROP TABLE procedures;
-- DROP TABLE observations;
-- DROP TABLE medications;
-- DROP TABLE conditions;
-- DROP TABLE allergies;
-- DROP TABLE requests;
-- DROP TABLE patients;