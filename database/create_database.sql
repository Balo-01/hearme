-- Create patients table
CREATE TABLE patients (
    id VARCHAR2(50) PRIMARY KEY,
    birthdate DATE,
    firstname VARCHAR2(100),
    lastname VARCHAR2(100),
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    contact_number VARCHAR2(20)
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

-- Create observations table
CREATE TABLE observations (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    observation_date DATE,
    patient VARCHAR2(50) NOT NULL,
    description VARCHAR2(500),
    value VARCHAR2(100),
    units VARCHAR2(50),
    type VARCHAR2(20) CHECK (type IN ('text', 'numeric')),
    CONSTRAINT fk_observations_patient FOREIGN KEY (patient) REFERENCES patients(id)
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
    CONSTRAINT fk_requests_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- select * from patients;
-- select * from procedures;
-- select * from observations;
-- select * from medications;
-- select * from conditions;
-- select * from allergies;
-- select * from requests;

-- DELETE FROM procedures;
-- DELETE FROM observations;
-- DELETE FROM medications;
-- DELETE FROM conditions;
-- DELETE FROM allergies;
-- DELETE FROM requests;
-- DELETE FROM patients;
-- COMMIT;

