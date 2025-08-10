import { useState } from 'react';
import { api } from '@/lib/api';

export default function UploadArea({
  sessionId,
  clientId,
  onPresigned,
}: {
  sessionId?: string;
  clientId?: string;
  onPresigned: (uploadUrl: string, key: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setLoading(true);
    const f = files[0];
    const presign = await api<{ uploadId: string; uploadUrl: string; key: string }>(
      '/uploads/presign',
      {
        method: 'POST',
        body: JSON.stringify({
          kind: 'image',
          mime: f.type,
          bytes: f.size,
          sessionId,
          clientId,
        }),
      },
    );
    await fetch(presign.uploadUrl, {
      method: 'PUT',
      body: f,
      headers: { 'Content-Type': f.type },
    });
    setLoading(false);
    onPresigned(presign.uploadUrl, presign.key);
  }

  return (
    <div
      className={`card p-6 border-dashed ${drag ? 'border-indigo-400' : 'border-white/10'}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="text-center space-y-3">
        <p className="text-lg">Drag & drop je foto hier</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {loading && <p>Uploaden…</p>}
      </div>
    </div>
  );
}

