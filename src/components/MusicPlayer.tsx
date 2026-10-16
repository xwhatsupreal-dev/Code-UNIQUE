import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Disc3, ChevronDown, ChevronUp } from 'lucide-react';
import { Language } from '../utils/translations';

// Declare YouTube IFrame API types on window
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface MusicPlayerProps {
  lang?: Language;
}

const YOUTUBE_VIDEO_ID = 'atxYe-nOa9w'; // Genos Theme OST

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ lang = 'th' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('opm_bgm_volume');
      return saved ? parseInt(saved, 10) : 60;
    } catch {
      return 60;
    }
  });
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('opm_bgm_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const playerRef = useRef<any>(null);
  const containerId = 'yt-bgm-iframe-player';

  useEffect(() => {
    // Check if script is already injected
    let isMounted = true;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(containerId, {
          height: '1',
          width: '1',
          videoId: YOUTUBE_VIDEO_ID,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            loop: 1,
            playlist: YOUTUBE_VIDEO_ID,
            playsinline: 1,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setIsReady(true);
              event.target.setVolume(volume);
              if (isMuted) {
                event.target.mute();
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              // 1 = playing, 2 = paused, 0 = ended
              if (event.data === 1) {
                setIsPlaying(true);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                // Loop explicitly if needed
                event.target.playVideo();
              }
            },
            onError: (e: any) => {
              console.warn('YouTube BGM Player notice:', e);
            },
          },
        });
      } catch (err) {
        console.error('Failed to create YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      // Load YouTube IFrame API script
      const existingScript = document.getElementById('youtube-iframe-api-script');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      // Save previous callback if any
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        if (isMounted) initPlayer();
      };
    }

    return () => {
      isMounted = false;
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
      }
    };
  }, []);

  const togglePlay = () => {
    if (!playerRef.current || !isReady) {
      // If player is still initializing, attempt to play
      return;
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        if (isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn('Playback action error:', e);
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    try {
      if (isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      } else {
        playerRef.current.mute();
        setIsMuted(true);
      }
    } catch (e) {
      console.warn('Mute action error:', e);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    try {
      localStorage.setItem('opm_bgm_volume', String(newVol));
    } catch {}

    if (playerRef.current && isReady) {
      try {
        playerRef.current.setVolume(newVol);
        if (newVol > 0 && isMuted) {
          playerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {}
    }
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('opm_bgm_minimized', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <>
      {/* Hidden YouTube IFrame container off-screen */}
      <div className="fixed -left-[9999px] -top-[9999px] w-1 h-1 pointer-events-none opacity-0 overflow-hidden" aria-hidden="true">
        <div id={containerId} />
      </div>

      {/* Floating Music Player Widget */}
      <div className="fixed bottom-20 md:bottom-5 left-3 sm:left-6 z-40 select-none">
        {isMinimized ? (
          /* Minimized Floating Disc Button */
          <button
            type="button"
            onClick={toggleMinimize}
            className={`group relative flex items-center justify-center size-11 rounded-full border transition-all duration-300 cursor-pointer shadow-[0_8px_24px_rgba(0,0,0,0.85)] ${
              isPlaying
                ? 'bg-[#0e1013]/95 border-[#29e6b2]/50 text-[#29e6b2] shadow-[0_0_16px_rgba(41,230,178,0.3)]'
                : 'bg-[#0e1013]/90 border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
            title={lang === 'en' ? 'Open Music Player (Genos Theme)' : 'เปิดแผงควบคุมเพลง (Genos Theme)'}
          >
            <Disc3 className={`size-5 transition-transform duration-700 ${isPlaying ? 'animate-spin' : ''}`} />
            {isPlaying && (
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#29e6b2] opacity-75" />
                <span className="relative inline-flex rounded-full size-3 bg-[#29e6b2]" />
              </span>
            )}
          </button>
        ) : (
          /* Expanded Sleek Glass Pill Player */
          <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-[#0e1013]/95 border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.9),0_0_20px_rgba(41,230,178,0.1)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Spinning Disc or Equalizer */}
            <div 
              onClick={togglePlay}
              className={`relative size-9 rounded-xl flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                isPlaying 
                  ? 'bg-[#29e6b2]/15 border border-[#29e6b2]/40 text-[#29e6b2]' 
                  : 'bg-white/[0.05] border border-white/10 text-white/40'
              }`}
              title={isPlaying ? (lang === 'en' ? 'Pause' : 'พักเพลง') : (lang === 'en' ? 'Play' : 'เล่นเพลง')}
            >
              {isPlaying ? (
                /* Animated Equalizer Waves */
                <div className="flex items-end justify-center gap-0.5 h-4 w-4">
                  <span className="w-1 bg-[#29e6b2] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
                  <span className="w-1 bg-[#29e6b2] rounded-full animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-4" />
                  <span className="w-1 bg-[#29e6b2] rounded-full animate-[pulse_0.5s_ease-in-out_infinite_0.4s] h-2" />
                </div>
              ) : (
                <Disc3 className="size-4.5" />
              )}
            </div>

            {/* Track Info */}
            <div className="flex flex-col min-w-0 pr-1 cursor-pointer" onClick={togglePlay}>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] sm:text-[13px] font-bold text-white whitespace-nowrap truncate max-w-[110px] sm:max-w-[150px]">
                  Genos Theme
                </span>
                <span className="text-[9px] font-mono px-1 rounded bg-[#29e6b2]/10 text-[#29e6b2] border border-[#29e6b2]/20 font-bold hidden sm:inline">
                  OST
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                {isPlaying ? (
                  <>
                    <span className="size-1.5 rounded-full bg-[#29e6b2] animate-pulse" />
                    <span className="text-[#29e6b2] font-medium">{lang === 'en' ? 'Playing' : 'กำลังเล่น'}</span>
                  </>
                ) : (
                  <>
                    <span className="size-1.5 rounded-full bg-white/30" />
                    <span className="text-white/40">{lang === 'en' ? 'Click to play' : 'กดเพื่อเล่น'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Main Play / Pause Button */}
            <button
              type="button"
              onClick={togglePlay}
              className={`size-8 sm:size-8.5 rounded-xl flex items-center justify-center transition-all cursor-pointer flex-shrink-0 active:scale-95 ${
                isPlaying
                  ? 'bg-[#29e6b2] text-black shadow-[0_0_12px_rgba(41,230,178,0.4)] hover:bg-[#34f0bd]'
                  : 'bg-white/10 hover:bg-[#29e6b2] text-white hover:text-black border border-white/10 hover:border-[#29e6b2]'
              }`}
              title={isPlaying ? (lang === 'en' ? 'Pause Music' : 'พักเพลง') : (lang === 'en' ? 'Play Music' : 'เล่นเพลง')}
            >
              {isPlaying ? (
                <Pause className="size-4 fill-current" />
              ) : (
                <Play className="size-4 fill-current ml-0.5" />
              )}
            </button>

            {/* Mute & Volume */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={toggleMute}
                className="size-7 rounded-lg text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title={isMuted ? (lang === 'en' ? 'Unmute' : 'เปิดเสียง') : (lang === 'en' ? 'Mute' : 'ปิดเสียง')}
              >
                {isMuted ? <VolumeX className="size-3.5 text-rose-400" /> : <Volume2 className="size-3.5" />}
              </button>

              {/* Compact Volume slider on screens >= 400px */}
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                className="hidden sm:block w-14 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-[#29e6b2]"
                title={`Volume: ${isMuted ? 0 : volume}%`}
              />
            </div>

            {/* Minimize button */}
            <button
              type="button"
              onClick={toggleMinimize}
              className="size-6 rounded-lg text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              title={lang === 'en' ? 'Minimize' : 'ย่อลง'}
            >
              <ChevronDown className="size-3.5" />
            </button>
          </div>
        )}
      </div>
    </>
  );
};
