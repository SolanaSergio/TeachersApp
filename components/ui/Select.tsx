import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, options, ...props }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-brand-subtle mb-1">{label}</label>
        <select
            {...props}
            className="w-full p-3 bg-brand-primary/50 rounded-lg border border-slate-600 focus:ring-2 focus:ring-brand-accent focus:outline-none appearance-none"
            style={{ 
                backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="white" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/></svg>')`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1.5em 1.5em'
            }}
        >
            {options.map(opt => <option key={opt.value} value={opt.value} className="bg-brand-secondary">{opt.label}</option>)}
        </select>
    </div>
);