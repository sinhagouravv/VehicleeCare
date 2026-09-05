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
        const maxAttempts = 30;

        const checkAndHighlight = () => {
            attempts++;

            // 1. Find matching data item in dataArray
            const targetItem = dataArray.find(item => {
                if (!item) return false;
                const vals = [
                    item._id, item.id, item.paymentId, item.transactionId,
                    item.bookingId, item.userId, item.employeeId, item.garageId,
                    item.stationId, item.messageId, item.reviewId, item.bugId,
                    item.remarkId, item.leaveId, item.documentId, item.docId,
                    item.documentName, item.documentType, item.docLabel, item.uploaderId,
                    item.vehicle?.number, item.vehicleNumber
                ].filter(Boolean).map(v => String(v).trim().toLowerCase());

                const cleanVals = vals.map(v => v.replace(/-/g, ''));
                const cleanIdKey = idKey.replace(/-/g, '');

                return vals.includes(idKey) || cleanVals.includes(cleanIdKey);
            });

            // Collect all candidate string IDs to look for in DOM
            const candidateIdStrings = new Set([
                rawHighlightId,
                idKey,
                rawHighlightId.replace(/-/g, ''),
                idKey.replace(/-/g, '')
            ]);

            if (targetItem) {
                [
                    targetItem.paymentId, targetItem.bookingId, targetItem.garageId,
                    targetItem.employeeId, targetItem.userId, targetItem.stationId,
                    targetItem.messageId, targetItem.reviewId, targetItem.bugId,
                    targetItem.remarkId, targetItem.leaveId, targetItem.documentId,
                    targetItem.docId, targetItem.transactionId, targetItem._id, targetItem.id
                ].filter(Boolean).forEach(val => {
                    const str = String(val).trim();
                    candidateIdStrings.add(str);
                    candidateIdStrings.add(str.toLowerCase());
                    candidateIdStrings.add(str.replace(/-/g, ''));
                    candidateIdStrings.add(str.toLowerCase().replace(/-/g, ''));
                });
            }

            // 2. Locate matching DOM element
            let el = null;

            for (const cId of candidateIdStrings) {
                if (!cId) continue;
                const found = document.getElementById(`row-${cId}`) ||
                              document.getElementById(`row-${cId.toLowerCase()}`) ||
                              document.querySelector(`[data-row-id="${cId}"]`) ||
                              document.querySelector(`[data-doc-id="${cId}"]`) ||
                              document.querySelector(`[data-document-id="${cId}"]`) ||
                              document.querySelector(`[data-bug-id="${cId}"]`) ||
                              document.querySelector(`[data-remark-id="${cId}"]`) ||
                              document.querySelector(`[data-request-id="${cId}"]`);
                if (found) {
                    el = found;
                    break;
                }
            }

            // Fallback: search all rows having id starting with 'row-' or custom data attributes
            if (!el) {
                const allRowEls = document.querySelectorAll('[id^="row-"], tr[data-row-id], tr[data-bug-id], tr[data-doc-id], tr[data-remark-id], tr[data-request-id]');
                const candidateArr = Array.from(candidateIdStrings).map(c => c.toLowerCase().replace(/-/g, ''));

                for (const rowEl of allRowEls) {
                    const rowElementId = (rowEl.id ? rowEl.id.replace(/^row-/, '') : '').trim().toLowerCase().replace(/-/g, '');
                    const datasetVals = [
                        rowEl.getAttribute('data-row-id'),
                        rowEl.getAttribute('data-bug-id'),
                        rowEl.getAttribute('data-doc-id'),
                        rowEl.getAttribute('data-document-id'),
                        rowEl.getAttribute('data-remark-id'),
                        rowEl.getAttribute('data-request-id')
                    ].filter(Boolean).map(v => v.toLowerCase().replace(/-/g, ''));

                    if (candidateArr.includes(rowElementId) || datasetVals.some(dv => candidateArr.includes(dv))) {
                        el = rowEl;
                        break;
                    }
                }
            }

            if (el) {
                highlightedIdsRef.current.add(idKey);

                // Determine rowId to highlight
                let activeRowId = rawHighlightId;
                if (el.id && el.id.startsWith('row-')) {
                    activeRowId = el.id.replace(/^row-/, '');
                } else if (targetItem) {
                    activeRowId = targetItem.paymentId || targetItem.bookingId || targetItem.garageId || targetItem.employeeId || targetItem.userId || targetItem.bugId || targetItem.remarkId || targetItem.leaveId || targetItem.documentId || targetItem._id;
                }

                const scrollToCenter = () => {
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
                };

                // Scroll immediately and also after modal animation finishes
                scrollToCenter();
                setTimeout(scrollToCenter, 150);
                setTimeout(scrollToCenter, 350);

                setHighlightedRow(activeRowId);

                // Clear route state so refresh/navigation doesn't re-trigger unexpectedly
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
