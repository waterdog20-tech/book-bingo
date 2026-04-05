"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Team = {
  id: string;
  name: string;
  team_code: string;
  game_id: string;
};

type BingoCell = {
  id: string;
  row_no: number;
  col_no: number;
  title: string;
};

type TeamCellCheck = {
  team_id: string;
  cell_id: string;
  checked: boolean;
};

type Game = {
  id: string;
  name: string;
  status: string;
  winner_team: string | null;
};

type TeamSummary = {
  id: string;
  name: string;
  team_code: string;
  checkedCount: number;
  bingoCount: number;
};

function calcBingoCount(
  cells: BingoCell[],
  checks: TeamCellCheck[],
  teamId: string
): number {
  const teamCheckedSet = new Set<string>();

  checks.forEach((item) => {
    if (item.team_id === teamId && item.checked) {
      teamCheckedSet.add(item.cell_id);
    }
  });

  const posMap = new Map<string, boolean>();

  cells.forEach((cell) => {
    const isFree = cell.row_no === 3 && cell.col_no === 3;
    posMap.set(`${cell.row_no}-${cell.col_no}`, isFree || teamCheckedSet.has(cell.id));
  });

  let count = 0;

  for (let row = 1; row <= 5; row++) {
    let ok = true;
    for (let col = 1; col <= 5; col++) {
      if (!posMap.get(`${row}-${col}`)) {
        ok = false;
        break;
      }
    }
    if (ok) count++;
  }

  for (let col = 1; col <= 5; col++) {
    let ok = true;
    for (let row = 1; row <= 5; row++) {
      if (!posMap.get(`${row}-${col}`)) {
        ok = false;
        break;
      }
    }
    if (ok) count++;
  }

  let diag1 = true;
  for (let i = 1; i <= 5; i++) {
    if (!posMap.get(`${i}-${i}`)) {
      diag1 = false;
      break;
    }
  }
  if (diag1) count++;

  let diag2 = true;
  for (let i = 1; i <= 5; i++) {
    if (!posMap.get(`${i}-${6 - i}`)) {
      diag2 = false;
      break;
    }
  }
  if (diag2) count++;

  return count;
}

