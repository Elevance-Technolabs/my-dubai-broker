"use client";
"use no memo";

import React, { useState, useRef } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils/cn";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";

interface FileUploadProps {
  id: string;
  label: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
  helperText?: string;
  isMandatory?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  id,
  label,
  accept,
  multiple = false,
  className,
  helperText,
  isMandatory,
}) => {
  const { register, setValue, control, formState: { errors } } = useFormContext();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const files = useWatch({
    control,
    name: id,
  });

  const fieldError = errors?.[id]?.message as string | undefined;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      if (multiple) {
        const currentFiles = Array.isArray(files) ? files : [];
        setValue(id, [...currentFiles, ...Array.from(selectedFiles)], { shouldValidate: true, shouldDirty: true });
      } else {
        setValue(id, selectedFiles[0], { shouldValidate: true, shouldDirty: true });
      }
    }
    // Reset input so the same file can be selected again if needed
    if (e.target) e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      if (multiple) {
        const currentFiles = files || [];
        setValue(id, [...currentFiles, ...Array.from(droppedFiles)], { shouldValidate: true });
      } else {
        setValue(id, droppedFiles[0], { shouldValidate: true });
      }
    }
  };

  const removeFile = (index?: number) => {
    if (multiple && typeof index === "number") {
      const currentFiles = [...files];
      currentFiles.splice(index, 1);
      setValue(id, currentFiles.length > 0 ? currentFiles : null, { shouldValidate: true });
    } else {
      setValue(id, null, { shouldValidate: true });
    }
  };

  const renderFilePreview = () => {
    if (!files) return null;

    if (multiple && Array.isArray(files)) {
      return (
        <div className="mt-4 space-y-2">
          {files.map((file: File, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 animate-fade-in-up">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-gold" />
                <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(idx)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      );
    }

    const file = files as File;

    return (
      <div className="mt-4 flex items-center justify-between p-3 bg-gold/5 rounded-lg border border-gold/20 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className="text-gold" />
          <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{file.name}</span>
        </div>
        <button
          type="button"
          onClick={() => removeFile()}
          className="text-slate-400 hover:text-red-500 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  };

  const { ref: registerRef, ...registerFields } = register(id);

  return (
    <div className={cn("flex flex-col group", className)}>
      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">
        {label} {isMandatory && <span className="text-red-500">*</span>}
      </label>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer group hover:bg-slate-50",
          isDragging ? "border-gold bg-gold/5 scale-[1.02]" : "border-slate-200 bg-white",
          fieldError ? "border-red-300 bg-red-50" : "hover:border-gold/50",
          files && !multiple ? "hidden" : "flex"
        )}
      >
        <input
          {...registerFields}
          type="file"
          id={id}
          data-id={id}
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          ref={(e) => {
            registerRef(e);
            fileInputRef.current = e;
          }}
        />

        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-all duration-300",
          isDragging ? "bg-gold text-white" : "bg-slate-50 text-slate-400 group-hover:text-gold group-hover:bg-gold/10"
        )}>
          <Upload size={24} strokeWidth={1.5} />
        </div>

        <span className="text-xs font-bold text-slate-900 mb-1">Drag & Drop or Click to Upload</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-medium">
          {helperText || `Maximum size 10MB (${accept || 'All formats'})`}
        </span>
      </div>

      {renderFilePreview()}

      {fieldError && (
        <p className="text-xs text-red-500 mt-2 ml-1 animate-pulse">{fieldError}</p>
      )}
    </div>
  );
};

export default FileUpload;
