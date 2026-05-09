import { useEffect } from 'react';
import { dbService } from '../../api/db';

const VisitorTracker = () => {
    useEffect(() => {
        const trackingKey = 'bulusan_visitor_tracked_v2';
        const hasTracked = localStorage.getItem(trackingKey);

        if (!hasTracked) {
            // Real-time increment for first-time visitor on this device
            dbService.updateGlobalStats(true);
            localStorage.setItem(trackingKey, 'true');
        } else {
            // Just fetch/init stats without incrementing
            dbService.updateGlobalStats(false);
        }
    }, []);

    return null; // Invisible component
};

export default VisitorTracker;
