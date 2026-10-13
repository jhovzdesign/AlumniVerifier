import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Search, ShieldCheck, QrCode, AlertCircle, ArrowRight, RefreshCw, SwitchCamera, Sparkles, CheckCircle2, Shield, Download } from 'lucide-react';
import jsQR from 'jsqr';

import { decodeQRCodeFromImage, generateQRCodeDataUrl } from '../utils/qrReader.ts';

interface QRVerificationSectionProps {
  onVerify: (token: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const QRVerificationSection: React.FC<QRVerificationSectionProps> = ({
  onVerify,
  isLoading,
  errorMessage
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'manual' | 'generator'>('camera');
  const [manualInput, setManualInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Dedicated QR Generator tab state
  const [genInput, setGenInput] = useState('PU-ALUMNI-2024-00123-VERIFY');
  const [generatedQRImage, setGeneratedQRImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleGenerateCustomQR = async (customText?: string) => {
    const text = (customText !== undefined ? customText : genInput).trim();
    if (!text) return;
    setIsGenerating(true);
    try {
      const url = await generateQRCodeDataUrl(text, { width: 300, margin: 2 });
      if (url) {
        setGeneratedQRImage(url);
      }
    } catch (err) {
      console.warn('QR generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'generator' && !generatedQRImage) {
      handleGenerateCustomQR();
    }
  }, [activeTab]);

  // Camera handling
  const startCamera = async (facing = cameraFacing) => {
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by this browser environment. You can enter the token or upload a QR image.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        requestScan();
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera permissions in your browser or enter the token below.'
          : err.message || 'Unable to access camera on this device.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const requestScan = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth'
      });

      if (code && code.data) {
        stopCamera();
        onVerify(code.data);
        return;
      }
    }

    animationFrameRef.current = requestAnimationFrame(requestScan);
  };

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [activeTab]);

  // Handle Image File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const result = await decodeQRCodeFromImage(file);
    if (result.success && result.data) {
      onVerify(result.data);
    } else {
      setUploadError(result.error || 'QR CODE COULD NOT BE READ: Please upload a clear QR code image.');
    }
  };

