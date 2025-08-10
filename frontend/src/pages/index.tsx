import { useState } from 'react';
import UploadArea from '@/components/UploadArea';
import RecognitionOverlay from '@/components/RecognitionOverlay';
import WhyPanel from '@/components/WhyPanel';
import { api } from '@/lib/api';

export default function Home() {
  const [result, setResult] = useState<any>(null);

  async function onUploaded(_url: string, _key: string) {
    const r = await api('/vision/tarot/recognize', {
      method: 'POST',
      body: JSON.stringify({ uploadId: 'demo' }),
    });
    setResult(r);
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">StarpathVision</h1>
      <p className="opacity-90">
        Upload een foto van je kaarten en laat de AI het werk doen.
      </p>
      <UploadArea onPresigned={onUploaded} />
      <RecognitionOverlay result={result} />
      <WhyPanel explanation={result?.explanation} />
    </main>
  );
}

