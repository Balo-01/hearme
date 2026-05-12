import '../../../App.css';
import useHoverNavigate from '../../../hooks/useHoverNavigate';

export default function PainOther() {
  const { getNavigationProps } = useHoverNavigate(4000);

  return (
    <>
      <div className="center-message">Other pain areas</div>
      <div className="quadrant-container">
        <button
          className="quadrant-btn top-left"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Head' } })}
        >
          Head
        </button>
        <button
          className="quadrant-btn top-right"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Breathing' } })}
        >
          Breathing
        </button>
        <button
          className="quadrant-btn bottom-left"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Limbs' } })}
        >
          Limbs
        </button>
        <button
          className="quadrant-btn bottom-right"
          {...getNavigationProps('/patient/pain/intensity', { state: { area: 'Abdomen' } })}
        >
          Abdomen
        </button>
      </div>
    </>
  );
}
