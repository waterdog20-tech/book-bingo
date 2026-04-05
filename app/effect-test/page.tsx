"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

export default function EffectTestPage() {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);

  // === 공통: 폭죽 효과 함수 ===
  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 20,
        angle: 120,
        spread: 55,
		startVelocity: 120,
		ticks: 400,
		gravity: 0.8,
        origin: { x: 1, y: 1 },
        colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]
      });
      confetti({
        particleCount: 20,
        angle: 60,
        spread: 55,
		startVelocity: 120,
		ticks: 400,
		gravity: 0.8,
        origin: { x: 0, y: 1 },
		colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]
      });
 confetti({
        particleCount: 20,
        angle: 90,
        spread: 80,
		startVelocity: 140,
		ticks: 400,
		gravity: 0.8,
        origin: { x: 0.5, y: 1 },
		colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff"]
      });


      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // === 이펙트 실행 핸들러 ===
  const triggerEffect = (effectName: string) => {
    setActiveEffect(effectName);
    
    if (effectName.includes("win")) {
      fireConfetti();
    }

    // 4초 후 자동 종료
    setTimeout(() => {
      setActiveEffect(null);
    }, 4000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-10">
      {/* 사용자 정의 애니메이션 모음 */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* 춤추는 애니메이션 */
        @keyframes dance {
          0% { transform: translateY(0) scale(1) rotate(-10deg); }
          50% { transform: translateY(-30px) scale(1.1) rotate(10deg); }
          100% { transform: translateY(0) scale(1) rotate(-10deg); }
        }
        
        /* 팝업 바운스 애니메이션 */
        @keyframes popBounce {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* 비 내리는 애니메이션 */
        @keyframes rainFall {
          0% { transform: translateY(-50px); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        /* 슬프게 떨리는 애니메이션 */
        @keyframes shakeSad {
          0%, 100% { transform: translateX(0) scale(1); }
          20%, 60% { transform: translateX(-10px) rotate(-5deg) scale(0.95); }
          40%, 80% { transform: translateX(10px) rotate(5deg) scale(0.95); }
        }

        /* 흑백 전환 & 글리치 느낌 (충격 패배용) */
        @keyframes dramaticDrop {
          0% { transform: translateY(-100vh) rotate(5deg); opacity: 0; filter: grayscale(0%); }
          50% { transform: translateY(20px) rotate(-2deg); opacity: 1; }
          70% { transform: translateY(-10px) rotate(0deg); }
          100% { transform: translateY(0); filter: grayscale(100%); }
        }

        .animate-dance { animation: dance 0.6s infinite ease-in-out; }
        .animate-pop-bounce { animation: popBounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .animate-rain { animation: rainFall 1.5s linear infinite; }
        .animate-shake-sad { animation: shakeSad 2s infinite ease-in-out; }
        .animate-dramatic { animation: dramaticDrop 1.5s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      `}} />

      <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="mb-8 text-3xl font-black text-slate-900 text-center">
          🎨 빙고 이펙트 테스트 샌드박스
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 승리 샘플 그룹 */}
          <div className="space-y-4 rounded-2xl border-2 border-green-100 bg-green-50 p-6">
            <h2 className="text-xl font-bold text-green-800">🏆 승리 이펙트</h2>
            <button
              onClick={() => triggerEffect("win-party")}
              className="w-full rounded-xl bg-green-600 px-4 py-4 font-bold text-white shadow-md transition hover:bg-green-500 hover:-translate-y-1"
            >
              샘플 1: 파티 댄스 🕺💃
            </button>
            <button
              onClick={() => triggerEffect("win-pop")}
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-yellow-500 px-4 py-4 font-bold text-white shadow-md transition hover:opacity-90 hover:-translate-y-1"
            >
              샘플 2: 화려한 팝업 ✨🎉
            </button>
          </div>

          {/* 패배 샘플 그룹 */}
          <div className="space-y-4 rounded-2xl border-2 border-slate-200 bg-slate-100 p-6">
            <h2 className="text-xl font-bold text-slate-800">💀 패배 이펙트</h2>
            <button
              onClick={() => triggerEffect("lose-sad")}
              className="w-full rounded-xl bg-slate-700 px-4 py-4 font-bold text-white shadow-md transition hover:bg-slate-600 hover:-translate-y-1"
            >
              샘플 1: 비 내리는 좌절 💧🫠
            </button>
            <button
              onClick={() => triggerEffect("lose-shock")}
              className="w-full rounded-xl bg-red-800 px-4 py-4 font-bold text-white shadow-md transition hover:bg-red-700 hover:-translate-y-1"
            >
              샘플 2: 충격의 흑백 전환 😱⚡
            </button>
          </div>
        </div>
        
        <p className="mt-6 text-center text-sm text-slate-500">
          버튼을 누르면 4초간 이펙트가 재생됩니다.<br/>가장 마음에 드는 스타일을 골라보세요!
        </p>
      </div>

      {/* =========================================
          이펙트 오버레이 영역 
         ========================================= */}

      {/* 승리 샘플 1 (파티 댄스) */}
      {activeEffect === "win-party" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setActiveEffect(null)}>
          <div className="absolute inset-0 overflow-hidden flex justify-around items-end pb-20 pointer-events-none">
            <div className="text-[80px] animate-dance" style={{ animationDelay: '0s' }}>🕺</div>
            <div className="text-[70px] animate-dance" style={{ animationDelay: '0.3s' }}>💃</div>
            <div className="text-[90px] animate-dance" style={{ animationDelay: '0.1s' }}>👯‍♂️</div>
            <div className="text-[75px] animate-dance" style={{ animationDelay: '0.4s' }}>🙌</div>
            <div className="text-[85px] animate-dance" style={{ animationDelay: '0.2s' }}>🥳</div>
          </div>
          <div className="z-10 rounded-3xl bg-white/95 px-12 py-10 text-center shadow-[0_0_50px_rgba(253,224,71,0.5)] ring-4 ring-yellow-400 animate-pop-bounce pointer-events-auto">
            <p className="text-6xl font-black tracking-wide text-pink-600">🎉 WINNER 🎉</p>
            <p className="mt-4 text-2xl font-black text-slate-900">우승입니다! 난리 났네요! 🥳</p>
          </div>
        </div>
      )}

      {/* 승리 샘플 2 (화려한 팝업) */}
      {activeEffect === "win-pop" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md" onClick={() => setActiveEffect(null)}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,192,203,0.4)_100%)] pointer-events-none" />
          <div className="z-10 text-center animate-pop-bounce pointer-events-auto">
            <div className="text-[100px] mb-4">🏆</div>
            <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 drop-shadow-xl">
              VICTORY!
            </h2>
            <p className="mt-6 text-3xl font-bold text-slate-800 bg-white/80 px-8 py-3 rounded-full inline-block shadow-lg">
              우리가 해냈습니다! ✨
            </p>
          </div>
        </div>
      )}

      {/* 패배 샘플 1 (비 내리는 좌절) */}
      {activeEffect === "lose-sad" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md" onClick={() => setActiveEffect(null)}>
          <div className="absolute inset-0 overflow-hidden opacity-70 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute text-3xl animate-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`
                }}
              >💧</div>
            ))}
          </div>
          <div className="z-10 flex flex-col items-center animate-shake-sad pointer-events-auto">
            <div className="text-[120px] drop-shadow-2xl mb-[-20px]">🫠</div>
            <div className="rounded-3xl bg-slate-800/80 border border-slate-600 px-12 py-10 text-center shadow-2xl">
              <p className="text-4xl font-black tracking-widest text-slate-200">앗... 졌습니다 🤦‍♂️</p>
              <p className="mt-4 text-lg font-bold text-slate-400">상대 팀이 먼저 빙고를 스틸해갔어요! 😭</p>
            </div>
          </div>
        </div>
      )}

      {/* 패배 샘플 2 (충격의 흑백 전환) */}
      {activeEffect === "lose-shock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-lg" onClick={() => setActiveEffect(null)}>
          <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />
          <div className="z-10 flex flex-col items-center animate-dramatic pointer-events-auto">
            <div className="text-[100px] drop-shadow-2xl mb-4">😱</div>
            <div className="px-12 py-8 text-center border-y-4 border-slate-500 bg-black/50">
              <p className="text-6xl font-black tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                GAME OVER
              </p>
              <p className="mt-6 text-xl font-bold text-slate-300">
                눈앞에서 승리를 놓쳤습니다... 💀
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}