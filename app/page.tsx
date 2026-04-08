"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const bingoPreview = Array.from({ length: 25 }, (_, i) => i + 1);

const balloons = [
  { left: "34%", size: 74, duration: 18, delay: 4, color: "from-[#f4d99f] to-[#f6ead0]" },
  { left: "46%", size: 52, duration: 14, delay: 2, color: "from-[#bcd9f7] to-[#d9ecfb]" },
  { left: "49%", size: 80, duration: 19, delay: 1, color: "from-[#E4d99f] to-[#g6ead0]" },
  { left: "44%", size: 40, duration: 16, delay: 7, color: "from-[#cdb9f5] to-[#e4d8fb]" },
  
];

const fireworks = [
  { top: "93%", left: "37%", delay: "0s", colors: ["#ff4e50", "#f9d423", "#ffffff"] },

  
];

const marqueeItems = [
  "1주년 빙고 페스티벌",
  "Book Bingo Festival",
  "팀 선택 후 바로 입장",
  "분위기부터 완성",
  "오늘은 다독다독 축제",
  "ANNIVERSARY SPECIAL",
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
        <div className="relative overflow-hidden border-b border-[#e7dcc8] bg-[linear-gradient(135deg,#2b211b_0%,#4a3429_52%,#5b3f8f_100%)] px-6 py-6 text-white md:px-8 md:py-7">
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.12),transparent_28%)]" />

  <div className="relative z-10">
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="rounded-full border border-yellow-200/30 bg-yellow-300/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-yellow-100">
        DADOKDADOK BOOK CLUB
      </span>
      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-white/90">
        BINGO ENTRY
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
          <div className="rounded-[26px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-4 shadow-[0_12px_28px_rgba(73,52,24,0.08)] md:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black tracking-[0.18em] text-[#f36f86]">
                  EVENT PREVIEW
                </p>
                <h2 className="mt-1 text-xl font-black text-[#241913] md:text-[28px]">
                  1주년 빙고 페스티벌
                </h2>
              </div>

              <div className="rounded-full bg-[linear-gradient(90deg,#f36f86_0%,#f39a3c_100%)] px-3 py-1.5 text-[10px] font-black text-white shadow">
                LIVE NOW
              </div>
            </div>

