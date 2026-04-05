import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useHighlight(dataArray) {
    const location = useLocation();
    const navigate = useNavigate();
    const highlightId = location.state?.highlightId;
    const [highlightedRow, setHighlightedRow] = useState(null);

    useEffect(() => {
        if (highlightId && dataArray && dataArray.length > 0) {
            // Wait briefly for the DOM to render the list
            const timer1 = setTimeout(() => {
                const el = document.getElementById(`row-${highlightId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedRow(highlightId);

                    // Clear the state so a page refresh doesn't trigger the highlight again
                    navigate(location.pathname, { replace: true, state: {} });

                    // Remove the highlight class after 3 seconds
                    const timer2 = setTimeout(() => {
                        setHighlightedRow(null);
                    }, 3000);
                }
            }, 100);

            return () => clearTimeout(timer1);
        }
    }, [highlightId, dataArray, location.pathname, navigate]);

    return highlightedRow;
}
