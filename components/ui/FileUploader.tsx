import React from 'react';
import { ImageFile } from '../../types';
import { UploadCloudIcon, XIcon } from '../Icons';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    accept: string;
    selectedFile: ImageFile | null;
    onClear: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, accept, selectedFile, onClear }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    if (selectedFile) {
        return (
            <div className="w-full p-4 bg-brand-secondary rounded-lg flex items-center justify-between">
                <span className="text-brand-text font-medium truncate">{selectedFile.name}</span>
                <button onClick={onClear} className="p-1 text-brand-subtle hover:text-white rounded-full hover:bg-slate-600" aria-label="Clear file">
                    <XIcon className="h-5 w-5"/>
                </button>
            </div>
        )
    }

    return (
        <div className="w-full">
            <label htmlFor="file-upload" className="flex flex-col items-center px-4 py-8 bg-brand-secondary rounded-lg shadow-md tracking-wide uppercase border-2 border-dashed border-brand-subtle cursor-pointer hover:bg-slate-600 hover:border-brand-accent transition-all duration-200">
                <UploadCloudIcon className="w-10 h-10 text-brand-accent" />
                <span className="mt-2 text-base leading-normal text-brand-subtle">Select a file</span>
                <input id="file-upload" type='file' className="hidden" onChange={handleFileChange} accept={accept} />
            </label>
        </div>
    );
};
