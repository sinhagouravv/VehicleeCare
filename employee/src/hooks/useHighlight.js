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
                let el = document.getElementById(`row-${highlightId}`);
                let matchedId = highlightId;

                if (!el) {
                    const matched = dataArray.find(item => 
                        item._id === highlightId || 
                        item.leaveId === highlightId || 
                        item.id === highlightId ||
                        item.overtimeId === highlightId ||
                        item.bookingId === highlightId
                    );
                    if (matched) {
                        matchedId = matched.leaveId || matched._id || matched.overtimeId || matched.bookingId;
                        el = document.getElementById(`row-${matchedId}`);
                    }
                }

                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedRow(matchedId);

                    // Clear the state so a page refresh doesn't trigger the highlight again
                    navigate(location.pathname, { replace: true, state: {} });

                    // Remove the highlight class after 3 seconds
                    const timer2 = setTimeout(() => {
                        setHighlightedRow(null);
                    }, 3000);
                }
            }, 150);

            return () => clearTimeout(timer1);
        }
    }, [highlightId, dataArray, location.pathname, navigate]);

    return highlightedRow;
}
