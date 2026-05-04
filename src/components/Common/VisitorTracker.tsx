import { useEffect } from 'react';
import { dbService } from '../../api/db';

const VisitorTracker = () => {
    useEffect(() => {
        const sessionKey = 'bulusan_session_tracked';
        const hasTracked = sessionStorage.getItem(sessionKey);

        if (!hasTracked) {
            // Real-time increment
            dbService.updateGlobalStats(true);
            sessionStorage.setItem(sessionKey, 'true');
        } else {
            // Just initialize/ensure stats doc exists without incrementing
            dbService.updateGlobalStats(false);
        }
    }, []);

    return null; // Invisible component
};

export default VisitorTracker;
