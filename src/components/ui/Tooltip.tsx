'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    children: React.ReactNode;
    triggerRef: React.RefObject<HTMLElement | null>;
    isVisible: boolean;
}

export const Tooltip = ({ children, triggerRef, isVisible }: TooltipProps) => {
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isVisible && triggerRef.current) {
            const updatePosition = () => {
                const rect = triggerRef.current!.getBoundingClientRect();
                const scrollY = window.scrollY;
                const scrollX = window.scrollX;

                // Position below the element by default
                setPosition({
                    top: rect.bottom + scrollY + 10, // 10px spacing
                    left: rect.left + scrollX + (rect.width / 2), // Center horizontally
                });
            };

            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        }
    }, [isVisible, triggerRef]);

    if (!mounted || !isVisible) return null;

    return createPortal(
        <div
            className="absolute z-[9999] animate-in fade-in zoom-in duration-200 pointer-events-none"
            style={{
                top: position.top,
                left: position.left,
                transform: 'translateX(-50%)' // Center align
            }}
        >
            {children}
        </div>,
        document.body
    );
};
