import '../../App.css';
import useHoverNavigate from '../../hooks/useHoverNavigate';

export default function PainOther() {
  const { handleMouseEnter, handleMouseLeave } = useHoverNavigate(3000);

  return (
    <>
      <div className="center-message">Other pain areas</div>
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
          onMouseEnter={() => handleMouseEnter('/pain/intensity', { state: { area: 'Breathing' } })}
          onMouseLeave={handleMouseLeave}
        >
          Breathing
        </button>
        <button
          className="quadrant-btn bottom-left"
          onMouseEnter={() => handleMouseEnter('/pain/intensity', { state: { area: 'Limbs' } })}
          onMouseLeave={handleMouseLeave}
        >
          Limbs
        </button>
        <button
          className="quadrant-btn bottom-right"
          onMouseEnter={() => handleMouseEnter('/pain/intensity', { state: { area: 'Abdomen' } })}
          onMouseLeave={handleMouseLeave}
        >
          Abdomen
        </button>
      </div>
    </>
  );
}
