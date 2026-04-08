"use client";

<<<<<<< HEAD
import { useCallback, useEffect, useMemo, useState } from "react";
=======
import { useEffect, useState } from "react";
>>>>>>> d3f6470 (특정 파일만 반영)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type MemberRow = {
  id: string;
  team_id: string;
  name: string;
  is_leader: boolean;
};

<<<<<<< HEAD
type TeamStatusCard = {
  teamOrder: 1 | 2;
  teamName: string;
  team: TeamRow | null;
  members: MemberRow[];
};

const FIXED_GAME_NAME = "빙고";
const TEAM_OPTIONS = [
  { order: 1 as const, name: "1팀" },
  { order: 2 as const, name: "2팀" },
];
const OPPONENT_SLOT_NUMBERS = [1, 7, 13, 19, 25];
=======
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
  { left: "34%", size: 74, duration: 18, delay: 4, color: "from-[#f4d99f] to-[#f6ead0]" },
  { left: "46%", size: 52, duration: 14, delay: 2, color: "from-[#bcd9f7] to-[#d9ecfb]" },
  { left: "49%", size: 80, duration: 19, delay: 1, color: "from-[#E4d99f] to-[#g6ead0]" },
  { left: "44%", size: 40, duration: 16, delay: 7, color: "from-[#cdb9f5] to-[#e4d8fb]" },
  
];

const fireworks = [
  { top: "80%", left: "37%", delay: "0s", colors: ["#ff4e50", "#f9d423", "#ffffff"] },
 
  
];
>>>>>>> d3f6470 (특정 파일만 반영)

