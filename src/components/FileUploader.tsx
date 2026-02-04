import { useState, useCallback } from 'react';
import { Upload, Film, Image, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  type: 'video' | 'art' | 'subtitle';
  onUploadComplete: (url: string) => void;
  currentFile?: string | null;
  onClear?: () => void;
}

const FileUploader = ({ type, onUploadComplete, currentFile, onClear }: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const config = {
    video: {
      accept: '.mp4,.webm,.mov,.mkv',
      icon: Film,
      label: 'Video File',
      hint: 'MP4, WebM, MOV up to 500MB',
      bucket: 'videos',
    },
    art: {
      accept: '.jpg,.jpeg,.png,.webp,.gif',
      icon: Image,
      label: 'Cover Art',
      hint: 'JPG, PNG, WebP up to 10MB',
      bucket: 'art',
    },
    subtitle: {
      accept: '.vtt,.srt',
      icon: FileText,
      label: 'Subtitles',
      hint: 'VTT or SRT files',
      bucket: 'subtitles',
    },
  }[type];

  const Icon = config.icon;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      // Simulate progress for now
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from(config.bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      onUploadComplete(urlData.publicUrl);
    } catch (err) {
      console.error('Upload failed:', err);
      setFileName(null);
    } finally {
      setIsUploading(false);
    }
  };

  const hasFile = currentFile || fileName;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground/80">{config.label}</label>
      
      {hasFile && !isUploading ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
          <div className="p-2 rounded-md bg-primary/10">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <span className="flex-1 text-sm truncate text-foreground/80">
            {fileName || 'File uploaded'}
          </span>
          {onClear && (
            <button
              onClick={() => {
                setFileName(null);
                onClear();
              }}
              className="p-1 rounded-md hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "upload-zone relative cursor-pointer group",
            isDragging && "border-primary/50 bg-primary/5",
            isUploading && "pointer-events-none"
          )}
        >
          <input
            type="file"
            accept={config.accept}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="flex flex-col items-center gap-3">
            {isUploading ? (
              <>
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <div className="w-48 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">Uploading...</span>
              </>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-secondary/50 group-hover:bg-primary/10 transition-colors">
                  <Icon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground/80">
                    Drop file here or <span className="text-primary">browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{config.hint}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
