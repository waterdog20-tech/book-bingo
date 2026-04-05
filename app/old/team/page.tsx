"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Game = {
  id: string;
  name: string;
  status: "setup" | "playing" | "finished";
  winner_team: string | null;
};

type Team = {
  id: string;
  game_id: string;
  name: string;
  team_code: string;
};

type Book = {
  id: string;
  game_id: string;
  title: string;
};

type TeamBookCheck = {
  id: string;
  team_id: string;
  book_id: string;
  checked: boolean;
};

export default function TeamBingoPage() {
  const [loading, setLoading] = useState(true);
  const [savingBookId, setSavingBookId] = useState<string | null>(null);

  const [gameId, setGameId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamCode, setTeamCode] = useState("");

  const [game, setGame] = useState<Game | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const savedTeamId = localStorage.getItem("team_id") || "";
    const savedTeamName = localStorage.getItem("team_name") || "";
    const savedTeamCode = localStorage.getItem("team_code") || "";
    const savedGameId = localStorage.getItem("game_id") || "";

    setTeamId(savedTeamId);
    setTeamName(savedTeamName);
    setTeamCode(savedTeamCode);
    setGameId(savedGameId);
  }, []);

  const loadData = useCallback(async () => {
    if (!gameId || !teamId) {
      setLoading(false);
      setError("팀 정보가 없습니다. 처음부터 다시 입장해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, name, status, winner_team")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData as Game);

      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("id, game_id, name, team_code")
        .eq("id", teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData as Team);

      const { data: booksData, error: booksError } = await supabase
        .from("books")
        .select("id, game_id, title")
        .eq("game_id", gameId);

      if (booksError) throw booksError;
      setBooks((booksData || []) as Book[]);

      const { data: checksData, error: checksError } = await supabase
        .from("team_book_checks")
        .select("id, team_id, book_id, checked")
        .eq("team_id", teamId);

      if (checksError) throw checksError;

      const nextChecks: Record<string, boolean> = {};
      (checksData as TeamBookCheck[] | null)?.forEach((item) => {
        nextChecks[item.book_id] = item.checked;
      });

      setChecks(nextChecks);
    } catch (err: any) {
      const message =
        err?.message || err?.details || err?.hint || "데이터를 불러오지 못했습니다.";
      setError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  }, [gameId, teamId]);

  useEffect(() => {
    if (!gameId || !teamId) return;
    loadData();
  }, [gameId, teamId, loadData]);

  const handleToggleBook = async (bookId: string) => {
    if (!game || !team) return;

    if (game.status === "finished") {
      setError("종료된 게임은 더 이상 수정할 수 없습니다.");
      return;
    }

    setError("");
    setSavingBookId(bookId);

    const currentChecked = !!checks[bookId];
    const nextChecked = !currentChecked;

    const previousChecks = { ...checks };
    setChecks((prev) => ({
      ...prev,
      [bookId]: nextChecked,
    }));

    try {
      const { data: existingRow, error: existingError } = await supabase
        .from("team_book_checks")
        .select("id")
        .eq("team_id", team.id)
        .eq("book_id", bookId)
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRow?.id) {
        const { error: updateError } = await supabase
          .from("team_book_checks")
          .update({ checked: nextChecked })
          .eq("id", existingRow.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("team_book_checks")
          .insert({
            team_id: team.id,
            book_id: bookId,
            checked: nextChecked,
          });

        if (insertError) throw insertError;
      }
    } catch (err: any) {
      setChecks(previousChecks);
      setError(err?.message || "체크 저장 중 오류가 발생했습니다.");
    } finally {
      setSavingBookId(null);
    }
  };

  const bingoCount = useMemo(() => {
    const grid = Array.from({ length: 5 }, () => Array(5).fill(false));

    books.forEach((book, index) => {
      const row = Math.floor(index / 5);
      const col = index % 5;
      if (row < 5 && col < 5) {
        grid[row][col] = !!checks[book.id];
      }
    });

    let count = 0;

    for (let r = 0; r < 5; r++) {
      if (grid[r].every(Boolean)) count++;
    }

    for (let c = 0; c < 5; c++) {
      let ok = true;
      for (let r = 0; r < 5; r++) {
        if (!grid[r][c]) {
          ok = false;
          break;
        }
      }
      if (ok) count++;
    }

    let diagonal1 = true;
    let diagonal2 = true;

    for (let i = 0; i < 5; i++) {
      if (!grid[i][i]) diagonal1 = false;
      if (!grid[i][4 - i]) diagonal2 = false;
    }

    if (diagonal1) count++;
    if (diagonal2) count++;

    return count;
  }, [books, checks]);

  const checkedCount = useMemo(() => {
    return books.filter((book) => checks[book.id]).length;
  }, [books, checks]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
          <p className="text-sm text-slate-600">불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (!gameId || !teamId) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-4 text-2xl font-bold">팀 빙고판</h1>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            저장된 팀 정보가 없습니다. 팀 코드로 다시 입장해주세요.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
        <h1 className="mb-4 text-2xl font-bold">팀 빙고판</h1>

        <div className="mb-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">게임명</p>
            <p className="text-lg font-semibold">{game?.name || "-"}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">게임 상태</p>
            <p className="text-lg font-semibold">
              {game?.status === "setup" && "준비중"}
              {game?.status === "playing" && "진행중"}
              {game?.status === "finished" && "종료"}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">팀명</p>
            <p className="text-lg font-semibold">{team?.name || teamName || "-"}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">팀 코드</p>
            <p className="text-lg font-semibold">{team?.team_code || teamCode || "-"}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">체크 수</p>
            <p className="text-lg font-semibold">{checkedCount}</p>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">빙고 수</p>
            <p className="text-lg font-semibold">{bingoCount}</p>
          </div>
        </div>

        {game?.status === "finished" && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            게임이 종료되었습니다. 더 이상 책 체크를 수정할 수 없습니다.
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {books.map((book, index) => {
            const checked = !!checks[book.id];
            const disabled = game?.status === "finished" || savingBookId === book.id;
            const row = Math.floor(index / 5) + 1;
            const col = (index % 5) + 1;

            return (
              <button
                key={book.id}
                type="button"
                onClick={() => handleToggleBook(book.id)}
                disabled={disabled}
                className={`min-h-[180px] rounded-2xl border p-4 text-left transition ${
                  checked
                    ? "border-green-300 bg-green-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {row}-{col}
                  </span>
                  {checked && (
                    <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                      체크됨
                    </span>
                  )}
                </div>

                <h2 className="mb-2 text-base font-bold text-slate-900">
                  {book.title}
                </h2>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white"
          >
            새로고침
          </button>

          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("team_id");
              localStorage.removeItem("team_name");
              localStorage.removeItem("team_code");
              localStorage.removeItem("game_id");
              window.location.href = "/";
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700"
          >
            나가기
          </button>
        </div>
      </div>
    </main>
  );
}