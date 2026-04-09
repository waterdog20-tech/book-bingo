"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const bingoPreview = Array.from({ length: 25 }, (_, i) => i + 1);

const balloons = [
  { left: "5%", size: 70, duration: 15, delay: 0, color: "from-pink-400 to-rose-300" },
  { left: "15%", size: 50, duration: 18, delay: 3, color: "from-sky-400 to-blue-300" },
  { left: "25%", size: 85, duration: 14, delay: 1, color: "from-yellow-300 to-amber-200" },
  { left: "38%", size: 60, duration: 16, delay: 4, color: "from-purple-400 to-fuchsia-300" },
  { left: "50%", size: 90, duration: 20, delay: 0, color: "from-emerald-400 to-teal-300" },
  { left: "65%", size: 55, duration: 15, delay: 2, color: "from-orange-400 to-red-300" },
  { left: "80%", size: 75, duration: 17, delay: 5, color: "from-indigo-400 to-cyan-300" },
  { left: "92%", size: 65, duration: 19, delay: 1, color: "from-pink-300 to-purple-300" }
  
];

const fireworks = [
  { top: "63%", left: "37%", delay: "0s", colors: ["#ff4e50", "#f9d423", "#ffffff"] },

];

const marqueeItems = [
  "1주년 빙고 페스티벌",
  "Book Bingo Festival",
  "주서영 때문에 짜증~",
  "오늘은 다독다독 축제",
  "회원들이 좋아할까?",
  "ANNIVERSARY SPECIAL",
];
const headerGradientStops = [
  { color: "#081435", stop: "0%" },
  { color: "#358ddf", stop: "55%" },
  { color: "#ffffff", stop: "100%" },
];
export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const gameId = localStorage.getItem("game_id");
    const savedTeamName = localStorage.getItem("team_name") || "";
    const savedMemberName = localStorage.getItem("member_name") || "";

    setHasSession(!!gameId);
    setTeamName(savedTeamName);
    setMemberName(savedMemberName);
    setMounted(true);
  }, []);

  const clearSession = () => {
    localStorage.removeItem("game_id");
    localStorage.removeItem("game_code");
    localStorage.removeItem("team_id");
    localStorage.removeItem("team_name");
    localStorage.removeItem("member_id");
    localStorage.removeItem("member_name");
    localStorage.removeItem("is_leader");

    setHasSession(false);
    setTeamName("");
    setMemberName("");
  };

  return (
    <main className="min-h-screen bg-[#f6efe4] p-3 md:p-4">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,248,220,0.92),rgba(246,239,228,0.96)_35%,rgba(235,224,205,0.98)_70%,rgba(226,211,188,1)_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(120,96,64,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(120,96,64,0.28)_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* 배경 풍선 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {mounted &&
          balloons.map((balloon, idx) => (
            <div
              key={idx}
              className="absolute bottom-[-140px] animate-balloon-rise"
              style={{
                left: balloon.left,
                animationDuration: `${balloon.duration}s`,
                animationDelay: `${balloon.delay}s`,
              }}
            >
              <div
                className="relative"
                style={{ width: balloon.size, height: balloon.size * 1.18 }}
              >
                <div
                  className={`absolute inset-0 rounded-[45%_45%_48%_48%/42%_42%_58%_58%] bg-gradient-to-b ${balloon.color} shadow-[0_18px_40px_rgba(255,255,255,0.2)]`}
                />
                <div className="absolute left-[18%] top-[14%] h-[22%] w-[18%] rounded-full bg-white/50 blur-[2px]" />
                <div className="absolute bottom-[-8px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] bg-white/65" />
                <div
                  className="absolute left-1/2 top-[100%] w-[2px] -translate-x-1/2 bg-white/55"
                  style={{ height: balloon.size * 0.95 }}
                />
              </div>
            </div>
          ))}
      </div>

{/* 팡팡 터지는 폭죽 레이어 */}
<div className="absolute inset-0 pointer-events-none">
  {mounted && fireworks.map((fw, fwIdx) => (
    <div key={`fw-${fwIdx}`} className="absolute" style={{ top: fw.top, left: fw.left }}>
      {[...Array(12)].map((_, i) => {
        // 360도 방향으로 파편이 튀어나가는 계산
        const angle = (i * 360) / 12;
        const tx = Math.cos((angle * Math.PI) / 180) * 80;
        const ty = Math.sin((angle * Math.PI) / 180) * 80;
        return (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-firework-burst"
            style={{
              backgroundColor: fw.colors[i % fw.colors.length],
              boxShadow: `0 0 10px ${fw.colors[i % fw.colors.length]}`,
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              animationDelay: fw.delay,
            } as any}
          />
        );
      })}
    </div>
  ))}
</div>



      <div className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-[#e7dcc8] bg-[#fffaf2] shadow-[0_18px_50px_rgba(73,52,24,0.12)]">
        {/* 헤더 */}
       <div
  className="relative overflow-hidden border-b border-[#e7dcc8] px-6 py-6 text-white md:px-8 md:py-7"
  style={{
    backgroundImage: `linear-gradient(135deg, ${headerGradientStops
      .map((item) => `${item.color} ${item.stop}`)
      .join(", ")})`,
  }}
>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245, 49, 0, 0.12),transparent_28%)]" />

  <div className="relative z-10">
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-yellow-200/30 bg-yellow-300/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-yellow-100">
        DADOKDADOK BOOK CLUB
      </span>
      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-white/90">
        1ST ANNIVERSARY
      </span>
      <span className="rounded-full bg-[linear-gradient(90deg,#7c3aed_0%,#a855f7_55%,#ec4899_100%)] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white shadow">
        AUTO JOIN
      </span>
    </div>

    <h1 className="text-3xl font-black leading-tight md:text-5xl">
      다독다독 
      <br />
      <span className="text-[#ffe89a]">1st Anniversary</span>
    </h1>

    <p className="mt-4 max-w-3xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
      팀을 선택하고 이름을 입력해 다독다독 1주년 북빙고에 바로 입장하세요. 
    </p>
  </div>
