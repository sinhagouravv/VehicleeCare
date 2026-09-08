import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function useHighlight(dataArray, overrideHighlightId) {
    const location = useLocation();
    const navigate = useNavigate();
    const highlightId = overrideHighlightId || location.state?.highlightId;
    const [highlightedRow, setHighlightedRow] = useState(null);
    const highlightedIdsRef = useRef(new Set());

    useEffect(() => {
        if (!highlightId || !dataArray || dataArray.length === 0) return;

        const rawHighlightId = String(highlightId).trim();
        const idKey = rawHighlightId.toLowerCase();

        // Prevent repeated highlighting when data refreshes
        if (highlightedIdsRef.current.has(idKey)) return;

        let attempts = 0;
        const maxAttempts = 20;

        const checkAndHighlight = () => {
            attempts++;

            const targetItem = dataArray.find(item => {
                if (!item) return false;
                const vals = [
                    item._id, item.id, item.paymentId, item.transactionId,
                    item.bookingId, item.userId, item.employeeId, item.garageId,
                    item.stationId, item.messageId, item.reviewId, item.bugId,
                    item.remarkId, item.leaveId, item.meetingId, item.overtimeId,
                    item.requestId, item.documentId, item.docId
                ].filter(Boolean).map(v => String(v).trim().toLowerCase());

                return vals.includes(idKey);
            });

            const candidateIdStrings = new Set([
                rawHighlightId,
                idKey
            ]);

            if (targetItem) {
                [
                    targetItem.paymentId, targetItem.bookingId, targetItem.garageId,
                    targetItem.employeeId, targetItem.userId, targetItem.stationId,
                    targetItem.meetingId, targetItem.overtimeId, targetItem.leaveId,
                    targetItem.requestId, targetItem.messageId, targetItem._id, targetItem.id
                ].filter(Boolean).forEach(val => candidateIdStrings.add(String(val).trim()));
            }

            let el = null;

            for (const cId of candidateIdStrings) {
                const found = document.getElementById(`row-${cId}`) ||
                              document.getElementById(`row-${cId.toLowerCase()}`) ||
                              document.querySelector(`[data-row-id="${cId}"]`) ||
                              document.querySelector(`[data-meeting-id="${cId}"]`);
                if (found) {
                    el = found;
                    break;
                }
            }

            if (!el) {
                const allRowEls = document.querySelectorAll('[id^="row-"]');
                for (const rowEl of allRowEls) {
                    const rowElementId = rowEl.id.replace(/^row-/, '').trim().toLowerCase();
                    if (Array.from(candidateIdStrings).some(c => c.toLowerCase() === rowElementId)) {
                        el = rowEl;
                        break;
                    }
                }
            }

            if (el) {
                highlightedIdsRef.current.add(idKey);

                let activeRowId = rawHighlightId;
                if (el.id && el.id.startsWith('row-')) {
                    activeRowId = el.id.replace(/^row-/, '');
                } else if (targetItem) {
                    activeRowId = targetItem.bookingId || targetItem.meetingId || targetItem.overtimeId || targetItem.leaveId || targetItem.requestId || targetItem._id;
                }

                // Scroll container to place element in center
                const scrollParent = el.closest('.overflow-y-auto') || 
                                     el.closest('.overflow-auto') || 
                                     el.closest('[class*="overflow-y"]') || 
                                     el.parentElement;

                if (scrollParent && typeof scrollParent.scrollTo === 'function') {
                    const parentRect = scrollParent.getBoundingClientRect();
                    const elRect = el.getBoundingClientRect();
                    const relativeTop = elRect.top - parentRect.top;
                    const targetScrollTop = scrollParent.scrollTop + relativeTop - (parentRect.height / 2) + (elRect.height / 2);

                    scrollParent.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth'
                    });
                }

                try {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
                } catch (e) {}

                setHighlightedRow(activeRowId);

                if (location.state?.highlightId) {
                    navigate(location.pathname, { replace: true, state: {} });
                }

                setTimeout(() => {
                    setHighlightedRow(null);
                }, 3500);
            } else if (attempts < maxAttempts) {
                setTimeout(checkAndHighlight, 100);
            }
        };

        const timer = setTimeout(checkAndHighlight, 100);
        return () => clearTimeout(timer);
    }, [highlightId, dataArray, location.pathname, navigate]);

    return highlightedRow;
}
