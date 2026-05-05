import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function CommunicationOther() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Other communication options</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Doctor' } })}
          onMouseLeave={handleMouseLeave}
        >
          Doctor
        </button>
        <button
          className="quadrant-btn top-right"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Family' } })}
          onMouseLeave={handleMouseLeave}
        >
          Family
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Translator' } })}
          onMouseLeave={handleMouseLeave}
        >
          Translator
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/final-answer', { state: { source: 'communication', request: 'Call support' } })}
          onMouseLeave={handleMouseLeave}
        >
          Call support
        </button>
      </div>
    </>
  );
}
