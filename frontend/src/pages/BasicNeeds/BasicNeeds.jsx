import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function BasicNeeds() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">What can I do for you?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'basic-needs', request: 'Water' } })}
          onMouseLeave={handleMouseLeave}
        >
          Water
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'basic-needs', request: 'Food' } })}
          onMouseLeave={handleMouseLeave}
        >
          Food
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'basic-needs', request: 'Toilet' } })}
          onMouseLeave={handleMouseLeave}
        >
          Toilet
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/basic-needs/other')}
          onMouseLeave={handleMouseLeave}
        >
          Other
        </button>
      </div>
    </>
  );
}
