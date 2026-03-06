import { useEffect, useState, useRef } from 'react';
import { Clock } from 'lucide-react';

/**
 * Countdown timer component.
 * @param {number} durationSeconds - total seconds to count down from
 * @param {function} onExpire - called when timer hits 0
 */
const Timer = ({ durationSeconds, onExpire }) => {
    const [remaining, setRemaining] = useState(durationSeconds);
    const onExpireRef = useRef(onExpire);
    onExpireRef.current = onExpire;

    // Reset timer if durationSeconds changes
    useEffect(() => {
        setRemaining(durationSeconds);
    }, [durationSeconds]);

    useEffect(() => {
        if (remaining <= 0) return;

        const id = setInterval(() => {
            setRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(id);
                    setTimeout(() => onExpireRef.current(), 0);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(id);
    }, [remaining > 0]); // Start interval once when remaining becomes > 0



    const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
    const secs = String(remaining % 60).padStart(2, '0');
    const urgent = remaining < 60;

    return (
        <div className={`timer ${urgent ? 'urgent' : ''}`}>
            <Clock size={15} />
            {mins}:{secs}
        </div>
    );
};

export default Timer;
