import React, { useEffect, useRef } from 'react';
import { XIcon } from '../Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
            if (event.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        event.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        event.preventDefault();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            modalRef.current?.querySelector<HTMLElement>('button')?.focus();
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div ref={modalRef} className="bg-brand-secondary rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-600">
                    <h3 id="modal-title" className="text-xl font-bold text-brand-text truncate">{title}</h3>
                    <button onClick={onClose} className="p-1 text-brand-subtle hover:text-white rounded-full hover:bg-slate-600" aria-label="Close">
                        <XIcon className="h-6 w-6"/>
                    </button>
                </header>
                <div className="p-2 sm:p-6 overflow-y-auto bg-slate-800/50 flex-grow" style={{ backgroundImage: `url('data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100" 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M22.5 25.414l-2.828-2.828L17.5 20.414l2.828 2.828L22.5 25.414zM20.414 17.5l2.828-2.828L25.414 12.5l-2.828 2.828L20.414 17.5zM12.5 25.414L9.672 22.586 7.5 20.414l2.828-2.828L12.5 19.586l-2.828 2.828L12.5 25.414z" fill="%232c3e50" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E')`}}>
                    {children}
                </div>
            </div>
        </div>
    );
};
