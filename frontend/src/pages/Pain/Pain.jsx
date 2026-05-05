import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function Pain() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">What hurts?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/pain/intensity', { state: { area: 'Head' } })}
          onMouseLeave={handleMouseLeave}
        >
          Head
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/pain/intensity', { state: { area: 'Stomach' } })}
          onMouseLeave={handleMouseLeave}
        >
          Stomach
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/pain/intensity', { state: { area: 'Back' } })}
          onMouseLeave={handleMouseLeave}
        >
          Back
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/pain/other')}
          onMouseLeave={handleMouseLeave}
        >
          Other
        </button>
      </div>
    </>
  );
}
