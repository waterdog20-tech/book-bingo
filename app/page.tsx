"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [memberName, setMemberName] = useState("");

  useEffect(() => {
    const gameId = localStorage.getItem("game_id");
    const savedTeamName = localStorage.getItem("team_name") || "";
    const savedMemberName = localStorage.getItem("member_name") || "";

    setHasSession(!!gameId);
    setTeamName(savedTeamName);
    setMemberName(savedMemberName);
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
    <main className="min-h-screen bg-[#f6efe4] p-4 md:p-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,248,220,0.92),rgba(246,239,228,0.96)_35%,rgba(235,224,205,0.98)_70%,rgba(226,211,188,1)_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(120,96,64,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(120,96,64,0.28)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-[#e7dcc8] bg-[#fffaf2] shadow-[0_18px_50px_rgba(73,52,24,0.12)]">
        <div className="relative border-b border-[#e7dcc8] bg-[linear-gradient(135deg,#2b211b_0%,#4a3429_52%,#7b3f56_100%)] px-6 py-7 text-white md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.12),transparent_28%)]" />

          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-yellow-200/30 bg-yellow-300/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-yellow-100">
                DADOKDADOK BOOK CLUB
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-white/90">
                1ST ANNIVERSARY
              </span>
              <span className="rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_50%,#ec4899_100%)] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white shadow">
                BOOK BINGO
              </span>
            </div>

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
                GAME FLOW
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                대표 / 팀원
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                대표는 게임을 생성하거나 입장하고, 팀원은 같은 게임에 참가해 함께 빙고를 진행합니다.
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
                  >
                    이전 게임으로 돌아가기
                  </Link>

                  <button
                    type="button"
                    onClick={clearSession}
                    className="rounded-2xl border border-[#bfd1f4] bg-white px-5 py-3 text-sm font-black text-[#47618f] shadow-sm transition hover:bg-[#f7fbff]"
                  >
                    세션 초기화
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/leader"
              className="group rounded-[26px] border border-[#d8c3a2] bg-[linear-gradient(135deg,#fff8ec_0%,#f8e8c9_100%)] p-6 shadow-[0_12px_28px_rgba(73,52,24,0.10)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(73,52,24,0.16)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                    LEADER MODE
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-[#241913]">
                    대표로 시작
                  </h2>
                  <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                    게임을 만들고, 상대 팀 5칸과 우리 팀 빙고판을 설정하는 대표 화면으로 이동합니다.
                  </p>
                </div>
                <div className="rounded-full bg-[#2f2219] px-3 py-2 text-xs font-black text-[#f5d88a] shadow">
                  START
                </div>
              </div>
            </Link>

            <Link
              href="/join"
              className="group rounded-[26px] border border-[#d8cbe1] bg-[linear-gradient(135deg,#fbf8ff_0%,#efe7ff_100%)] p-6 shadow-[0_12px_28px_rgba(88,62,135,0.10)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(88,62,135,0.16)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black tracking-[0.16em] text-[#7c62a6]">
                    MEMBER MODE
                  </p>
                  <h2 className="mt-3 text-2xl font-black text-[#241913]">
                    팀원 참가
                  </h2>
                  <p className="mt-3 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                    이미 생성된 게임에 접속해 팀원으로 참여하고, 함께 책 빙고를 진행합니다.
                  </p>
                </div>
                <div className="rounded-full bg-[#5b3f8f] px-3 py-2 text-xs font-black text-white shadow">
                  JOIN
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}