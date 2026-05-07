import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function BasicNeeds() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">What can I do for you?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Water', path: ['basic-needs', 'water'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Water
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Food', path: ['basic-needs', 'food'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Food
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/patient/final-answer', { state: { source: 'basic-needs', request: 'Toilet', path: ['basic-needs', 'toilet'] } })}
          onMouseLeave={handleMouseLeave}
        >
          Toilet
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/patient/basic-needs/other')}
          onMouseLeave={handleMouseLeave}
        >
          Other
        </button>
      </div>
    </>
  );
}
