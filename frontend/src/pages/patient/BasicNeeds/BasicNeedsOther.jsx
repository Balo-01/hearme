import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function BasicNeedsOther() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Other basic needs</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Temperature' } })}
          onMouseLeave={handleMouseLeave}
        >
          Temperature
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Blanket' } })}
          onMouseLeave={handleMouseLeave}
        >
          Blanket
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Lighting' } })}
          onMouseLeave={handleMouseLeave}
        >
          Lighting
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Assistance' } })}
          onMouseLeave={handleMouseLeave}
        >
          Assistance
        </button>
      </div>
    </>
  );
}
