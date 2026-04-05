"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MemberRow = {
  id: string;
  team_id: string;
  name: string;
  is_leader: boolean;
};

type GameRow = {
  id: string;
  status: "waiting" | "setup_opponent" | "setup_self" | "playing" | "finished";
};

export default function LeaderPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [gameName, setGameName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [memberName, setMemberName] = useState("");

  const saveSession = ({
    gameId,
    teamId,
    teamName,
    memberId,
    memberName,
  }: {
    gameId: string;
    teamId: string;
    teamName: string;
    memberId: string;
    memberName: string;
  }) => {
    localStorage.setItem("game_id", gameId);
    localStorage.setItem("team_id", teamId);
    localStorage.setItem("team_name", teamName);
    localStorage.setItem("member_id", memberId);
    localStorage.setItem("member_name", memberName);
    localStorage.setItem("is_leader", "true");
  };

  const getOrCreateLeaderMember = async (
    teamId: string,
    memberName: string
  ): Promise<MemberRow> => {
    const trimmedName = memberName.trim();

    const { data: existingMember, error: existingError } = await supabase
      .from("team_members")
      .select("*")
      .eq("team_id", teamId)
      .eq("name", trimmedName)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingMember) return existingMember as MemberRow;

    const { data: newMember, error: insertError } = await supabase
      .from("team_members")
      .insert({ team_id: teamId, name: trimmedName, is_leader: true })
      .select()
      .single();

    if (insertError || !newMember) {
      throw new Error("대표 멤버 생성 실패");
    }

    return newMember as MemberRow;
  };

  const handleStart = async () => {
    setError("");

    const trimmedGameName = gameName.trim();
    const trimmedTeamName = teamName.trim();
    const trimmedMemberName = memberName.trim();

    if (!trimmedGameName || !trimmedTeamName || !trimmedMemberName) {
      setError("게임 이름, 팀 이름, 본인 이름을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const { data: game, error: gameLookupError } = await supabase
        .from("games")
        .select("id, status")
        .eq("name", trimmedGameName)
        .maybeSingle();

      if (gameLookupError) throw gameLookupError;

      if (!game) {
        const { data: newGame, error: gameInsertError } = await supabase
          .from("games")
          .insert({
            name: trimmedGameName,
            status: "waiting",
          })
          .select("id, status")
          .single();

        if (gameInsertError || !newGame) {
          throw new Error("게임 생성 실패");
        }

        const { data: team1, error: team1Error } = await supabase
          .from("teams")
          .insert({
            game_id: newGame.id,
            name: trimmedTeamName,
            team_order: 1,
          })
          .select()
          .single();

        if (team1Error || !team1) {
          throw new Error("1팀 생성 실패");
        }

        const cells1 = Array.from({ length: 25 }, (_, i) => ({
          game_id: newGame.id,
          team_id: team1.id,
          cell_number: i + 1,
          title: "",
          image_url: null,
          is_checked: false,
          opponent_slot: null,
        }));

        const { error: cellError1 } = await supabase
          .from("bingo_cells")
          .insert(cells1);

        if (cellError1) {
          throw new Error("빙고판 초기화 실패");
        }

        const leader = await getOrCreateLeaderMember(team1.id, trimmedMemberName);

        saveSession({
          gameId: newGame.id,
          teamId: team1.id,
          teamName: team1.name,
          memberId: leader.id,
          memberName: leader.name,
        });
      } else {
        const existingGame = game as GameRow;

        if (existingGame.status !== "waiting") {
          throw new Error("이미 진행 중인 게임입니다.");
        }

        const { data: existingTeams, error: teamsError } = await supabase
          .from("teams")
          .select("id")
          .eq("game_id", existingGame.id);

        if (teamsError) throw teamsError;

        if ((existingTeams || []).length >= 2) {
          throw new Error("이미 두 팀이 모두 참가한 게임입니다.");
        }

        const { data: team2, error: team2Error } = await supabase
          .from("teams")
          .insert({
            game_id: existingGame.id,
            name: trimmedTeamName,
            team_order: 2,
          })
          .select()
          .single();

        if (team2Error || !team2) {
          throw new Error("2팀 생성 실패");
        }

        const cells2 = Array.from({ length: 25 }, (_, i) => ({
          game_id: existingGame.id,
          team_id: team2.id,
          cell_number: i + 1,
          title: "",
          image_url: null,
          is_checked: false,
          opponent_slot: null,
        }));

        const { error: cellError2 } = await supabase
          .from("bingo_cells")
          .insert(cells2);

        if (cellError2) {
          throw new Error("상대팀 빙고판 초기화 실패");
        }

        const { error: statusUpdateError } = await supabase
          .from("games")
          .update({ status: "setup_opponent" })
          .eq("id", existingGame.id);

        if (statusUpdateError) throw statusUpdateError;

        const leader = await getOrCreateLeaderMember(team2.id, trimmedMemberName);

        saveSession({
          gameId: existingGame.id,
          teamId: team2.id,
          teamName: team2.name,
          memberId: leader.id,
          memberName: leader.name,
        });
      }

      router.push("/team");
    } catch (err: any) {
      setError(err?.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
                LEADER MODE
              </span>
              <span className="rounded-full bg-[linear-gradient(90deg,#f59e0b_0%,#f97316_50%,#ec4899_100%)] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white shadow">
                CREATE / JOIN
              </span>
            </div>

            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              대표 시작
              <br />
              <span className="text-[#ffe89a]">Book Bingo Setup</span>
            </h1>

            <p className="mt-4 max-w-2xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
              게임 이름을 입력하면 새 게임을 생성하거나, 같은 이름의 기존 대기 게임에
              대표로 참가합니다. 첫 번째 대표는 게임과 1팀을 만들고, 두 번째 대표는
              같은 게임에 합류해 2팀을 생성합니다.
            </p>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                STEP 1
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                게임 이름 입력
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                처음이면 새 게임이 생성되고, 이미 존재하면 해당 게임에 대표로 참가합니다.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                STEP 2
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                팀 / 대표 등록
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                팀 이름과 대표 이름을 등록하면 세션이 저장되고 팀 화면으로 이동합니다.
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_12px_28px_rgba(73,52,24,0.08)] md:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                LEADER FORM
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#241913]">
                게임 생성 / 참가 정보 입력
              </h2>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                같은 게임 이름으로 두 번째 대표가 들어오면 자동으로 상대 팀이 생성됩니다.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#4d3a28]">
                  게임 이름
                </label>
                <input
                  type="text"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full rounded-2xl border border-[#d9cab1] bg-white px-4 py-3 text-[#241913] outline-none placeholder:text-[#a08d78] focus:border-[#9f7a49] focus:ring-2 focus:ring-[#ead8b8]"
                  placeholder="예: AKIS 책 읽기 빙고"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#4d3a28]">
                  팀 이름
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full rounded-2xl border border-[#d9cab1] bg-white px-4 py-3 text-[#241913] outline-none placeholder:text-[#a08d78] focus:border-[#9f7a49] focus:ring-2 focus:ring-[#ead8b8]"
                  placeholder="예: 1팀"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#4d3a28]">
                  본인 이름
                </label>
                <input
                  type="text"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full rounded-2xl border border-[#d9cab1] bg-white px-4 py-3 text-[#241913] outline-none placeholder:text-[#a08d78] focus:border-[#9f7a49] focus:ring-2 focus:ring-[#ead8b8]"
                  placeholder="예: 홍길동"
                />
              </div>

              <button
                type="button"
                onClick={handleStart}
                disabled={loading}
                className="w-full rounded-[22px] bg-[linear-gradient(135deg,#2f2219_0%,#4a3429_55%,#7b3f56_100%)] px-5 py-4 text-base font-black text-white shadow-[0_14px_28px_rgba(73,52,24,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(73,52,24,0.24)] disabled:opacity-50"
              >
                {loading ? "처리 중..." : "게임 시작 / 참가하기"}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-[22px] border border-red-200 bg-[linear-gradient(180deg,#fff5f5_0%,#ffecec_100%)] px-5 py-4 text-sm font-bold text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-2xl border border-[#d7c8b0] bg-white px-5 py-3 text-sm font-black text-[#4d3a28] shadow-sm transition hover:bg-[#fff8ec]"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}