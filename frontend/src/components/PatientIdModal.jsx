import { useState } from 'react';
import { usePatient } from '../context/PatientContext';
import './PatientIdModal.css';

export default function PatientIdModal({ isOpen, onClose }) {
  const { setPatientId } = usePatient();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    if (inputValue.trim()) {
      setPatientId(inputValue.trim());
      setInputValue('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setInputValue('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Blur overlay */}
      <div className="patient-modal-overlay" />
      
      {/* Modal container */}
      <div className="patient-modal">
        <div className="patient-modal-content">
          <h2 className="patient-modal-title">Enter Patient ID</h2>
          <p className="patient-modal-subtitle">Please enter the patient ID to proceed</p>
          
          <input
            type="text"
            className="patient-modal-input"
            placeholder="Patient ID..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          
          <div className="patient-modal-buttons">
            <button
              className="patient-modal-btn-submit"
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
            >
              Confirm
            </button>
            <button
              className="patient-modal-btn-cancel"
              onClick={() => {
                setInputValue('');
                onClose();
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
