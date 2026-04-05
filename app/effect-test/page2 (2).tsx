"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

export default function EffectTestPage() {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  // === 공통: 폭죽 효과 함수 (밑에서 위로 멀리 쏘아 올리기) ===
  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({ particleCount: 20, angle: 60, spread: 55, startVelocity: 120, ticks: 400, gravity: 0.8, origin: { x: 0, y: 1 }, colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"] });
      confetti({ particleCount: 20, angle: 120, spread: 55, startVelocity: 120, ticks: 400, gravity: 0.8, origin: { x: 1, y: 1 }, colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"] });
      confetti({ particleCount: 25, angle: 90, spread: 80, startVelocity: 140, ticks: 400, gravity: 0.6, origin: { x: 0.5, y: 1 }, colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"] });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const triggerEffect = (effectName: string) => {
    setActiveEffect(effectName);
    if (effectName.includes("win")) fireConfetti();
    
    // 이펙트 종료 시간 설정 (승리는 4.5초, 패배는 6초로 길게)
    const duration = effectName.includes("lose") ? 6000 : 4500;
    setTimeout(() => setActiveEffect(null), duration);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-10">
      <style dangerouslySetInnerHTML={{
        __html: `
        /* 💃 춤추는 애니메이션 (이미지용으로 스케일 약간 조절) */
        @keyframes dance { 
          0%, 100% { transform: translateY(0) scale(1) rotate(-5deg); } 
          50% { transform: translateY(-40px) scale(1.1) rotate(5deg); } 
        }
        @keyframes popBounce { 
          0% { transform: scale(0.5); opacity: 0; } 
          60% { transform: scale(1.2); opacity: 1; } 
          100% { transform: scale(1); opacity: 1; } 
        }

        /* 🌩️ 번개 & 폭풍우 애니메이션 (시간 연장 및 번개 자국 추가) */
        @keyframes lightningStrike {
          0%, 100% { background-color: rgba(255,255,255,0); }
          2%, 8% { background-color: rgba(255,255,255,0.95); }
          5% { background-color: rgba(255,255,255,0); }
          10% { background-color: rgba(200,240,255,0.8); }
          12% { background-color: rgba(255,255,255,0); }
        }
        @keyframes heavyRain {
          0% { transform: translateY(-10vh) translateX(10vw) rotate(15deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh) translateX(-10vw) rotate(15deg); opacity: 0; }
        }
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-15px, 15px); }
          20%, 40%, 60%, 80% { transform: translate(15px, -15px); }
        }
        @keyframes thunderMarkGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(100,255,255,0.7)) brightness(1.1); opacity: 1; }
          50% { filter: drop-shadow(0 0 30px rgba(100,255,255,1)) brightness(1.4); opacity: 1; }
        }

        .animate-dance { animation: dance 0.6s infinite ease-in-out; }
        .animate-pop-bounce { animation: popBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-lightning-strike { animation: lightningStrike 4s infinite; }
        .animate-heavy-rain { animation: heavyRain 0.5s linear infinite; }
        .animate-screen-shake { animation: screenShake 0.5s ease-in-out; }
        .animate-thunder-mark-glow { animation: thunderMarkGlow 2s infinite ease-in-out; }
      `}} />

      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-3xl font-black text-slate-900 text-center">
          🎨 빙고 이펙트 테스트 샌드박스
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 승리 샘플 */}
          <div className="space-y-4 rounded-2xl border-2 border-green-100 bg-green-50 p-6">
            <h2 className="text-xl font-bold text-green-800">🏆 승리 이펙트</h2>
            <button onClick={() => triggerEffect("win-image-dance")} className="w-full rounded-xl bg-green-600 px-4 py-4 font-bold text-white shadow-md transition hover:bg-green-500 hover:-translate-y-1">
              이미지 댄스 파티 🏆🎉
            </button>
          </div>

          {/* 패배 샘플 */}
          <div className="space-y-4 rounded-2xl border-2 border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-bold text-red-400">🚨 패배 이펙트</h2>
            <button
              onClick={() => triggerEffect("lose-storm-extended")}
              className="w-full rounded-xl bg-slate-700 px-4 py-4 font-black text-white shadow-md transition hover:bg-slate-600 hover:-translate-y-1"
            >
              긴 폭풍우 & 번개 자국 🌩️⚡
            </button>
          </div>
        </div>
      </div>

      {/* =========================================
          이펙트 오버레이 영역 
         ========================================= */}

      {/* 승리: 올려주신 이미지가 춤추는 파티 */}
      {activeEffect === "win-image-dance" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActiveEffect(null)}>
          
          {/* 이미지가 아래에서 춤추는 영역 */}
          <div className="absolute inset-0 overflow-hidden flex justify-around items-end pb-10 pointer-events-none">
            {/* 크기와 타이밍을 다르게 주어 리듬감 형성 */}
            <img src="/4280346.jpg" alt="dance1" className="w-32 h-32 object-contain drop-shadow-xl animate-dance" style={{ animationDelay: '0s' }} />
            <img src="/4280346.jpg" alt="dance2" className="w-48 h-48 object-contain drop-shadow-2xl animate-dance" style={{ animationDelay: '0.3s' }} />
            <img src="/4280346.jpg" alt="dance3" className="w-56 h-56 object-contain drop-shadow-2xl animate-dance" style={{ animationDelay: '0.1s' }} />
            <img src="/4280346.jpg" alt="dance4" className="w-40 h-40 object-contain drop-shadow-xl animate-dance" style={{ animationDelay: '0.4s' }} />
            <img src="/4280346.jpg" alt="dance5" className="w-36 h-36 object-contain drop-shadow-xl animate-dance" style={{ animationDelay: '0.2s' }} />
          </div>

          {/* 중앙 우승 텍스트 박스 */}
          <div className="z-10 rounded-3xl bg-white/95 px-12 py-10 text-center shadow-[0_0_50px_rgba(253,224,71,0.5)] ring-4 ring-yellow-400 animate-pop-bounce pointer-events-auto">
            <p className="text-6xl font-black tracking-wide text-pink-600">🎉 WINNER 🎉</p>
            <p className="mt-4 text-2xl font-black text-slate-900">우승입니다! 난리 났네요! 🥳</p>
          </div>
        </div>
      )}

      {/* 패배: 긴 폭풍우와 번개 자국 */}
      {activeEffect === "lose-storm-extended" && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/95 backdrop-blur-md flex items-center justify-center pointer-events-auto" onClick={() => setActiveEffect(null)}>
          
          {/* 강한 빗줄기 */}
          <div className="absolute inset-0 pointer-events-none opacity-80">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="absolute w-[3px] h-[120px] bg-white/60 animate-heavy-rain"
                style={{
                  left: `${Math.random() * 150 - 25}%`,
                  animationDelay: `${Math.random()}s`,
                  animationDuration: `${0.2 + Math.random() * 0.3}s`
                }}
              />
            ))}
          </div>

          {/* 화면 곳곳의 번개 자국 (Glowing Lightning Marks) */}
          <div className="absolute inset-0 pointer-events-none flex flex-wrap justify-around items-center opacity-60">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="text-[120px] animate-thunder-mark-glow"
                style={{
                  position: 'absolute',
                  left: `${Math.random() * 80 + 10}%`,
                  top: `${Math.random() * 80 + 10}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  transform: `rotate(${Math.random() * 360}deg)`
                }}
              >
                ⚡
              </div>
            ))}
          </div>

          {/* 중앙 메시지 */}
          <div className="z-10 flex flex-col items-center animate-screen-shake">
            <div className="animate-lightning-strike px-16 py-12 text-center border-y-8 border-slate-400 bg-black/80 shadow-[0_0_150px_rgba(255,255,255,0.3)] rounded-xl">
              <p className="text-7xl font-black tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]">
                GAME OVER
              </p>
              <p className="mt-6 text-2xl font-bold text-slate-300">
                상대 팀이 먼저 빙고를 완성했습니다... 🌩️
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}