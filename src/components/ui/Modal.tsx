import { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
    className?: string;
    fullScreen?: boolean;
}

export function Modal({ isOpen, onClose, children, title, className, fullScreen = false }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ pointerEvents: 'auto' }}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            'relative z-50 w-full bg-white shadow-xl',
                            fullScreen ? 'h-full w-full rounded-none' : 'max-w-lg rounded-xl',
                            'flex flex-col overflow-hidden',
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(title || fullScreen) && (
                            <div className={cn("flex items-center justify-between border-b px-4 py-3", fullScreen && "px-4 py-4")}>
                                {title && <h3 className="text-lg font-semibold">{title}</h3>}
                                <button
                                    onClick={onClose}
                                    className="ml-auto rounded-full p-1 hover:bg-gray-100 transition-colors"
                                >
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
