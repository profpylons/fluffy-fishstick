import { Suspense } from 'react';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <ChatInterface />
    </Suspense>
  );
}