<<<<<<< HEAD
            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              다독다독 1st Anniversary
              <br />
              <span className="text-[#ffe89a]">Book Bingo</span>
            </h1>

            <p className="mt-4 max-w-2xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
              독서 동호회 다독다독 1주년 기념 이벤트 게임입니다.
              팀별로 책 빙고판을 완성하고, 독서 취향과 팀워크로 빙고를 먼저 선언해보세요.
            </p>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                ENTRY FLOW
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                빙고 참가로 바로 시작
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                홈에서는 참가 버튼만 남기고 단순하게 시작합니다.
                첫 접속자는 팀의 대표가 되고, 이후 접속자는 같은 팀의 팀원으로
                합류합니다.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                PLAY RULE
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                3줄 완성 후 빙고
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                체크를 쌓아 3줄 이상 완성되면 빙고를 선언할 수 있습니다.
                먼저 선언한 팀이 승리합니다.
              </p>
            </div>
          </div>

          {hasSession && (
            <div className="rounded-[24px] border border-[#cfe0ff] bg-[linear-gradient(180deg,#f5f9ff_0%,#edf4ff_100%)] p-5 shadow-[0_10px_24px_rgba(59,130,246,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black tracking-[0.16em] text-[#4f6ea8]">
                    SAVED SESSION
                  </p>
                  <p className="mt-2 text-2xl font-black text-[#1f2a44]">
                    이전 접속 정보가 남아 있습니다
                  </p>
                  <p className="mt-2 break-keep text-sm font-semibold text-[#5c6b85]">
                    팀: <span className="font-black text-[#1f2a44]">{teamName || "-"}</span>
                    <span className="mx-2 text-[#9aa8bf]">/</span>
                    이름: <span className="font-black text-[#1f2a44]">{memberName || "-"}</span>
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/team"
                    className="rounded-2xl bg-[linear-gradient(135deg,#2f2219_0%,#4a3429_100%)] px-5 py-3 text-sm font-black text-white shadow-[0_10px_20px_rgba(73,52,24,0.18)] transition hover:-translate-y-0.5"
=======
            <div className="overflow-hidden rounded-full border border-[#eadfcf] bg-white/80 py-2 shadow-inner">
              <div className="flex min-w-max animate-marquee gap-2 px-3">
                {[...marqueeItems, ...marqueeItems].map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-full bg-[linear-gradient(90deg,#fff1f2_0%,#fff7ed_50%,#eff6ff_100%)] px-3 py-1.5 text-xs font-black text-[#4d5b73] shadow-sm"
>>>>>>> d3f6470 (특정 파일만 반영)
                  >
                    ✨ {item}
                  </div>
                ))}
              </div>
            </div>

<<<<<<< HEAD
          <Link
            href="/join"
            className="group block rounded-[28px] border border-[#d8cbe1] bg-[linear-gradient(135deg,#fbf8ff_0%,#efe7ff_100%)] p-6 shadow-[0_14px_32px_rgba(88,62,135,0.12)] transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(88,62,135,0.18)] md:p-7"
          >
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-black tracking-[0.16em] text-[#7c62a6]">
                  BINGO ENTRY
                </p>
                <h2 className="mt-3 text-3xl font-black leading-tight text-[#241913] md:text-4xl">
                  빙고 참가
                </h2>
                <p className="mt-3 break-keep text-sm font-semibold leading-7 text-[#6b5848] md:text-[15px]">
                  팀을 선택하고 이름을 입력해 바로 참가하세요.
                  같은 팀의 첫 접속자는 대표가 되며, 이후 참가자는 자동으로 팀원으로
                  연결됩니다.
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <div className="rounded-full bg-[linear-gradient(135deg,#5b3f8f_0%,#7c3aed_50%,#ec4899_100%)] px-5 py-3 text-sm font-black text-white shadow">
                  JOIN NOW
                </div>
              </div>
            </div>
          </Link>

          
=======
            <div className="mt-4 rounded-[24px] border border-[#eadfcf] bg-white/90 p-4 shadow-[0_10px_24px_rgba(73,52,24,0.05)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.24em] text-[#8c5be8]">
                    BINGO BOARD
                  </p>
                  <p className="mt-0.1 text-base font-black text-[#1f2b44]">
                    CENTER PREVIEW
                  </p>
                </div>

                <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[15px] font-black text-emerald-600">
                  READY
                </div>
              </div>

              {/* 빙고판 살짝 축소 */}
              <div className="mx-auto grid aspect-square w-full max-w-[550px] grid-cols-5 gap-2.5 md:max-w-[640px] md:gap-3">
                {bingoPreview.map((num) => {
                  const highlight = num === 4 || num === 7 || num === 19 || num === 23;
                  const center = num === 13;

                  return (
                    <div
                      key={num}
                      className={`group relative overflow-hidden rounded-[16px] border transition duration-300 hover:-translate-y-0.5 ${
                        center
                          ? "border-[#f3c66a] bg-[linear-gradient(135deg,#fff6da_0%,#f9e5a9_100%)] shadow-[0_10px_22px_rgba(201,162,74,0.18)]"
                          : highlight
                          ? "border-[#f4c1cf] bg-[linear-gradient(135deg,#fff1f2_0%,#ffe4e6_100%)] shadow-[0_10px_22px_rgba(243,111,134,0.14)]"
                          : "border-slate-100 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_100%)] shadow-[0_8px_18px_rgba(148,163,184,0.08)]"
                      }`}
                    >
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),transparent_72%)]" />
                      <div className="relative flex h-full flex-col items-center justify-center gap-1">
                        <span className="text-[12px] font-black uppercase tracking-[0.24em] text-slate-400">
                         BOOK
                        </span>

                        <span
                          className={`font-black tracking-[-0.04em] ${
                            center
                              ? "text-[clamp(0.95rem,1.8vw,1.45rem)] text-[#a37a1e] [text-shadow:0_1px_0_rgba(255,255,255,0.92),0_3px_8px_rgba(163,122,30,0.16)]"
                              : highlight
                              ? "text-[clamp(1rem,1.8vw,1.4rem)] text-[#f36f86] [text-shadow:0_1px_0_rgba(255,255,255,0.92),0_3px_8px_rgba(243,111,134,0.12)]"
                              : "text-[clamp(1rem,1.8vw,1.4rem)] text-[#1f2b44] [text-shadow:0_1px_0_rgba(255,255,255,0.96),0_2px_6px_rgba(31,43,68,0.08)]"
                          }`}
                        >
                          {center ? "BINGO" : num}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
       
>>>>>>> d3f6470 (특정 파일만 반영)
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