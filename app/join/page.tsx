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

export default function JoinPage() {
  const router = useRouter();

  const [gameName, setGameName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveSession = ({
    gameId,
    teamId,
    teamName,
    memberId,
    memberName,
    isLeader,
  }: {
    gameId: string;
    teamId: string;
    teamName: string;
    memberId: string;
    memberName: string;
    isLeader: boolean;
  }) => {
    localStorage.setItem("game_id", gameId);
    localStorage.setItem("team_id", teamId);
    localStorage.setItem("team_name", teamName);
    localStorage.setItem("member_id", memberId);
    localStorage.setItem("member_name", memberName);
    localStorage.setItem("is_leader", String(isLeader));
  };

  const getOrCreateMember = async (
    teamId: string,
    memberName: string
  ): Promise<MemberRow> => {
    const trimmedName = memberName.trim();

    const { data: existingMember, error: existingError } = await supabase
      .from("team_members")
      .select("id, team_id, name, is_leader")
      .eq("team_id", teamId)
      .eq("name", trimmedName)
      .maybeSingle();

    if (existingError) {
      throw new Error(`팀원 조회 실패: ${existingError.message}`);
    }

    if (existingMember) {
      return existingMember as MemberRow;
    }

    const { data: newMember, error: insertError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        name: trimmedName,
        is_leader: false,
      })
      .select("id, team_id, name, is_leader")
      .single();

    if (insertError || !newMember) {
      throw new Error(
        `팀원 생성 실패: ${insertError?.message ?? "알 수 없는 오류"}`
      );
    }

    return newMember as MemberRow;
  };

  const handleJoin = async () => {
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

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, name, status, winner_team_id")
        .eq("name", trimmedGameName)
        .maybeSingle();

      if (gameError) throw new Error(`게임 조회 실패: ${gameError.message}`);
      if (!game) throw new Error("해당 게임 이름의 게임을 찾을 수 없습니다.");

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, game_id, name, team_order")
        .eq("game_id", game.id)
        .eq("name", trimmedTeamName)
        .maybeSingle();

      if (teamError) throw new Error(`팀 조회 실패: ${teamError.message}`);
      if (!team) throw new Error("해당 팀 이름을 찾을 수 없습니다.");

      const { data: allTeams, error: allTeamsError } = await supabase
        .from("teams")
        .select("id")
        .eq("game_id", game.id);

      if (allTeamsError) {
        throw new Error(`팀 목록 조회 실패: ${allTeamsError.message}`);
      }

      if (allTeams && allTeams.length > 0) {
        const allTeamIds = allTeams.map((t) => t.id);

        const { data: existingMemberCheck, error: memberCheckError } =
          await supabase
            .from("team_members")
            .select("id, team_id, teams(name)")
            .in("team_id", allTeamIds)
            .eq("name", trimmedMemberName)
            .maybeSingle();

        if (memberCheckError) {
          throw new Error(`중복 참가 확인 실패: ${memberCheckError.message}`);
        }

        if (existingMemberCheck && existingMemberCheck.team_id !== team.id) {
          const joinedTeamName =
            (existingMemberCheck.teams as any)?.name || "다른 팀";
          throw new Error(
            `'${trimmedMemberName}'님은 이미 '${joinedTeamName}'에 소속되어 있습니다. 본인의 팀 이름을 다시 확인해주세요.`
          );
        }
      }

      const member = await getOrCreateMember(team.id, trimmedMemberName);

      saveSession({
        gameId: game.id,
        teamId: team.id,
        teamName: team.name,
        memberId: member.id,
        memberName: member.name,
        isLeader: member.is_leader,
      });

      router.push("/team");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "팀 참가 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6efe4] p-4 md:p-6">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,248,220,0.92),rgba(246,239,228,0.96)_35%,rgba(235,224,205,0.98)_70%,rgba(226,211,188,1)_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(120,96,64,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(120,96,64,0.28)_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-[#e7dcc8] bg-[#fffaf2] shadow-[0_18px_50px_rgba(73,52,24,0.12)]">
        <div className="relative border-b border-[#e7dcc8] bg-[linear-gradient(135deg,#2b211b_0%,#4a3429_52%,#5b3f8f_100%)] px-6 py-7 text-white md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.12),transparent_28%)]" />

          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-yellow-200/30 bg-yellow-300/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-yellow-100">
                DADOKDADOK BOOK CLUB
              </span>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-white/90">
                MEMBER MODE
              </span>
              <span className="rounded-full bg-[linear-gradient(90deg,#7c3aed_0%,#a855f7_55%,#ec4899_100%)] px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white shadow">
                JOIN TEAM
              </span>
            </div>

            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              팀원 참가
              <br />
              <span className="text-[#ffe89a]">Book Bingo Join</span>
            </h1>

            <p className="mt-4 max-w-2xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
              게임 이름, 팀 이름, 본인 이름으로 참가합니다. 이미 등록된 이름이면 그대로
              다시 입장하고, 다른 팀에 이미 소속된 이름은 중복 참가가 제한됩니다.
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
                게임 / 팀 확인
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                참가할 게임 이름과 내 팀 이름을 정확히 입력하면 해당 팀으로 접속합니다.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                STEP 2
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                이름으로 재입장
              </p>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                같은 팀에 이미 등록된 이름이면 새로 만들지 않고 기존 멤버로 다시
                입장합니다.
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_12px_28px_rgba(73,52,24,0.08)] md:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                MEMBER FORM
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#241913]">
                팀원 참가 정보 입력
              </h2>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                게임 이름과 팀 이름이 정확해야 참가할 수 있습니다. 다른 팀에 같은
                이름으로 이미 등록되어 있으면 참가가 제한됩니다.
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
                onClick={handleJoin}
                disabled={loading}
                className="w-full rounded-[22px] bg-[linear-gradient(135deg,#4b2f74_0%,#6d46a5_55%,#c026d3_100%)] px-5 py-4 text-base font-black text-white shadow-[0_14px_28px_rgba(91,63,143,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(91,63,143,0.26)] disabled:opacity-50"
              >
                {loading ? "참가 중..." : "팀원으로 참가"}
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