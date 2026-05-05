import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function Communication() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Who do you want to talk to?</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Nurse' } })}
          onMouseLeave={handleMouseLeave}
        >
          Nurse
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Wife' } })}
          onMouseLeave={handleMouseLeave}
        >
          Wife
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Friend' } })}
          onMouseLeave={handleMouseLeave}
        >
          Friend
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/communication/other')}
          onMouseLeave={handleMouseLeave}
        >
          Other
        </button>
      </div>
    </>
  );
}
