"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { saveBlob } from "@/components/saveAs";
import { detectCapabilities, type Capabilities } from "@/lib/capabilities";

type Props = {
  title: string;              // e.g., "PDF to JPG"
  subtitle?: string;          // e.g., "Convert each PDF page into a JPG…"
  from: string;               // "pdf"
  to: string;                 // "jpg"
  accept?: string;            // optional override accept attr
  videoEmbedId?: string;      // YouTube embed ID for video (optional, defaults to bbkhxMpIH4w)
};

export default function LanderHeroTwoColumn({
  title,
  subtitle = "Fast, private, in-browser conversion.",
  from,
  to,
  accept,
  videoEmbedId = "bbkhxMpIH4w",
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState("or drop files here");
  const [dropEffect, setDropEffect] = useState<string>("");
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  // Generate stable color based on tool properties
  const colors = [
    "#ef4444", // red-500
    "#f59e0b", // amber-500  
    "#22c55e", // green-500
    "#3b82f6", // blue-500
    "#a855f7", // purple-500
    "#ec4899", // pink-500
    "#14b8a6", // teal-500
    "#f97316", // orange-500
    "#6366f1", // indigo-500
    "#f43f5e", // rose-500
    "#0ea5e9", // sky-500
    "#84cc16", // lime-500
  ];
  
  // Use a stable hash based on from/to combination
  const hashCode = (from + to).split('').reduce((hash, char) => {
    return char.charCodeAt(0) + ((hash << 5) - hash);
  }, 0);
  const randomColor = colors[Math.abs(hashCode) % colors.length];

  function ensureWorker() {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("../workers/convert.worker.ts", import.meta.url),
        { type: "module" }
      );
      
      // Add error handler for worker
      workerRef.current.onerror = (error) => {
        console.error('Worker error:', error);
      };
    }
    return workerRef.current;
  }

  // Detect capabilities on mount
  useEffect(() => {
    setCapabilities(detectCapabilities());
  }, []);

  function onPick() {
    inputRef.current?.click();
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !files.length) return;
    
    // Start playing video when file is dropped
    setVideoPlaying(true);
    
    const w = ensureWorker();
    setBusy(true);
    for (const file of Array.from(files)) {
      const buf = await file.arrayBuffer();
      await new Promise<void>((resolve, reject) => {
        w.onmessage = (ev: MessageEvent<any>) => {
          // Safety check for malformed messages
          if (!ev.data) {
            console.error('Received malformed worker message:', ev);
            return reject(new Error("Malformed worker response"));
          }
          
          // Handle progress updates for video conversion
          if (ev.data.type === 'progress') {
            // You could update UI progress here if needed
            return;
          }
          
          if (!ev.data.ok) return reject(new Error(ev.data.error || "Convert failed"));
          
          // Handle PDF pages (returns multiple blobs)
          if (ev.data.blobs) {
            const mimeType = to === "png" ? "image/png" : to === "jpg" || to === "jpeg" ? "image/jpeg" : "image/webp";
            ev.data.blobs.forEach((buf: ArrayBuffer, i: number) => {
              const blob = new Blob([buf], { type: mimeType });
              const name = file.name.replace(/\.[^.]+$/, "") + `_page${i + 1}.${to}`;
              saveBlob(blob, name);
            });
          } else {
            // Determine MIME type based on output format
            let mimeType: string;
            const videoFormats = ['mp4', 'm4v'];
            const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac'];
            
            if (videoFormats.includes(to)) {
              mimeType = 'video/mp4';
            } else if (audioFormats.includes(to)) {
              mimeType = `audio/${to === 'm4a' ? 'mp4' : to}`;
            } else if (to === 'webm') {
              mimeType = 'video/webm';
            } else if (to === 'gif') {
              mimeType = 'image/gif';
            } else if (to === 'png') {
              mimeType = 'image/png';
            } else if (to === 'jpg' || to === 'jpeg') {
              mimeType = 'image/jpeg';
            } else {
              // Default for other video/audio formats
              mimeType = to.startsWith('video/') ? to : `video/${to}`;
            }
            
            const blob = new Blob([ev.data.blob], { type: mimeType });
            const name = file.name.replace(/\.[^.]+$/, "") + "." + to;
            saveBlob(blob, name);
          }
          resolve();
        };
        
        // Add worker error handler
        w.onerror = (error) => {
          reject(new Error(`Worker error: ${error.message || error}`));
        };
        
        // Determine operation type based on format
        const videoFormats = ['mp4', 'mkv', 'avi', 'webm', 'mov', 'flv', 'ts', 'mts', 'm2ts', 'm4v', 'mpeg', 'mpg', 'vob', '3gp', 'f4v', 'hevc', 'divx', 'mjpeg', 'mpeg2', 'asf', 'wmv', 'mxf'];
        const audioFormats = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'opus', 'flac', 'wma', 'aiff', 'mp2'];
        
        let op: string;
        if (from === "pdf") {
          op = "pdf-pages";
        } else if (videoFormats.includes(from) || audioFormats.includes(to)) {
          // Check if video conversion is supported before attempting
          if (!capabilities?.supportsVideoConversion) {
            throw new Error(`Video conversion not supported: ${capabilities?.reason || 'Unknown reason'}`);
          }
          op = "video";
        } else {
          op = "raster";
        }
        
        console.log(`Converting ${from} to ${to} using operation: ${op}`);
        
        w.postMessage(op === "raster"
          ? { op, from, to, buf }
          : op === "pdf-pages" 
            ? { op, to, buf } // pdf -> jpg/png pages
            : { op, from, to, buf }, // video conversion
        [buf]);
      });
    }
    setBusy(false);
  }

  // simple drag/drop
  function onDrag(e: React.DragEvent) {
    e.preventDefault();
    if (e.type === "dragenter" || e.type === "dragover") setHint("Drop to convert");
    if (e.type === "dragleave") setHint("or drop files here");
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    
    // Trigger fun effect - cycle through based on time
    const effects = [
      "splash",
      "bounce", 
      "spin",
      "pulse",
      "shake",
      "flip",
      "zoom",
      "confetti",
      "rejected"
    ];
    // Use timestamp to cycle through effects deterministically
    const effectIndex = Math.floor(Date.now() / 1000) % effects.length;
    setDropEffect(effects[effectIndex]);
    
    // Clear effect after animation
    setTimeout(() => setDropEffect(""), 1000);
    
    setHint("Converting…");
    handleFiles(e.dataTransfer.files).finally(() => setHint("or drop files here"));
  }
  
  // Clear drop effect when component unmounts or effect changes
  useEffect(() => {
    if (dropEffect) {
      const timer = setTimeout(() => setDropEffect(""), 1000);
      return () => clearTimeout(timer);
    }
  }, [dropEffect]);

  const acceptAttr =
    accept ??
    (from === "pdf" ? ".pdf"
     : from === "jpg" ? ".jpg,.jpeg"
     : from === "jpeg" ? ".jpeg,.jpg"
     : `.${from}`);

  return (
    <section className="w-full bg-white">
      <div className="mx-auto max-w-[1400px] px-6 py-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center mb-12">{title}</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
          {/* Video Column */}
          <div className="order-2 lg:order-1">
            <div className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900" style={{ aspectRatio: '16/9' }}>
              {videoEmbedId ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${videoEmbedId}?${videoPlaying ? 'autoplay=1&' : ''}mute=1&loop=1&playlist=${videoEmbedId}&controls=1&showinfo=0&rel=0&modestbranding=1`}
                  title="Tool Demo Video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative">
                      <svg className="w-20 h-20 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {busy && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-600 border-t-blue-500"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                      {busy ? 'Converting your file...' : 'Drop a file to see the conversion in action'}
                    </p>
                    <p className="text-gray-500 text-xs mt-2">
                      No uploads • 100% private • Processed locally
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dropzone Column */}
          <div className="order-1 lg:order-2">
            <div
              ref={dropRef}
              onDragEnter={onDrag}
              onDragOver={onDrag}
              onDragLeave={onDrag}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-xl p-12 hover:border-opacity-80 transition-colors cursor-pointer w-full flex items-center justify-center ${
                dropEffect ? `animate-${dropEffect}` : ""
              }`}
              style={{
                backgroundColor: randomColor + "15", // 15 is ~8% opacity
                borderColor: randomColor,
                aspectRatio: '16/9',
              }}
              onClick={onPick}
            >
              <div className="flex flex-col items-center space-y-6">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  stroke="currentColor"
                  style={{ color: randomColor }}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                
                <Button
                  size="lg"
                  className="h-12 px-8 rounded-xl text-white shadow-lg"
                  style={{
                    backgroundColor: randomColor,
                    borderColor: randomColor,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPick();
                  }}
                  disabled={busy}
                >
                  {busy ? "Working…" : `CHOOSE FILES`}
                </Button>

                <div className="text-sm" style={{ color: randomColor }}>
                  <p className="font-medium">{hint}</p>
                </div>
                
                {/* Video conversion warning */}
                {capabilities && !capabilities.supportsVideoConversion && (
                  (from && ['mp4', 'mkv', 'avi', 'webm', 'mov'].includes(from) || 
                   to && ['mp3', 'wav', 'aac', 'm4a', 'ogg'].includes(to)) && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-amber-800">Video conversion temporarily disabled</p>
                          <p className="text-xs text-amber-700 mt-1">
                            {capabilities.reason}. Deploy to a server environment to enable video processing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              <input
                ref={inputRef}
                type="file"
                multiple
                accept={acceptAttr}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}