</div>

        {/* 본문 */}
        <div className="space-y-4 px-6 py-5 md:px-8 md:py-6">
          {/* 빙고판 섹션 */}
          {/* 빙고판 섹션 */}
<div className="rounded-[28px] border border-[#e6d8ea] bg-[linear-gradient(135deg,#fff8fb_0%,#fff6ef_46%,#f7f0ff_100%)] p-5 shadow-[0_16px_36px_rgba(96,63,143,0.10)] md:p-6">
  <div className="relative overflow-hidden rounded-[24px] border border-white/70 bg-white/55 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-sm">
    <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[linear-gradient(90deg,rgba(255,248,251,0.92),transparent)]" />
    <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[linear-gradient(270deg,rgba(247,240,255,0.92),transparent)]" />

    <div className="flex min-w-max animate-marquee gap-2 px-2">
      {[...marqueeItems, ...marqueeItems].map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[11px] font-black tracking-[0.08em] text-[#6a547b] shadow-[0_4px_10px_rgba(96,63,143,0.06)]"
        >
          {item}
        </div>
      ))}
    </div>
  </div>

  <div className="mt-6 grid items-center gap-6 md:grid-cols-[1.05fr_0.95fr]">
    <div className="relative">
      <div className="inline-flex items-center rounded-full border border-[#e8d9f0] bg-white/80 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-[#8b67b4] shadow-sm">
        1ST ANNIVERSARY
      </div>

      <h2 className="mt-4 text-[clamp(2rem,4vw,4.25rem)] font-black leading-[0.92] tracking-[-0.05em] text-[#3c2850]">
        Book Bingo
        <br />
        <span className="bg-[linear-gradient(90deg,#6f42c1_0%,#d9468d_52%,#f59e0b_100%)] bg-clip-text text-transparent">
          Festival
        </span>
      </h2>

      <p className="mt-4 max-w-xl break-keep text-sm font-semibold leading-7 text-[#705f74] md:text-[15px]">
        팀을 선택하고 이름을 입력하면 바로 참가할 수 있습니다.
        독서 취향과 팀워크로 빙고를 완성하고 가장 먼저 선언해보세요.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-full border border-[#ecdff2] bg-white/85 px-3 py-1.5 text-xs font-black text-[#7d6299] shadow-sm">
          1주년 기념
        </span>
        <span className="rounded-full border border-[#f1dde5] bg-white/85 px-3 py-1.5 text-xs font-black text-[#b35d87] shadow-sm">
          팀 대항 북빙고
        </span>
        <span className="rounded-full border border-[#f4e3c8] bg-white/85 px-3 py-1.5 text-xs font-black text-[#b67d2a] shadow-sm">
          자동 참가
        </span>
      </div>
    </div>

    <div className="relative">
      <div className="absolute -left-5 top-8 h-24 w-24 rounded-full bg-[#ffd7e8]/60 blur-2xl" />
      <div className="absolute -right-3 top-2 h-24 w-24 rounded-full bg-[#ddd1ff]/70 blur-2xl" />
      <div className="absolute bottom-1 left-10 h-20 w-20 rounded-full bg-[#ffe7b3]/60 blur-2xl" />

      <div className="relative rounded-[30px] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,251,255,0.9)_100%)] p-4 shadow-[0_20px_40px_rgba(96,63,143,0.14)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black tracking-[0.18em] text-[#8b67b4]">
              FESTIVAL BOARD
            </p>
            <p className="mt-1 text-sm font-black text-[#33213f]">
              CENTER PREVIEW
            </p>
          </div>

          <div className="rounded-full bg-[linear-gradient(90deg,#7c3aed_0%,#ec4899_100%)] px-3 py-1 text-[11px] font-black text-white shadow">
            PLAY
          </div>
        </div>

        <div className="grid aspect-square grid-cols-5 gap-2 md:gap-2.5">
          {bingoPreview.map((num) => {
            const isCenter = num === 13;
            const isAccentA = [1, 5, 9, 17, 21].includes(num);
            const isAccentB = [2, 7, 12, 19, 24].includes(num);
            const isAccentC = [4, 10, 16, 20, 23].includes(num);

            const toneClass = isCenter
              ? "border-[#f0c35d] bg-[linear-gradient(135deg,#fff0b8_0%,#ffd86b_100%)] text-[#6e4b00] shadow-[0_10px_20px_rgba(240,195,93,0.30)]"
              : isAccentA
              ? "border-[#f3c8da] bg-[linear-gradient(135deg,#ffe2ee_0%,#ffd1e2_100%)] text-[#b34e7d]"
              : isAccentB
              ? "border-[#dccfff] bg-[linear-gradient(135deg,#eee7ff_0%,#ddd0ff_100%)] text-[#7250c7]"
              : isAccentC
              ? "border-[#f4ddb4] bg-[linear-gradient(135deg,#fff0d5_0%,#ffe2ac_100%)] text-[#b67a21]"
              : "border-[#efe8f4] bg-[linear-gradient(135deg,#ffffff_0%,#faf7fd_100%)] text-[#8d7c99]";

            return (
              <div
                key={num}
                className={`relative flex items-center justify-center overflow-hidden rounded-[18px] border transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_18px_rgba(96,63,143,0.10)] ${toneClass}`}
              >
                <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_72%)]" />

                {isCenter ? (
                  <span className="relative text-[clamp(1rem,2vw,1.4rem)] font-black tracking-[-0.04em]">
                    ★
                  </span>
                ) : (
                  <span className="relative text-[clamp(0.95rem,1.8vw,1.2rem)] font-black tracking-[-0.03em]">
                    {num}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
</div>
          {/* CTA 하나만 */}
          <Link
            href="/join"
            className="block w-full rounded-[22px] bg-[linear-gradient(135deg,#4b2f74_0%,#6d46a5_55%,#c026d3_100%)] px-5 py-4 text-center text-base font-black text-white shadow-[0_14px_28px_rgba(91,63,143,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(91,63,143,0.26)]"
          >
            빙고 참가하기
          </Link>
       
        </div>
      </div>

      <style jsx>{`
        .animate-balloon-rise {
          animation-name: balloonRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .animate-marquee {
          animation: marquee 24s linear infinite;
        }

        @keyframes balloonRise {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          25% {
            transform: translate3d(10px, -18vh, 0) rotate(2deg);
          }
          50% {
            transform: translate3d(-12px, -38vh, 0) rotate(-2deg);
          }
          75% {
            transform: translate3d(8px, -60vh, 0) rotate(3deg);
          }
          100% {
            transform: translate3d(-10px, -95vh, 0) rotate(-3deg);
            opacity: 0;
          }
        }
/* 파편이 사방으로 퍼지면서 사라지는 효과 */
@keyframes firework-burst {
  0% { 
    transform: translate(0, 0) scale(1); 
    opacity: 1; 
  }
  70% { 
    transform: translate(var(--tx), var(--ty)) scale(0); 
    opacity: 0; 
  }
  
  100% { 
    transform: translate(var(--tx), var(--ty)) scale(0); 
    opacity: 0; 
  }
}

.animate-firework-burst {
  animation: firework-burst 4s ease-out infinite;
}
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </main>
  );
}
