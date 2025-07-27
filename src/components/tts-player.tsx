'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Download, Play, Pause } from 'lucide-react';

interface TTSPlayerProps {
  text: string;
  voice?: string;
  className?: string;
}

export function TTSPlayer({ text, voice = 'alloy', className = '' }: TTSPlayerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const generateSpeech = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      // Create audio element
      const audioElement = new Audio(url);
      audioElement.onended = () => setIsPlaying(false);
      setAudio(audioElement);
      
    } catch (error) {
      console.error('TTS Error:', error);
      alert('Failed to generate speech. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'motivational-message.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {!audioUrl ? (
        <Button 
          onClick={generateSpeech} 
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <Volume2 className="w-4 h-4" />
          {isLoading ? 'Generating...' : 'Generate Voice Message'}
        </Button>
      ) : (
        <>
          <Button 
            onClick={togglePlay} 
            variant="outline"
            className="flex items-center gap-2"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button 
            onClick={downloadAudio} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </>
      )}
    </div>
  );
} 