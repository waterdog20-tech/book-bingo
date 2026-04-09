"use client";

import { useEffect, useState } from "react";
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
  name: string;
  status: "waiting" | "setup_opponent" | "setup_self" | "playing" | "finished";
  winner_team_id: string | null;
};

type TeamRow = {
  id: string;
  game_id: string;
  name: string;
  team_order: number;
};

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
  { top: "23%", left: "67%", delay: "0s", colors: ["#91e234", "#f9d423", "#ffffff"] }
];

const headerGradientStops = [
  { color: "#081435", stop: "0%" },
  { color: "#358ddf", stop: "55%" },
  { color: "#ffffff", stop: "100%" },
];

const headerGradientStyle = {
  backgroundImage: `linear-gradient(135deg, ${headerGradientStops
    .map((item) => `${item.color} ${item.stop}`)
    .join(", ")})`,
};

export default function JoinPage() {
  const router = useRouter();

  const [teamName, setTeamName] = useState<"1팀" | "2팀" | "">("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const [team1Members, setTeam1Members] = useState<MemberRow[]>([]);
  const [team2Members, setTeam2Members] = useState<MemberRow[]>([]);
    
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

  const createBoardCells = async (gameId: string, teamId: string) => {
    const cells = Array.from({ length: 25 }, (_, i) => ({
      game_id: gameId,
      team_id: teamId,
      cell_number: i + 1,
      title: "",
      image_url: null,
      is_checked: false,
      opponent_slot: null,
    }));

    const { error } = await supabase.from("bingo_cells").insert(cells);
    if (error) {
      throw new Error(`빙고판 초기화 실패: ${error.message}`);
    }
  };

  const loadTeamStatus = async () => {
    try {
      setLoadingTeams(true);

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, name")
        .eq("name", "빙고")
        .maybeSingle();

      if (gameError) {
        throw new Error(`팀 현황 조회 실패: ${gameError.message}`);
      }

      if (!game) {
        setTeam1Members([]);
        setTeam2Members([]);
        return;
      }

      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, game_id, name, team_order")
        .eq("game_id", game.id)
        .order("team_order", { ascending: true });

      if (teamsError) {
        throw new Error(`팀 목록 조회 실패: ${teamsError.message}`);
      }

      const allTeams = (teams || []) as TeamRow[];
      const team1 = allTeams.find((t) => t.name === "1팀") || null;
      const team2 = allTeams.find((t) => t.name === "2팀") || null;

      if (team1) {
        const { data: members1, error: members1Error } = await supabase
          .from("team_members")
          .select("id, team_id, name, is_leader")
          .eq("team_id", team1.id)
          .order("name", { ascending: true });

        if (members1Error) {
          throw new Error(`1팀 팀원 조회 실패: ${members1Error.message}`);
        }

        setTeam1Members((members1 || []) as MemberRow[]);
      } else {
        setTeam1Members([]);
      }

      if (team2) {
        const { data: members2, error: members2Error } = await supabase
          .from("team_members")
          .select("id, team_id, name, is_leader")
          .eq("team_id", team2.id)
          .order("name", { ascending: true });

        if (members2Error) {
          throw new Error(`2팀 팀원 조회 실패: ${members2Error.message}`);
        }

        setTeam2Members((members2 || []) as MemberRow[]);
      } else {
        setTeam2Members([]);
      }
    } catch (err) {
      console.error(err);
      setTeam1Members([]);
      setTeam2Members([]);
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    loadTeamStatus();
    setMounted(true);
  }, []);

  const handleJoin = async () => {
    setError("");

    const trimmedGameName = "빙고";
    const trimmedTeamName = teamName.trim();
    const trimmedMemberName = memberName.trim();

    if (!trimmedTeamName || !trimmedMemberName) {
      setError("팀과 본인 이름을 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      let game: GameRow | null = null;
      let team: TeamRow | null = null;
      let member: MemberRow | null = null;
      let isLeader = false;

      const { data: existingGame, error: gameError } = await supabase
        .from("games")
        .select("id, name, status, winner_team_id")
        .eq("name", trimmedGameName)
        .maybeSingle();

      if (gameError) {
        throw new Error(`게임 조회 실패: ${gameError.message}`);
      }

      if (existingGame) {
        game = existingGame as GameRow;
      } else {
        const { data: newGame, error: newGameError } = await supabase
          .from("games")
          .insert({
            name: trimmedGameName,
            status: "waiting",
            winner_team_id: null,
          })
          .select("id, name, status, winner_team_id")
          .single();

        if (newGameError || !newGame) {
          throw new Error(`게임 생성 실패: ${newGameError?.message ?? "알 수 없는 오류"}`);
        }

        game = newGame as GameRow;
      }

      const { data: allTeams, error: allTeamsError } = await supabase
        .from("teams")
        .select("id, game_id, name, team_order")
        .eq("game_id", game.id)
        .order("team_order", { ascending: true });

      if (allTeamsError) {
        throw new Error(`팀 목록 조회 실패: ${allTeamsError.message}`);
      }

      const existingTeams = (allTeams || []) as TeamRow[];
      team = existingTeams.find((t) => t.name === trimmedTeamName) || null;

      if (existingTeams.length > 0) {
        const allTeamIds = existingTeams.map((t) => t.id);

        const { data: existingMemberCheck, error: memberCheckError } = await supabase
          .from("team_members")
          .select("id, team_id, teams(name)")
          .in("team_id", allTeamIds)
          .eq("name", trimmedMemberName)
          .maybeSingle();

        if (memberCheckError) {
          throw new Error(`중복 참가 확인 실패: ${memberCheckError.message}`);
        }

        if (existingMemberCheck) {
          const matchedTeamId = existingMemberCheck.team_id as string;

          if (team && matchedTeamId !== team.id) {
            const joinedTeamName =
              (existingMemberCheck.teams as { name?: string } | null)?.name || "다른 팀";
            throw new Error(
              `'${trimmedMemberName}'님은 이미 '${joinedTeamName}'에 소속되어 있습니다. 본인의 팀을 다시 확인해주세요.`
            );
          }
        }
      }

      if (!team) {
        if (existingTeams.length >= 2) {
          throw new Error("이미 두 팀이 모두 참가한 게임입니다.");
        }

        const nextOrder =
          trimmedTeamName === "1팀" ? 1 : trimmedTeamName === "2팀" ? 2 : existingTeams.length + 1;

        const { data: newTeam, error: newTeamError } = await supabase
          .from("teams")
          .insert({
            game_id: game.id,
            name: trimmedTeamName,
            team_order: nextOrder,
          })
          .select("id, game_id, name, team_order")
          .single();

        if (newTeamError || !newTeam) {
          throw new Error(`팀 생성 실패: ${newTeamError?.message ?? "알 수 없는 오류"}`);
        }

        team = newTeam as TeamRow;
        isLeader = true;
        await createBoardCells(game.id, team.id);
      } else {
        const { data: existingLeader, error: leaderError } = await supabase
          .from("team_members")
          .select("id")
          .eq("team_id", team.id)
          .eq("is_leader", true)
          .maybeSingle();

        if (leaderError) {
          throw new Error(`대표 확인 실패: ${leaderError.message}`);
        }

        isLeader = !existingLeader;
      }

      const { data: existingMember, error: existingMemberError } = await supabase
        .from("team_members")
        .select("id, team_id, name, is_leader")
        .eq("team_id", team.id)
        .eq("name", trimmedMemberName)
        .maybeSingle();

      if (existingMemberError) {
        throw new Error(`팀원 조회 실패: ${existingMemberError.message}`);
      }

      if (existingMember) {
        member = existingMember as MemberRow;
        isLeader = member.is_leader;
      } else {
        const { data: newMember, error: memberInsertError } = await supabase
          .from("team_members")
          .insert({
            team_id: team.id,
            name: trimmedMemberName,
            is_leader: isLeader,
          })
          .select("id, team_id, name, is_leader")
          .single();

        if (memberInsertError || !newMember) {
          throw new Error(`팀원 생성 실패: ${memberInsertError?.message ?? "알 수 없는 오류"}`);
        }

        member = newMember as MemberRow;
        isLeader = member.is_leader;
      }

      const { data: latestTeams, error: latestTeamsError } = await supabase
        .from("teams")
        .select("id")
        .eq("game_id", game.id);

      if (latestTeamsError) {
        throw new Error(`팀 상태 확인 실패: ${latestTeamsError.message}`);
      }

      if ((latestTeams?.length || 0) >= 2 && game.status === "waiting") {
        const { error: updateStatusError } = await supabase
          .from("games")
          .update({ status: "setup_opponent" })
          .eq("id", game.id)
          .eq("status", "waiting");

        if (updateStatusError) {
          throw new Error(`게임 상태 변경 실패: ${updateStatusError.message}`);
        }
      }

      saveSession({
        gameId: game.id,
        teamId: team.id,
        teamName: team.name,
        memberId: member.id,
        memberName: member.name,
        isLeader,
      });

      await loadTeamStatus();
      router.push("/team");
    } catch (err) {
      setError(err instanceof Error ? err.message : "빙고 참가 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const renderTeamMembers = (members: MemberRow[]) => {
    if (loadingTeams) {
      return (
        <div className="rounded-2xl border border-dashed border-[#e4d6bf] bg-white/70 px-3 py-4 text-sm font-semibold text-[#9a866f]">
          불러오는 중...
        </div>
      );
    }

    if (members.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-[#e4d6bf] bg-white/70 px-3 py-4 text-sm font-semibold text-[#9a866f]">
          아직 참가자가 없습니다.
        </div>
      );
    }

    const sortedMembers = [...members].sort((a, b) => {
      if (a.is_leader === b.is_leader) return 0;
      return a.is_leader ? -1 : 1;
    });

    return sortedMembers.map((member) => (
      <div
        key={member.id}
        className="rounded-2xl border border-[#eadfcf] bg-white/90 px-3 py-2 text-sm font-semibold text-[#6b5848]"
      >
        {member.name}
        {member.is_leader && (
          <span className="ml-2 rounded-full bg-[#2f2219] px-2 py-0.5 text-[10px] font-black text-[#f5d88a]">
            대표
          </span>
        )}
      </div>
    ));
  };

  return (
    <main className="min-h-screen bg-[#f6efe4] p-4 md:p-6">
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

      {/* 배경 폭죽 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {mounted &&
          fireworks.map((fw, fwIdx) => (
            <div key={`fw-${fwIdx}`} className="absolute" style={{ top: fw.top, left: fw.left }}>
              {[...Array(12)].map((_, i) => {
                const angle = (i * 360) / 12;
                const tx = Math.cos((angle * Math.PI) / 180) * 70;
                const ty = Math.sin((angle * Math.PI) / 180) * 70;
                const color = fw.colors[i % fw.colors.length];

                return (
                  <div
                    key={i}
                    className="absolute h-2 w-2 rounded-full animate-firework-burst"
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 10px ${color}`,
                      ["--tx" as any]: `${tx}px`,
                      ["--ty" as any]: `${ty}px`,
                      animationDelay: fw.delay,
                    }}
                  />
                );
              })}
            </div>
          ))}
      </div>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-[30px] border border-[#e7dcc8] bg-[#fffaf2] shadow-[0_18px_50px_rgba(73,52,24,0.12)]">
        <div
  className="relative overflow-hidden border-b border-[#e7dcc8] px-6 py-6 text-white md:px-8 md:py-7"
  style={headerGradientStyle}
>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.12),transparent_28%)]" />

          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
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

            <p className="mt-4 max-w-2xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
              첫 참가자가 대표가 됩니다. 대표는 바로 우리팀의 빙고판을 만드는 설계자입니다.<br/>
			  어떤 책으로 판을 채울지, 어떤 전략으로 빙고를 완성할지, 모든 선택이 승부를 가릅니다. <br/>
			  우리 팀만의 빙고판을 완성하러 가보시죠~~ 
			  
            </p>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                TEAM STATUS
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                다(들)독(촉)해야 겨우 읽는팀
              </p>
              <div className="mt-3 space-y-2">{renderTeamMembers(team1Members)}</div>
            </div>

            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                TEAM STATUS
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                빛보다 빠른 속독의 달인팀
              </p>
              <div className="mt-3 space-y-2">{renderTeamMembers(team2Members)}</div>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_12px_28px_rgba(73,52,24,0.08)] md:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                ENTRY FORM
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#241913]">
                빙고 참가 정보 입력
              </h2>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                게임은 자동으로 ‘빙고’로 연결됩니다. 팀을 선택하고 이름을 입력하면 참가합니다.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#4d3a28]">
                  팀 선택
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTeamName("1팀")}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      teamName === "1팀"
                        ? "bg-[linear-gradient(135deg,#2f2219_0%,#4a3429_100%)] text-white shadow-[0_10px_20px_rgba(73,52,24,0.18)]"
                        : "border border-[#d9cab1] bg-white text-[#4d3a28] hover:bg-[#fff8ec]"
                    }`}
                  >
                    다(들)독(촉)해야 겨우 읽는팀
                  </button>

                  <button
                    type="button"
                    onClick={() => setTeamName("2팀")}
                    className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                      teamName === "2팀"
                        ? "bg-[linear-gradient(135deg,#2f2219_0%,#4a3429_100%)] text-white shadow-[0_10px_20px_rgba(73,52,24,0.18)]"
                        : "border border-[#d9cab1] bg-white text-[#4d3a28] hover:bg-[#fff8ec]"
                    }`}
                  >
                    빛보다 빠른 속독의 달인팀
                  </button>
                </div>
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
                {loading ? "참가 중..." : "빙고 참가"}
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

      <style jsx>{`
        .animate-balloon-rise {
          animation-name: balloonRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        .animate-firework-burst {
          animation: firework-burst 4s ease-out infinite;
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
      `}</style>
    </main>
  );
}