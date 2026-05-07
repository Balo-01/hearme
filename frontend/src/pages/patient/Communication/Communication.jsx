import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function Communication() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Who do you want to talk to?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'communication', request: 'Nurse', path: ['communication', 'nurse'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Nurse
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'communication', request: 'Family', path: ['communication', 'family'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Family
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'communication', request: 'Doctor', path: ['communication', 'doctor'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Doctor
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'communication', request: 'Cleaning', path: ['communication', 'cleaning'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Cleaning
        </button>
      </div>
    </>
  );
}