export default function JoinPage() {
  const router = useRouter();

<<<<<<< HEAD
  const [selectedTeamOrder, setSelectedTeamOrder] = useState<1 | 2 | null>(null);
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState("");
  const [teamStatusCards, setTeamStatusCards] = useState<TeamStatusCard[]>([
    { teamOrder: 1, teamName: "1팀", team: null, members: [] },
    { teamOrder: 2, teamName: "2팀", team: null, members: [] },
  ]);

  const selectedTeamName = useMemo(() => {
    if (selectedTeamOrder === 1) return "1팀";
    if (selectedTeamOrder === 2) return "2팀";
    return "";
  }, [selectedTeamOrder]);
=======
  const [teamName, setTeamName] = useState<"1팀" | "2팀" | "">("");
  const [memberName, setMemberName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const [team1Members, setTeam1Members] = useState<MemberRow[]>([]);
  const [team2Members, setTeam2Members] = useState<MemberRow[]>([]);
>>>>>>> d3f6470 (특정 파일만 반영)

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

<<<<<<< HEAD
  const sortMembersLeaderFirst = (members: MemberRow[]) => {
    return [...members].sort((a, b) => {
      if (a.is_leader === b.is_leader) {
        return a.name.localeCompare(b.name, "ko");
      }
      return a.is_leader ? -1 : 1;
    });
  };

  const createBoardCells = async (gameId: string, teamId: string) => {
    const cells = Array.from({ length: 25 }, (_, index) => {
      const cellNumber = index + 1;
      return {
        game_id: gameId,
        team_id: teamId,
        cell_number: cellNumber,
        opponent_slot: OPPONENT_SLOT_NUMBERS.includes(cellNumber) ? cellNumber : null,
        title: null,
        image_url: null,
        filled_by_team_id: null,
        filled_by_member_id: null,
        is_checked: false,
        checked_by_member_id: null,
        checked_by_member_name: null,
        checked_at: null,
      };
    });

    const { error } = await supabase.from("bingo_cells").insert(cells);
    if (error) {
      throw new Error(`빙고 칸 생성 실패: ${error.message}`);
    }
  };

  const ensureGame = async (): Promise<GameRow> => {
    const { data: existingGame, error: findError } = await supabase
      .from("games")
      .select("id, name, status, winner_team_id")
      .eq("name", FIXED_GAME_NAME)
      .maybeSingle();

    if (findError) {
      throw new Error(`게임 조회 실패: ${findError.message}`);
    }

    if (existingGame) {
      return existingGame as GameRow;
    }

    const { data: newGame, error: insertError } = await supabase
      .from("games")
      .insert({
        name: FIXED_GAME_NAME,
        status: "waiting",
        winner_team_id: null,
      })
      .select("id, name, status, winner_team_id")
      .single();

    if (insertError || !newGame) {
      throw new Error(`게임 생성 실패: ${insertError?.message ?? "알 수 없는 오류"}`);
    }

    return newGame as GameRow;
  };

  const ensureTeam = async (
    gameId: string,
    teamOrder: 1 | 2
  ): Promise<{ team: TeamRow; created: boolean }> => {
    const teamName = `${teamOrder}팀`;

    const { data: existingTeam, error: findError } = await supabase
      .from("teams")
      .select("id, game_id, name, team_order")
      .eq("game_id", gameId)
      .eq("team_order", teamOrder)
      .maybeSingle();

    if (findError) {
      throw new Error(`팀 조회 실패: ${findError.message}`);
    }

    if (existingTeam) {
      return { team: existingTeam as TeamRow, created: false };
    }

    const { data: newTeam, error: insertError } = await supabase
      .from("teams")
      .insert({
        game_id: gameId,
        name: teamName,
        team_order: teamOrder,
      })
      .select("id, game_id, name, team_order")
      .single();

    if (insertError || !newTeam) {
      throw new Error(`팀 생성 실패: ${insertError?.message ?? "알 수 없는 오류"}`);
    }

    await createBoardCells(gameId, newTeam.id);

    return { team: newTeam as TeamRow, created: true };
  };

  const getOrCreateMember = async (
    teamId: string,
    trimmedMemberName: string
  ): Promise<MemberRow> => {
    const { data: existingMember, error: existingError } = await supabase
      .from("team_members")
      .select("id, team_id, name, is_leader")
      .eq("team_id", teamId)
      .eq("name", trimmedMemberName)
      .maybeSingle();

    if (existingError) {
      throw new Error(`팀원 조회 실패: ${existingError.message}`);
    }

    if (existingMember) {
      return existingMember as MemberRow;
    }

    const { count: memberCount, error: countError } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    if (countError) {
      throw new Error(`팀 인원 수 조회 실패: ${countError.message}`);
    }

    const shouldBeLeader = (memberCount ?? 0) === 0;

    const { data: newMember, error: insertError } = await supabase
      .from("team_members")
      .insert({
        team_id: teamId,
        name: trimmedMemberName,
        is_leader: shouldBeLeader,
      })
      .select("id, team_id, name, is_leader")
      .single();

    if (insertError || !newMember) {
      throw new Error(`팀원 생성 실패: ${insertError?.message ?? "알 수 없는 오류"}`);
    }

    return newMember as MemberRow;
  };

  const syncGameStatusIfNeeded = async (gameId: string) => {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, game_id, name, team_order")
      .eq("game_id", gameId)
      .order("team_order", { ascending: true });

    if (teamsError) {
      throw new Error(`팀 상태 확인 실패: ${teamsError.message}`);
    }

    const teamRows = (teams || []) as TeamRow[];

    if (teamRows.length >= 2) {
      const { error: updateError } = await supabase
        .from("games")
        .update({ status: "setup_opponent" })
        .eq("id", gameId)
        .in("status", ["waiting"]);

      if (updateError) {
        throw new Error(`게임 상태 변경 실패: ${updateError.message}`);
      }
    } else {
      const { error: updateError } = await supabase
        .from("games")
        .update({ status: "waiting" })
        .eq("id", gameId)
        .in("status", ["waiting"]);

      if (updateError) {
        throw new Error(`게임 상태 유지 실패: ${updateError.message}`);
      }
    }
  };

  const loadTeamStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);

      const { data: game, error: gameError } = await supabase
        .from("games")
        .select("id, name, status, winner_team_id")
        .eq("name", FIXED_GAME_NAME)
        .maybeSingle();

      if (gameError) {
        throw new Error(`게임 현황 조회 실패: ${gameError.message}`);
      }

      if (!game) {
        setTeamStatusCards([
          { teamOrder: 1, teamName: "1팀", team: null, members: [] },
          { teamOrder: 2, teamName: "2팀", team: null, members: [] },
        ]);
=======
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
>>>>>>> d3f6470 (특정 파일만 반영)
        return;
      }

      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, game_id, name, team_order")
        .eq("game_id", game.id)
        .order("team_order", { ascending: true });

      if (teamsError) {
<<<<<<< HEAD
        throw new Error(`팀 현황 조회 실패: ${teamsError.message}`);
      }

      const teamRows = (teams || []) as TeamRow[];
      const teamIds = teamRows.map((team) => team.id);

      let memberRows: MemberRow[] = [];

      if (teamIds.length > 0) {
        const { data: members, error: membersError } = await supabase
          .from("team_members")
          .select("id, team_id, name, is_leader")
          .in("team_id", teamIds);

        if (membersError) {
          throw new Error(`팀원 현황 조회 실패: ${membersError.message}`);
        }

        memberRows = (members || []) as MemberRow[];
      }

      const cards: TeamStatusCard[] = TEAM_OPTIONS.map((option) => {
        const team = teamRows.find((item) => item.team_order === option.order) || null;
        const members = team
          ? sortMembersLeaderFirst(
              memberRows.filter((member) => member.team_id === team.id)
            )
          : [];

        return {
          teamOrder: option.order,
          teamName: option.name,
          team,
          members,
        };
      });

      setTeamStatusCards(cards);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadTeamStatus();
  }, [loadTeamStatus]);
