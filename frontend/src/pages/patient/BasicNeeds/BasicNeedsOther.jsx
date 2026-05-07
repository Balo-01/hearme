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
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Temperature', path: ['basic-needs', 'other', 'temperature'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Temperature
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Blanket', path: ['basic-needs', 'other', 'blanket'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Blanket
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Lighting', path: ['basic-needs', 'other', 'lighting'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Lighting
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Body position', path: ['basic-needs', 'other', 'body-position'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Body position
        </button>
      </div>
    </>
  );
}
