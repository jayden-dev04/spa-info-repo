import { useState, useRef, useEffect } from 'react'
import { Volume2, VolumeX, Play } from 'lucide-react'
import spaVideo from '@/assets/media/spa-demo.mp4'
import spaAudio from '@/assets/media/spa-ambient.mp3'

// Khối Video + Audio trên landing page:
// - Video giới thiệu không gian spa (HTML5 <video>, lưu tại src/assets/media).
// - Nhạc nền dưỡng sinh (HTML5 <audio>) — người dùng tự bật/tắt, không autoplay âm lượng.
export default function MediaShowcase() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [audioOn, setAudioOn] = useState(false)

  // Tắt nhạc khi rời trang
  useEffect(() => () => { audioRef.current?.pause() }, [])

  const toggleVideo = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); setVideoPlaying(true) }
    else { v.pause(); setVideoPlaying(false) }
  }

  const toggleAudio = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { a.play(); setAudioOn(true) }
    else { a.pause(); setAudioOn(false) }
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <span className="text-accent font-semibold text-xs tracking-wider uppercase">Không gian &amp; Âm hưởng</span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-primary">Trải Nghiệm Trực Quan Tại Eva Spa</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Video không gian trị liệu và nhạc nền dưỡng sinh — mời bạn xem và bật nhạc để cảm nhận trước khi đến.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          {/* Video */}
          <div className="lg:col-span-3 relative rounded-3xl overflow-hidden border border-border shadow-lg bg-black group">
            <video
              ref={videoRef}
              src={spaVideo}
              className="w-full aspect-video object-cover"
              loop
              playsInline
              onClick={toggleVideo}
            />
            {/* Nút play overlay */}
            {!videoPlaying && (
              <button
                onClick={toggleVideo}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors"
                title="Xem video"
              >
                <span className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                  <Play className="w-7 h-7 text-primary fill-primary ml-1" />
                </span>
              </button>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[11px] px-3 py-1.5 rounded-full backdrop-blur-xs">
              🎬 Video giới thiệu Eva Spa
            </div>
          </div>

          {/* Audio panel */}
          <div className="lg:col-span-2 bg-secondary/50 border border-border rounded-3xl p-8 flex flex-col justify-center items-center text-center gap-5">
            {/* Animated equalizer */}
            <div className="flex items-end gap-1.5 h-12" aria-hidden>
              {[0.9, 0.5, 1.1, 0.7, 1.3, 0.6, 1.0, 0.8].map((h, i) => (
                <span
                  key={i}
                  className={`w-1.5 rounded-full bg-accent transition-all ${audioOn ? 'animate-pulse' : 'opacity-40'}`}
                  style={{
                    height: audioOn ? `${h * 100}%` : '30%',
                    animationDelay: `${i * 120}ms`,
                    animationDuration: '900ms',
                  }}
                />
              ))}
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-primary">Nhạc Nền Dưỡng Sinh</h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
                Tiếng suối reo, chuông gió và đàn tranh nhẹ — âm hưởng thiền định được sử dụng trong phòng liệu trình.
              </p>
            </div>
            <button
              onClick={toggleAudio}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
                audioOn
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
            >
              {audioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {audioOn ? 'Đang phát — bấm để tắt' : 'Bật nhạc dưỡng sinh'}
            </button>
            <audio ref={audioRef} src={spaAudio} loop preload="none" />
          </div>
        </div>
      </div>
    </section>
  )
}