  // Handle Manual Form Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onVerify(manualInput.trim());
    }
  };

  const handleQuickSample = (sampleToken: string) => {
    setManualInput(sampleToken);
    onVerify(sampleToken);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Top Hero Card */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-full text-xs font-semibold shadow-2xs">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Live University Verification System</span>
        </div>
        <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-900 tracking-tight">
          Alumni QR Verification
        </h1>
        <p className="max-w-2xl mx-auto text-stone-600 text-xs sm:text-sm md:text-base leading-relaxed">
          Instantly verify the authenticity of Panpacific University alumni cards and credentials against the live, authoritative university database from any phone, tablet, or computer.
        </p>
      </div>

      {/* Main Scanner Box */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-md overflow-hidden">
        {/* Verification Method Segmented Bar */}
        <div className="flex border-b border-stone-200 bg-stone-50/80 p-1.5 gap-1 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'camera'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-800" />
            <span>Scan with Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Upload className="w-4 h-4 text-amber-800" />
            <span>Upload QR Image</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Search className="w-4 h-4 text-amber-800" />
            <span>Enter Token / ID</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('generator');
              if (!generatedQRImage) handleGenerateCustomQR();
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'generator'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-800" />
            <span>Generate QR Code</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="p-5 sm:p-8">
          {/* TAB 1: Camera Scanner */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative aspect-video max-w-lg mx-auto bg-stone-900 rounded-xl overflow-hidden border-2 border-stone-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Target overlay reticle */}
                {isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-60 sm:h-60 border-2 border-dashed border-amber-400/90 rounded-2xl relative">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 -mt-1 -ml-1"></div>
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 -mt-1 -mr-1"></div>
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 -mb-1 -ml-1"></div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 -mb-1 -mr-1"></div>
                    </div>
                  </div>
                )}

                {/* Floating camera switch button for mobile */}
                {isCameraActive && (
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Switch Camera (Front/Rear)"
                    className="absolute top-3 right-3 p-2 bg-stone-950/70 hover:bg-stone-900 text-white rounded-full backdrop-blur-xs transition-colors cursor-pointer border border-white/20 shadow-md"
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}

                {/* Loading / Status State */}
                {isLoading && (
                  <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <p className="text-xs font-medium uppercase tracking-wider">Checking Live University Database...</p>
                  </div>
                )}

                {!isCameraActive && !cameraError && (
                  <div className="text-center p-6 text-stone-400 space-y-3">
                    <QrCode className="w-12 h-12 mx-auto text-stone-500" />
                    <p className="text-xs">Camera is ready</p>
                    <button
                      onClick={() => startCamera()}
                      className="px-5 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      Start Camera Sensor
                    </button>
                  </div>
                )}

                {cameraError && (
                  <div className="text-center p-6 text-stone-300 max-w-sm space-y-3">
                    <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
                    <p className="text-xs text-stone-300">{cameraError}</p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={() => startCamera()}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Retry Camera
                      </button>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Upload QR Image
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2 max-w-lg mx-auto">
                <span>Position the alumni card QR code inside the frame to scan.</span>
                <div className="flex items-center gap-3">
                  <label className="text-amber-900 font-semibold hover:underline flex items-center gap-1.5 cursor-pointer bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md border border-amber-200 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-amber-800" />
                    <span>Snap Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {isCameraActive && (
                    <button
                      onClick={toggleCameraFacing}
                      className="text-amber-900 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <SwitchCamera className="w-3.5 h-3.5" />
                      <span>Switch Camera ({cameraFacing === 'environment' ? 'Rear' : 'Front'})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Upload QR Image */}
          {activeTab === 'upload' && (
            <div className="max-w-lg mx-auto space-y-4">
              <label className="border-2 border-dashed border-stone-300 hover:border-amber-600 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer bg-stone-50/50 hover:bg-amber-50/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-800">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="font-semibold text-stone-900 text-sm block">Click to upload QR code image</span>
                  <span className="text-xs text-stone-500">Supports PNG, JPG, WEBP screenshots or photos from your gallery</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">QR CODE COULD NOT BE READ</div>
                    <p className="mt-0.5">{uploadError}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Manual Input */}
          {activeTab === 'manual' && (
            <div className="max-w-lg mx-auto space-y-6">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-1.5">
                    Verification Token / Alumni ID / Card Number / Graduate Name / QR Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="e.g. PU-2024-00123, AC-2024-00123, or Juan Dela Cruz"
                      className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-800/40 text-xs sm:text-sm font-mono text-stone-900 bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim() || isLoading}
                      className="px-5 py-2.5 bg-stone-900 hover:bg-amber-900 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isLoading ? 'Checking...' : 'Verify'}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Accepts complete QR link URL, cryptographic token (<code className="font-mono bg-stone-100 px-1 rounded">PU-ALUMNI-...-VERIFY</code>), printed Alumni ID (<code className="font-mono bg-stone-100 px-1 rounded">PU-2024-00123</code>), Card Number (<code className="font-mono bg-stone-100 px-1 rounded">AC-2024-00123</code>), or Graduate Full Name (<code className="font-mono bg-stone-100 px-1 rounded">Juan Dela Cruz</code>).
                </p>
              </form>

              {/* Quick Sample Clickable Chips for instant device testing */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-stone-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                    <span>Quick Sample Records in Database (Tap to Verify)</span>
                  </div>
                  <span className="text-[10px] text-stone-400">Live Database</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickSample('PU-ALUMNI-2026-02024-VERIFY')}
                    className="p-2 rounded-lg bg-white border border-amber-300 hover:border-amber-600 hover:bg-amber-50/60 transition-colors text-left flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 group-hover:text-amber-900 text-[11px] flex items-center gap-1">
                        <span>Jhovhert Bogtong</span>
                        <span className="text-[9px] px-1 bg-amber-100 text-amber-900 font-bold rounded">BSIT</span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        PU-2026-02024 · Class 2026
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSample('PU-ALUMNI-2024-00123-VERIFY')}
                    className="p-2 rounded-lg bg-white border border-stone-200 hover:border-amber-600 hover:bg-amber-50/40 transition-colors text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 group-hover:text-amber-900 text-[11px]">
                        Juan Dela Cruz
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        PU-2024-00123 · BSIT
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSample('PU-ALUMNI-2023-00458-VERIFY')}
                    className="p-2 rounded-lg bg-white border border-stone-200 hover:border-amber-600 hover:bg-amber-50/40 transition-colors text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 group-hover:text-amber-900 text-[11px]">
                        Maria Clara Santos
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        PU-2023-00458 · BSN
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSample('PU-ALUMNI-2023-M0088-VERIFY')}
                    className="p-2 rounded-lg bg-white border border-stone-200 hover:border-amber-600 hover:bg-amber-50/40 transition-colors text-left flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 group-hover:text-amber-900 text-[11px]">
                        Ronald Navarro
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        Master of Arts (MAEd)
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-purple-800 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                      Master's
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSample('PU-ALUMNI-2022-D0019-VERIFY')}
                    className="p-2 rounded-lg bg-white border border-stone-200 hover:border-amber-600 hover:bg-amber-50/40 transition-colors text-left flex items-center justify-between group cursor-pointer sm:col-span-2"
                  >
                    <div>
                      <div className="font-semibold text-stone-900 group-hover:text-amber-900 text-[11px]">
                        Dr. Teresa Villanueva
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        PU-2022-D0019 · Doctor of Philosophy (PhD)
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                      Doctorate
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QR Code Generator Studio */}
          {activeTab === 'generator' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Panpacific University QR Engine</span>
                </div>
                <h3 className="font-cinzel text-lg font-bold text-stone-900">
                  Instant QR Code Generator
                </h3>
                <p className="text-xs text-stone-500">
                  Generate, preview, download, and test cryptographic alumni QR codes in real time.
                </p>
              </div>

              {/* Generator Input Form */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-stone-700">
                  Enter Alumni ID, Verification Token, or URL to Encode:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={genInput}
                    onChange={(e) => {
                      setGenInput(e.target.value);
                      if (e.target.value.trim()) {
                        handleGenerateCustomQR(e.target.value.trim());
                      }
                    }}
                    placeholder="e.g. PU-ALUMNI-2024-00123-VERIFY or PU-2026-00124"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-800/40 text-xs font-mono text-stone-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateCustomQR()}
                    disabled={isGenerating || !genInput.trim()}
                    className="px-4 py-2.5 bg-amber-900 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-xs shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>{isGenerating ? 'Generating...' : 'Generate QR'}</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-stone-500">
                  Official Quick Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Jhovhert Bogtong (BSIT)', token: 'PU-ALUMNI-2026-02024-VERIFY' },
                    { label: 'Juan Dela Cruz (BSIT)', token: 'PU-ALUMNI-2024-00123-VERIFY' },
                    { label: 'Maria Santos (BSN)', token: 'PU-ALUMNI-2023-00458-VERIFY' },
                    { label: 'Ronald Navarro (MAEd)', token: 'PU-ALUMNI-2023-M0088-VERIFY' },
                    { label: 'Dr. Villanueva (PhD)', token: 'PU-ALUMNI-2022-D0019-VERIFY' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setGenInput(preset.token);
                        handleGenerateCustomQR(preset.token);
                      }}
                      className="px-2.5 py-1 text-[11px] bg-stone-100 hover:bg-amber-50 hover:text-amber-900 border border-stone-200 rounded-md transition-colors cursor-pointer text-stone-700 font-medium"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Code Presentation & Download Card */}
              {generatedQRImage ? (
                <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col items-center text-center space-y-4 shadow-xs animate-in zoom-in-95 duration-150">
                  <div className="p-3 bg-white rounded-xl border border-stone-300 shadow-md">
                    <img
                      src={generatedQRImage}
                      alt="Generated QR Code"
                      className="w-48 h-48 object-contain"
                    />
                  </div>

                  <div className="space-y-1 w-full">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-stone-400">
                      Encoded Payload
                    </div>
                    <div className="font-mono text-xs text-stone-900 bg-white p-2.5 rounded-lg border border-stone-200 break-all select-all font-semibold">
                      {genInput.trim()}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2 w-full pt-1">
                    <a
                      href={generatedQRImage}
                      download={`panpacific-qr-${encodeURIComponent(genInput.trim().slice(0, 15))}.png`}
                      className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-white bg-amber-900 hover:bg-amber-800 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR (PNG)</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onVerify(genInput.trim())}
                      className="w-full sm:flex-1 py-2 px-3 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Test Verify This QR</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-stone-400 border-2 border-dashed border-stone-200 rounded-2xl">
                  <QrCode className="w-10 h-10 mx-auto text-stone-300 mb-2" />
                  <p className="text-xs">Type a payload above and click "Generate QR".</p>
                </div>
              )}
            </div>
          )}

          {/* Global error message display */}
          {errorMessage && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


