import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useHighlight(dataArray, overrideHighlightId) {
    const location = useLocation();
    const navigate = useNavigate();
    const highlightId = overrideHighlightId || location.state?.highlightId;
    const [highlightedRow, setHighlightedRow] = useState(null);

    useEffect(() => {
        if (highlightId && dataArray && dataArray.length > 0) {
            const targetItem = dataArray.find(item => 
                String(item._id) === String(highlightId) ||
                String(item.id) === String(highlightId) ||
                String(item.userId) === String(highlightId) ||
                String(item.employeeId) === String(highlightId) ||
                String(item.bookingId) === String(highlightId) ||
                String(item.stationId) === String(highlightId) ||
                String(item.garageId) === String(highlightId) ||
                String(item.messageId) === String(highlightId) ||
                String(item.reviewId) === String(highlightId) ||
                String(item.bugId) === String(highlightId) ||
                String(item.remarkId) === String(highlightId)
            );

            const timer1 = setTimeout(() => {
                let el = document.getElementById(`row-${highlightId}`);
                let matchedId = highlightId;

                if (targetItem) {
                    const possibleIds = [targetItem.remarkId, targetItem.reviewId, targetItem.bugId, targetItem.userId, targetItem.id, targetItem._id, targetItem.employeeId, targetItem.bookingId, targetItem.garageId, targetItem.stationId, targetItem.messageId].filter(Boolean);
                    for (const pId of possibleIds) {
                        const candidateEl = document.getElementById(`row-${pId}`);
                        if (candidateEl) {
                            el = candidateEl;
                            matchedId = pId;
                            break;
                        }
                    }
                }

                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setHighlightedRow(matchedId);

                    if (!overrideHighlightId) {
                        navigate(location.pathname, { replace: true, state: {} });
                    }

                    setTimeout(() => {
                        setHighlightedRow(null);
                    }, 3500);
                }
            }, 250);

            return () => clearTimeout(timer1);
        }
    }, [highlightId, dataArray, location.pathname, navigate, overrideHighlightId]);

    return highlightedRow;
}
