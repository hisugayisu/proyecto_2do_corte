import { useCallback, useState } from 'react';

type Props = {
  onFile: (f: File) => void;
  className?: string;
  accept?: string; // e.g. "image/*"
};

export default function UploadZone({
  onFile,
  className = '',
  accept = 'image/*',
}: Props) {
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]);
    },
    [onFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handleFiles(e.dataTransfer?.files || null);
      }}
      className={[
        'cursor-pointer select-none rounded-xl border border-dashed p-4 text-center transition-colors',
        hover ? 'bg-gray-50' : 'bg-white',
        className,
      ].join(' ')}
      onClick={() => document.getElementById('upload-zone-input')?.click()}
    >
      <input
        id="upload-zone-input"
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="text-sm text-gray-700">
        Arrastra y suelta, o haz clic para seleccionar
      </div>
    </div>
  );
}
