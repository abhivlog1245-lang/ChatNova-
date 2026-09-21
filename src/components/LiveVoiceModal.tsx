import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Sparkles,
  AlertCircle,
  Radio,
  RefreshCw,
  Activity,
} from "lucide-react";

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Convert Float32Array PCM (-1.0 to 1.0) to 16-bit PCM little-endian Base64
function floatTo16BitPCMBase64(input: Float32Array): string {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 16-bit PCM (24kHz) to AudioBuffer for playback
function base64ToAudioBuffer(
  audioCtx: AudioContext,
  base64Data: string,
  sampleRate = 24000
): AudioBuffer {
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const view = new DataView(bytes.buffer);
  const numSamples = bytes.length / 2;
  const audioBuffer = audioCtx.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const int16 = view.getInt16(i * 2, true);
    channelData[i] = int16 / 32768.0;
  }
  return audioBuffer;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [transcripts, setTranscripts] = useState<
    Array<{ sender: "user" | "model"; text: string; time: string }>
  >([]);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextPlaybackTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef(false);

  isMutedRef.current = isMuted;

  // Clean up and stop all audio contexts and websockets
  const disconnectSession = () => {
    // Stop microphone tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Disconnect processor
    if (scriptProcessorRef.current) {
      try {
        scriptProcessorRef.current.disconnect();
      } catch {
        // ignore
      }
      scriptProcessorRef.current = null;
    }

    // Stop queued audio sources
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];

    // Close audio contexts
    if (inputAudioCtxRef.current) {
      try {
        inputAudioCtxRef.current.close();
      } catch {
        // ignore
      }
      inputAudioCtxRef.current = null;
    }

    if (outputAudioCtxRef.current) {
      try {
        outputAudioCtxRef.current.close();
      } catch {
        // ignore
      }
      outputAudioCtxRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    setConnectionStatus("disconnected");
    setIsModelSpeaking(false);
    setIsUserSpeaking(false);
    setUserVolume(0);
  };

  const connectSession = async () => {
    disconnectSession();
    setConnectionStatus("connecting");
    setErrorMessage(null);

    try {
      // 1. Check microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup WebSocket connection to server Live API endpoint
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // 3. Setup Web Audio contexts
      // 16kHz for mic input
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      // 24kHz for Gemini Live audio playback
      const outputCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextPlaybackTimeRef.current = outputCtx.currentTime;

      ws.onopen = () => {
        console.log("Live WebSocket opened");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "ready") {
            setConnectionStatus("connected");
          } else if (data.type === "audio" && data.audio) {
            // Received 24kHz audio chunk from Gemini Live
            playModelAudioChunk(data.audio);
          } else if (data.type === "interrupted") {
            // Model was interrupted
            stopScheduledAudio();
            setIsModelSpeaking(false);
          } else if (data.type === "text" && data.text) {
            setTranscripts((prev) => [
              ...prev.slice(-10),
              {
                sender: "model",
                text: data.text,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              },
            ]);
          } else if (data.type === "error") {
            setErrorMessage(data.message || "Live API session encountered an error");
            setConnectionStatus("error");
          } else if (data.type === "closed") {
            setConnectionStatus("disconnected");
          }
        } catch (err) {
          console.error("Error parsing live message:", err);
        }
      };

      ws.onerror = (err) => {
        console.error("Live WebSocket error:", err);
        setErrorMessage("Could not connect to ChatNova Voice Server.");
        setConnectionStatus("error");
      };

      ws.onclose = () => {
        if (connectionStatus !== "error") {
          setConnectionStatus("disconnected");
        }
      };

      // 4. Capture and stream mic audio to WebSocket
      const source = inputCtx.createMediaStreamSource(stream);
      // Using 4096 buffer size (~250ms at 16kHz)
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);

        // Calculate simple volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputChannelData.length; i++) {
          sum += inputChannelData[i] * inputChannelData[i];
        }
        const rms = Math.sqrt(sum / inputChannelData.length);
        const normVol = Math.min(100, Math.round(rms * 400));
        setUserVolume(normVol);
        setIsUserSpeaking(normVol > 12);

        // Convert PCM to base64 and send
        const base64Pcm = floatTo16BitPCMBase64(inputChannelData);
        ws.send(
          JSON.stringify({
            type: "audio",
            audio: base64Pcm,
          })
        );
      };
    } catch (err: any) {
      console.error("Failed to start voice call:", err);
      setErrorMessage(
        err?.message || "Microphone access was denied or audio initialization failed."
      );
      setConnectionStatus("error");
    }
  };

  const playModelAudioChunk = (base64Data: string) => {
    const outputCtx = outputAudioCtxRef.current;
    if (!outputCtx || outputCtx.state === "closed") return;

    if (outputCtx.state === "suspended") {
      outputCtx.resume();
    }

    try {
      const audioBuffer = base64ToAudioBuffer(outputCtx, base64Data, 24000);
      const source = outputCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputCtx.destination);

      // Schedule gapless audio
      const currentTime = outputCtx.currentTime;
      const startTime = Math.max(currentTime, nextPlaybackTimeRef.current);
      source.start(startTime);
      nextPlaybackTimeRef.current = startTime + audioBuffer.duration;

      activeSourcesRef.current.push(source);
      setIsModelSpeaking(true);

      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsModelSpeaking(false);
        }
      };
    } catch (err) {
      console.error("Error playing model audio chunk:", err);
    }
  };

  const stopScheduledAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextPlaybackTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsModelSpeaking(false);
  };

  useEffect(() => {
    if (isOpen) {
      connectSession();
    } else {
      disconnectSession();
    }
    return () => {
      disconnectSession();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="live-voice-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div
        id="live-voice-modal"
        className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-pink-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-pink-950/50 flex flex-col items-center text-center overflow-hidden"
      >
        {/* Background glow effects */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header badges */}
        <div className="w-full flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-xs font-medium text-pink-300">
            <Radio className="w-3.5 h-3.5 text-pink-400 animate-pulse" />
            <span>Gemini 3.8 Live API</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-emerald-400 animate-ping"
                  : connectionStatus === "connecting"
                  ? "bg-amber-400 animate-pulse"
                  : connectionStatus === "error"
                  ? "bg-rose-500"
                  : "bg-slate-500"
              }`}
            />
            <span
              className={`font-semibold capitalize ${
                connectionStatus === "connected"
                  ? "text-emerald-300"
                  : connectionStatus === "connecting"
                  ? "text-amber-300"
                  : connectionStatus === "error"
                  ? "text-rose-400"
                  : "text-slate-400"
              }`}
            >
              {connectionStatus}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            ChatNova Live Voice Call
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm mx-auto">
            Real-time, zero-lag voice conversation in Hindi, English, or Hinglish.
          </p>
        </div>

        {/* Visualizer Orb */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Animated concentric ripples */}
          <div
            className={`absolute rounded-full transition-all duration-300 ${
              isModelSpeaking
                ? "w-48 h-48 bg-pink-500/20 animate-ping opacity-60"
                : isUserSpeaking
                ? "w-44 h-44 bg-indigo-500/25 animate-pulse"
                : "w-36 h-36 bg-pink-500/10"
            }`}
          />
          <div
            className={`absolute rounded-full transition-all duration-300 ${
              isModelSpeaking
                ? "w-40 h-40 bg-gradient-to-r from-pink-500/30 to-purple-500/30 animate-pulse"
                : "w-32 h-32 bg-slate-800/40"
            }`}
          />

          {/* Central Interactive Orb */}
          <div
            className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 ${
              isModelSpeaking
                ? "bg-gradient-to-tr from-pink-500 via-purple-600 to-rose-500 shadow-pink-500/50 scale-105"
                : isUserSpeaking
                ? "bg-gradient-to-tr from-indigo-500 via-blue-600 to-cyan-500 shadow-indigo-500/40 scale-100"
                : "bg-gradient-to-tr from-slate-800 to-slate-900 border border-pink-500/30 shadow-black/60"
            }`}
          >
            {isModelSpeaking ? (
              <Volume2 className="w-10 h-10 text-white animate-bounce" />
            ) : isUserSpeaking ? (
              <Activity className="w-10 h-10 text-white animate-pulse" />
            ) : (
              <Sparkles className="w-10 h-10 text-pink-300" />
            )}
          </div>
        </div>

        {/* Live Audio Status Message */}
        <div className="h-8 mb-4 flex items-center justify-center text-xs sm:text-sm font-medium">
          {connectionStatus === "connecting" && (
            <span className="text-amber-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Connecting to Live API session...
            </span>
          )}
          {connectionStatus === "connected" && isModelSpeaking && (
            <span className="text-pink-300 flex items-center gap-1.5 animate-pulse font-semibold">
              <Volume2 className="w-4 h-4" /> ChatNova is speaking...
            </span>
          )}
          {connectionStatus === "connected" && !isModelSpeaking && isUserSpeaking && (
            <span className="text-indigo-300 flex items-center gap-1.5">
              <Mic className="w-4 h-4 text-emerald-400" /> Listening to you... (Voice detected)
            </span>
          )}
          {connectionStatus === "connected" && !isModelSpeaking && !isUserSpeaking && (
            <span className="text-slate-300">
              {isMuted ? "Microphone muted. Unmute to speak." : "Speak naturally — ChatNova is listening..."}
            </span>
          )}
          {connectionStatus === "error" && (
            <span className="text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> {errorMessage || "Voice connection error"}
            </span>
          )}
        </div>

        {/* Live Audio Volume Bar */}
        {connectionStatus === "connected" && !isMuted && (
          <div className="w-48 bg-slate-800/80 rounded-full h-1.5 overflow-hidden mb-6">
            <div
              className="bg-gradient-to-r from-indigo-400 to-pink-400 h-full transition-all duration-75"
              style={{ width: `${Math.min(100, userVolume * 2)}%` }}
            />
          </div>
        )}

        {/* Call Controls */}
        <div className="flex items-center gap-4 mt-2 mb-4 relative z-10">
          {/* Mute/Unmute Mic */}
          <button
            id="live-mute-toggle-btn"
            type="button"
            disabled={connectionStatus !== "connected"}
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-all cursor-pointer ${
              isMuted
                ? "bg-rose-950/80 text-rose-400 border border-rose-500/50 hover:bg-rose-900"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 active:scale-95"
            }`}
            title={isMuted ? "Unmute microphone" : "Mute microphone"}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            id="live-end-call-btn"
            type="button"
            onClick={() => {
              disconnectSession();
              onClose();
            }}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-rose-900/50 active:scale-95 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call</span>
          </button>

          {/* Reconnect button if error */}
          {connectionStatus === "error" && (
            <button
              type="button"
              onClick={connectSession}
              className="p-3.5 rounded-full bg-amber-600 hover:bg-amber-500 text-white transition-all cursor-pointer"
              title="Reconnect"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tips Footer */}
        <div className="w-full pt-4 border-t border-slate-800/80 text-[11px] text-slate-300 flex items-center justify-between">
          <span>Tip: You can interrupt ChatNova at any time by speaking</span>
          <span className="font-mono text-pink-400">gemini-3.8-live</span>
        </div>
      </div>
    </div>
  );
};