=======
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
>>>>>>> d3f6470 (특정 파일만 반영)

  const handleJoin = async () => {
    setError("");

<<<<<<< HEAD
    const trimmedMemberName = memberName.trim();

    if (!selectedTeamOrder) {
      setError("참가할 팀을 선택해주세요.");
      return;
    }

    if (!trimmedMemberName) {
      setError("이름을 입력해주세요.");
=======
    const trimmedGameName = "빙고";
    const trimmedTeamName = teamName.trim();
    const trimmedMemberName = memberName.trim();

    if (!trimmedTeamName || !trimmedMemberName) {
      setError("팀과 본인 이름을 모두 입력해주세요.");
>>>>>>> d3f6470 (특정 파일만 반영)
      return;
    }

    try {
      setLoading(true);

<<<<<<< HEAD
      const game = await ensureGame();
      const { team } = await ensureTeam(game.id, selectedTeamOrder);

      const { data: allTeams, error: allTeamsError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("game_id", game.id);
=======
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
>>>>>>> d3f6470 (특정 파일만 반영)

      if (allTeamsError) {
        throw new Error(`팀 목록 조회 실패: ${allTeamsError.message}`);
      }

<<<<<<< HEAD
      const otherTeamIds = (allTeams || [])
        .filter((item) => item.id !== team.id)
        .map((item) => item.id);

      if (otherTeamIds.length > 0) {
        const { data: existingMemberInOtherTeam, error: duplicateError } =
          await supabase
            .from("team_members")
            .select("id, team_id, name")
            .in("team_id", otherTeamIds)
            .eq("name", trimmedMemberName)
            .maybeSingle();
=======
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
>>>>>>> d3f6470 (특정 파일만 반영)

        if (duplicateError) {
          throw new Error(`중복 참가 확인 실패: ${duplicateError.message}`);
        }

<<<<<<< HEAD
        if (existingMemberInOtherTeam) {
          throw new Error(
            `'${trimmedMemberName}'님은 이미 다른 팀에 참가 중입니다. 팀을 다시 확인해주세요.`
          );
=======
        if (existingMemberCheck) {
          const matchedTeamId = existingMemberCheck.team_id as string;

          if (team && matchedTeamId !== team.id) {
            const joinedTeamName =
              (existingMemberCheck.teams as { name?: string } | null)?.name || "다른 팀";
            throw new Error(
              `'${trimmedMemberName}'님은 이미 '${joinedTeamName}'에 소속되어 있습니다. 본인의 팀을 다시 확인해주세요.`
            );
          }
>>>>>>> d3f6470 (특정 파일만 반영)
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

      await syncGameStatusIfNeeded(game.id);

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
<<<<<<< HEAD
      setError(
        err instanceof Error ? err.message : "빙고 참가 중 오류가 발생했습니다."
      );
=======
      setError(err instanceof Error ? err.message : "빙고 참가 중 오류가 발생했습니다.");
>>>>>>> d3f6470 (특정 파일만 반영)
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

<<<<<<< HEAD
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[30px] border border-[#e7dcc8] bg-[#fffaf2] shadow-[0_18px_50px_rgba(73,52,24,0.12)]">
=======
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
>>>>>>> d3f6470 (특정 파일만 반영)
        <div className="relative border-b border-[#e7dcc8] bg-[linear-gradient(135deg,#2b211b_0%,#4a3429_52%,#5b3f8f_100%)] px-6 py-7 text-white md:px-8 md:py-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.12),transparent_28%)]" />

          <div className="relative z-10">
            <div className="mb-3 flex flex-wrap items-center gap-2">
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
              빙고 참가
              <br />
              <span className="text-[#ffe89a]">Book Bingo Entry</span>
            </h1>

<<<<<<< HEAD
            <p className="mt-4 max-w-3xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
              게임 이름은 자동으로 {FIXED_GAME_NAME}로 연결됩니다.
              팀을 선택하고 이름만 입력하면 참가할 수 있으며, 같은 팀의 첫 참가자는 자동으로 대표가 됩니다.
=======
            <p className="mt-4 max-w-2xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
              1팀 또는 2팀을 선택하고 이름을 입력하면 자동으로 참가됩니다.
              같은 팀의 첫 참가자는 대표가 되며, 이후 참가자는 팀원으로 자동 지정됩니다.
>>>>>>> d3f6470 (특정 파일만 반영)
            </p>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 md:px-8 md:py-8">
          <div className="grid gap-4 md:grid-cols-2">
<<<<<<< HEAD
            {teamStatusCards.map((card) => (
              <div
                key={card.teamOrder}
                className={`rounded-[24px] border p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)] ${
                  card.teamOrder === 1
                    ? "border-[#d7c8ef] bg-[linear-gradient(180deg,#fcf9ff_0%,#f1eaff_100%)]"
                    : "border-[#f0d2de] bg-[linear-gradient(180deg,#fff9fc_0%,#ffedf5_100%)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p
                      className={`text-[11px] font-black tracking-[0.16em] ${
                        card.teamOrder === 1 ? "text-[#7156a3]" : "text-[#b35a85]"
                      }`}
                    >
                      TEAM STATUS
                    </p>
                    <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                      {card.teamName}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[11px] font-black shadow ${
                      card.team
                        ? "bg-[#2f2219] text-[#f5d88a]"
                        : "bg-white text-[#8b6b39] ring-1 ring-[#eadfcf]"
                    }`}
                  >
                    {card.team ? "참가 중" : "대기 중"}
                  </span>
                </div>

                <div className="mt-4 rounded-[18px] border border-white/70 bg-white/80 p-4">
                  {loadingStatus ? (
                    <p className="text-sm font-semibold text-[#6b5848]">
                      팀원 현황을 불러오는 중입니다...
                    </p>
                  ) : card.members.length === 0 ? (
                    <p className="text-sm font-semibold text-[#6b5848]">
                      아직 참가한 팀원이 없습니다.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {card.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-[#eadfcf] bg-[#fffaf4] px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-[#241913]">
                              {member.name}
                            </p>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ${
                              member.is_leader
                                ? "bg-[linear-gradient(135deg,#2f2219_0%,#4a3429_100%)] text-[#f5d88a]"
                                : "bg-[#ece3d3] text-[#5c4531]"
                            }`}
                          >
                            {member.is_leader ? "대표" : "팀원"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
=======
            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                TEAM STATUS
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                1팀
              </p>
              <div className="mt-3 space-y-2">{renderTeamMembers(team1Members)}</div>
            </div>

            <div className="rounded-[24px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_10px_24px_rgba(73,52,24,0.07)]">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                TEAM STATUS
              </p>
              <p className="mt-3 text-2xl font-black leading-tight text-[#241913]">
                2팀
              </p>
              <div className="mt-3 space-y-2">{renderTeamMembers(team2Members)}</div>
            </div>
>>>>>>> d3f6470 (특정 파일만 반영)
          </div>

          <div className="rounded-[26px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-5 shadow-[0_12px_28px_rgba(73,52,24,0.08)] md:p-6">
            <div className="mb-5">
              <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                ENTRY FORM
              </p>
              <h2 className="mt-2 text-2xl font-black text-[#241913]">
<<<<<<< HEAD
                팀 선택 후 이름만 입력하세요
              </h2>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                게임 이름은 자동으로 {FIXED_GAME_NAME}에 연결됩니다.
                참가할 팀을 선택한 뒤 이름을 입력하면 바로 입장합니다.
=======
                빙고 참가 정보 입력
              </h2>
              <p className="mt-2 break-keep text-sm font-semibold leading-6 text-[#6b5848]">
                게임은 자동으로 ‘빙고’로 연결됩니다. 팀을 선택하고 이름을 입력하면 참가합니다.
>>>>>>> d3f6470 (특정 파일만 반영)
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-[#4d3a28]">
<<<<<<< HEAD
                  참가 팀 선택
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  {TEAM_OPTIONS.map((option) => {
                    const isActive = selectedTeamOrder === option.order;

                    return (
                      <button
                        key={option.order}
                        type="button"
                        onClick={() => setSelectedTeamOrder(option.order)}
                        className={`rounded-[22px] border px-5 py-4 text-left transition ${
                          isActive
                            ? option.order === 1
                              ? "border-[#7c62a6] bg-[linear-gradient(135deg,#f5f0ff_0%,#ede3ff_100%)] shadow-[0_10px_24px_rgba(124,98,166,0.18)]"
                              : "border-[#d36b99] bg-[linear-gradient(135deg,#fff1f7_0%,#ffe7f1_100%)] shadow-[0_10px_24px_rgba(211,107,153,0.18)]"
                            : "border-[#d9cab1] bg-white hover:bg-[#fff8ec]"
                        }`}
                      >
                        <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                          TEAM
                        </p>
                        <p className="mt-2 text-2xl font-black text-[#241913]">
                          {option.name}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-[#6b5848]">
                          {option.order === 1
                            ? "첫 번째 팀으로 참가합니다."
                            : "두 번째 팀으로 참가합니다."}
                        </p>
                      </button>
                    );
                  })}
=======
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
                    1팀
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
                    2팀
                  </button>
>>>>>>> d3f6470 (특정 파일만 반영)
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

              <div className="rounded-2xl border border-[#eadfcf] bg-white/90 px-4 py-3">
                <p className="text-sm font-semibold text-[#6b5848]">
                  선택한 팀:{" "}
                  <span className="font-black text-[#241913]">
                    {selectedTeamName || "선택 전"}
                  </span>
                </p>
                <p className="mt-1 text-sm font-semibold text-[#6b5848]">
                  연결 게임:{" "}
                  <span className="font-black text-[#241913]">{FIXED_GAME_NAME}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleJoin}
                disabled={loading}
                className="w-full rounded-[22px] bg-[linear-gradient(135deg,#4b2f74_0%,#6d46a5_55%,#c026d3_100%)] px-5 py-4 text-base font-black text-white shadow-[0_14px_28px_rgba(91,63,143,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(91,63,143,0.26)] disabled:opacity-50"
              >
<<<<<<< HEAD
                {loading ? "참가 처리 중..." : "빙고 참가"}
=======
                {loading ? "참가 중..." : "빙고 참가"}
>>>>>>> d3f6470 (특정 파일만 반영)
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

            <button
              type="button"
              onClick={loadTeamStatus}
              disabled={loadingStatus}
              className="rounded-2xl border border-[#d7c8b0] bg-white px-5 py-3 text-sm font-black text-[#4d3a28] shadow-sm transition hover:bg-[#fff8ec] disabled:opacity-50"
            >
              {loadingStatus ? "새로고침 중..." : "팀 현황 새로고침"}
            </button>
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