export default function AdminPage() {
  const [game, setGame] = useState<Game | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [cells, setCells] = useState<BingoCell[]>([]);
  const [checks, setChecks] = useState<TeamCellCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingWinnerId, setSavingWinnerId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleFinishGame = async (winnerTeamId: string) => {
  if (!game?.id) {
    setError("게임 정보가 없습니다.");
    return;
  }

  setSavingWinnerId(winnerTeamId);

  const { error } = await supabase
    .from("games")
    .update({
      status: "finished",
      winner_team: winnerTeamId,
    })
    .eq("id", game.id);

  if (error) {
    console.error("finish game error:", error);
    setError(`게임 종료에 실패했습니다. ${error.message}`);
    setSavingWinnerId(null);
    return;
  }

  setGame((prev) =>
    prev
      ? {
          ...prev,
          status: "finished",
          winner_team: winnerTeamId,
        }
      : prev
  );

  setError("");
  setSavingWinnerId(null);
  alert("게임이 종료되었습니다.");
};

  const gameId = "c95466dc-34e4-47b4-8179-ed78fd31b32a";

  async function loadAll() {
    setLoading(true);
    setError("");

    const { data: gameData, error: gameError } = await supabase
      .from("games")
      .select("id, name, status, winner_team")
      .eq("id", gameId)
      .maybeSingle();

    if (gameError) {
      setError("게임 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    const { data: teamData, error: teamError } = await supabase
      .from("teams")
      .select("id, name, team_code, game_id")
      .eq("game_id", gameId)
      .order("name", { ascending: true });

    if (teamError) {
      setError("팀 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    const { data: cellData, error: cellError } = await supabase
      .from("bingo_cells")
      .select("id, row_no, col_no, title")
      .eq("game_id", gameId)
      .order("row_no", { ascending: true })
      .order("col_no", { ascending: true });

    if (cellError) {
      setError("빙고 칸 정보를 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    const teamIds = (teamData || []).map((team) => team.id);

    let checkData: TeamCellCheck[] = [];

    if (teamIds.length > 0) {
      const { data, error: checkError } = await supabase
        .from("team_cell_checks")
        .select("team_id, cell_id, checked")
        .in("team_id", teamIds);

      if (checkError) {
        setError("체크 정보를 불러오지 못했습니다.");
        setLoading(false);
        return;
      }

      checkData = (data as TeamCellCheck[]) || [];
    }

    setGame((gameData as Game) || null);
    setTeams((teamData as Team[]) || []);
    setCells((cellData as BingoCell[]) || []);
    setChecks(checkData);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  const summaries = useMemo<TeamSummary[]>(() => {
    return teams
      .map((team) => {
        const checkedSet = new Set<string>();

        checks.forEach((item) => {
          if (item.team_id === team.id && item.checked) {
            checkedSet.add(item.cell_id);
          }
        });

        const checkedCount = cells.filter((cell) => {
          const isFree = cell.row_no === 3 && cell.col_no === 3;
          return isFree || checkedSet.has(cell.id);
        }).length;

        const bingoCount = calcBingoCount(cells, checks, team.id);

        return {
          id: team.id,
          name: team.name,
          team_code: team.team_code,
          checkedCount,
          bingoCount,
        };
      })
      .sort((a, b) => {
        if (b.bingoCount !== a.bingoCount) return b.bingoCount - a.bingoCount;
        return b.checkedCount - a.checkedCount;
      });
  }, [teams, cells, checks]);

  async function setWinner(teamId: string) {
    setSavingWinnerId(teamId);
    setError("");

    const { error } = await supabase
      .from("games")
      .update({
  winner_team: teamId,
  status: "ongoing",
})
      .eq("id", gameId);

   if (error) {
  console.error("winner update error:", error);
  setError(`우승팀 저장에 실패했습니다. ${error.message}`);
  setSavingWinnerId(null);
  return;
}

    await loadAll();
    setSavingWinnerId(null);
  }

  async function resetWinner() {
    setSavingWinnerId("reset");
    setError("");

    const { error } = await supabase
      .from("games")
      .update({
        winner_team: null,
        status: "ongoing",
      })
      .eq("id", gameId);

    if (error) {
      setError("우승팀 초기화에 실패했습니다.");
      setSavingWinnerId(null);
      return;
    }

    await loadAll();
    setSavingWinnerId(null);
  }

  const winnerName =
    summaries.find((team) => team.id === game?.winner_team)?.name || "";

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">운영자 현황판</h1>
            <p className="mt-2 text-sm text-slate-600">
              전체 팀의 빙고 진행 상황을 확인합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAll}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            새로고침
          </button>
        </div>

        {game?.status === "finished" && (
      <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        게임이 종료되었습니다.
        {winnerName ? ` 우승팀: ${winnerName}` : ""}
      </div>
    )}

    {game && (
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        ...
      </div>
    )}

        {game && (
          <div className="mb-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">게임명</p>
              <p className="mt-1 font-semibold">{game.name}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">상태</p>
              <p className="mt-1 font-semibold">{game.status}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">우승팀</p>
              <p className="mt-1 font-semibold">
                {winnerName || "아직 없음"}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">불러오는 중...</p>
        ) : summaries.length === 0 ? (
          <p className="text-slate-500">표시할 팀이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse overflow-hidden rounded-xl">
              <thead>
                <tr className="bg-slate-100 text-left">
                  <th className="px-4 py-3">순위</th>
                  <th className="px-4 py-3">팀명</th>
                  <th className="px-4 py-3">팀 코드</th>
                  <th className="px-4 py-3">체크 수</th>
                  <th className="px-4 py-3">빙고 수</th>
                  <th className="px-4 py-3">우승 처리</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((team, index) => {
                  const isWinner = game?.winner_team === team.id;

                  return (
                    <tr key={team.id} className="border-b border-slate-200">
                      <td className="px-4 py-3 font-semibold">{index + 1}</td>
                      <td className="px-4 py-3">{team.name}</td>
                      <td className="px-4 py-3">{team.team_code}</td>
                      <td className="px-4 py-3">{team.checkedCount}</td>
                      <td className="px-4 py-3">{team.bingoCount}</td>
                      <td className="px-4 py-3">
                        {isWinner ? (
                          <span className="rounded-md bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                            우승팀
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleFinishGame(team.id)}
                            disabled={savingWinnerId !== null || game?.status === "finished"}
                            className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                          >
                            {savingWinnerId === team.id ? "저장 중..." : "우승 지정"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4">
              <button
                type="button"
                onClick={resetWinner}
                disabled={savingWinnerId !== null}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm disabled:opacity-50"
              >
                {savingWinnerId === "reset" ? "초기화 중..." : "우승 초기화"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}