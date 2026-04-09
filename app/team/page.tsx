"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase";

type Game = {
  id: string;
  name: string;
  status: "waiting" | "setup_opponent" | "setup_self" | "playing" | "finished";
  winner_team_id: string | null;
};

type Team = {
  id: string;
  game_id: string;
  name: string;
  team_order: number;
};

type Member = {
  id: string;
  team_id: string;
  name: string;
  is_leader: boolean;
};

type BingoCell = {
  id: string;
  game_id: string;
  team_id: string;
  cell_number: number;
  opponent_slot: number | null;
  title: string | null;
  image_url: string | null;
  filled_by_team_id: string | null;
  filled_by_member_id: string | null;
  is_checked: boolean;
  checked_by_member_id: string | null;
  checked_by_member_name: string | null;
  checked_at: string | null;
};

const OPPONENT_SLOT_NUMBERS = [1, 7, 13, 19, 25];

const BINGO_LINES = [
  [1, 2, 3, 4, 5],
  [6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15],
  [16, 17, 18, 19, 20],
  [21, 22, 23, 24, 25],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [5, 10, 15, 20, 25],
  [1, 7, 13, 19, 25],
  [5, 9, 13, 17, 21],
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

function countBingos(cells: BingoCell[]) {
  const checked = new Set(
    cells.filter((cell) => cell.is_checked).map((cell) => cell.cell_number)
  );

  return BINGO_LINES.filter((line) => line.every((n) => checked.has(n))).length;
}

function getCompletedLines(cells: BingoCell[]) {
  const checked = new Set(
    cells.filter((cell) => cell.is_checked).map((cell) => cell.cell_number)
  );

  return BINGO_LINES.filter((line) => line.every((n) => checked.has(n)));
}
const STATUS_META: Record<
  Game["status"],
  {
    label: string;
    badge: string;
    description: string;
    accent: string;
  }
> = {
  waiting: {
    label: "팀 대기",
    badge: "READY",
    description: "다른 팀이 합류하면 1주년 북빙고가 시작됩니다.",
    accent: "from-slate-700 via-slate-800 to-slate-900",
  },
  setup_opponent: {
    label: "상대 팀 5권 선택",
    badge: "ROUND 1",
    description: "상대 팀 빙고판의 핵심 5칸을 정하는 단계입니다.",
    accent: "from-amber-500 via-orange-500 to-rose-500",
  },
  setup_self: {
    label: "우리 팀 보드 완성",
    badge: "ROUND 2",
    description: "우리 팀의 책 20권을 채워 빙고판을 완성합니다.",
    accent: "from-blue-600 via-indigo-600 to-violet-600",
  },
  playing: {
    label: "빙고 플레이",
    badge: "PLAY",
    description: "체크를 쌓아 3줄 완성 후 빙고를 선언하세요.",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  finished: {
    label: "결과 발표",
    badge: "FINISH",
    description: "우승 팀이 결정되었습니다. 결과를 확인해보세요.",
    accent: "from-fuchsia-600 via-pink-600 to-rose-600",
  },
};
export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showOpponentBoard, setShowOpponentBoard] = useState(false);

  const [gameId, setGameId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [memberId, setMemberId] = useState("");
  const [memberName, setMemberName] = useState("");
  const [isLeader, setIsLeader] = useState(false);

  const [game, setGame] = useState<Game | null>(null);
  const [myTeam, setMyTeam] = useState<Team | null>(null);
  const [opponentTeam, setOpponentTeam] = useState<Team | null>(null);
  const [member, setMember] = useState<Member | null>(null);

  const [myCells, setMyCells] = useState<BingoCell[]>([]);
  const [opponentCells, setOpponentCells] = useState<BingoCell[]>([]);

  const [formTitles, setFormTitles] = useState<Record<number, string>>({});
  const [formImages, setFormImages] = useState<Record<number, string>>({});

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [savingCellId, setSavingCellId] = useState<string | null>(null);
  const [bingoSubmitting, setBingoSubmitting] = useState(false);
  const [highlightedCellNumber, setHighlightedCellNumber] = useState<number | null>(null);
	
  const [showWinEffect, setShowWinEffect] = useState(false);
  const [showLoseEffect, setShowLoseEffect] = useState(false);
  const [resultChecked, setResultChecked] = useState(false);


  const [showLineEffect, setShowLineEffect] = useState(false);
  const [lineEffectCount, setLineEffectCount] = useState(0);

  const [confirmOpponentSave, setConfirmOpponentSave] = useState(false);
  const [opponentSaveSubmitted, setOpponentSaveSubmitted] = useState(false);

  const completedLines = useMemo(() => getCompletedLines(myCells), [myCells]);
  const bingoCount = useMemo(() => countBingos(myCells), [myCells]);

  const opponentCheckedCount = useMemo(
    () => opponentCells.filter((cell) => cell.is_checked).length,
    [opponentCells]
  );

  const opponentBingoCount = useMemo(
    () => countBingos(opponentCells),
    [opponentCells]
  );

  const isCellOnCompletedLine = (cellNumber: number) => {
    return completedLines.some((line) => line.includes(cellNumber));
  };

const getCellLineTypes = (cellNumber: number) => {
  const types = {
    horizontal: false,
    vertical: false,
    diagonalDown: false,
    diagonalUp: false,
  };

  completedLines.forEach((line) => {
    if (!line.includes(cellNumber)) return;

    const diff = line[1] - line[0];

    if (diff === 1) types.horizontal = true;
    else if (diff === 5) types.vertical = true;
    else if (diff === 6) types.diagonalDown = true;
    else if (diff === 4) types.diagonalUp = true;
  });

  return types;
};

  const isWinner =
    !!game?.winner_team_id && !!myTeam?.id && game.winner_team_id === myTeam.id;
 
  function runWinEffect() {
    setShowWinEffect(false);

    setTimeout(() => {
      setShowWinEffect(true);

      const duration = 4200;
      const end = Date.now() + duration;

      const frame = () => {
        // Multi-directional confettibursts
        confetti({
          particleCount: 20,
          angle: 60,
          spread: 80,
          startVelocity: 55,
          origin: { x: 0, y: 0.7 },
        });

        confetti({
          particleCount: 20,
          angle: 120,
          spread: 80,
          startVelocity: 55,
          origin: { x: 1, y: 0.7 },
        });

        confetti({
          particleCount: 28,
          spread: 120,
          startVelocity: 50,
          origin: { x: 0.5, y: 0.45 },
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      setTimeout(() => {
        setShowWinEffect(false);
      }, 4600);
    }, 50);
  }

  function runLoseEffect() {
    setShowLoseEffect(false);

    setTimeout(() => {
      setShowLoseEffect(true);

      // Extended duration for a longer-lasting storm
      setTimeout(() => {
        setShowLoseEffect(false);
      }, 6000); 
    }, 50);
  }

  function runLineEffect() {
    setShowLineEffect(true);

    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.35 },
    });

    setTimeout(() => {
      setShowLineEffect(false);
    }, 1400);
  }

  async function resizeImage(file: File): Promise<File> {
    const imageBitmap = await createImageBitmap(file);

    const maxSize = 1600;
    let { width, height } = imageBitmap;

    if (width > height) {
      if (width > maxSize) {
        height = Math.round((height * maxSize) / width);
        width = maxSize;
      }
    } else if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("이미지 처리용 캔버스를 생성하지 못했습니다.");
    }

    ctx.drawImage(imageBitmap, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.82);
    });

    if (!blob) {
      throw new Error("이미지 압축에 실패했습니다.");
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
    });
  }

  async function uploadImageCompressed(
    file: File,
    gameIdValue: string,
    teamIdValue: string
  ): Promise<string> {
    const compressedFile = await resizeImage(file);
    const fileName = `${gameIdValue}/${teamIdValue}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("bingo-images")
      .upload(fileName, compressedFile, {
        upsert: true,
        contentType: "image/jpeg",
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("bingo-images").getPublicUrl(fileName);
    return data.publicUrl;
  }

  useEffect(() => {
    const savedGameId = localStorage.getItem("game_id") || "";
    const savedTeamId = localStorage.getItem("team_id") || "";
    const savedMemberId = localStorage.getItem("member_id") || "";
    const savedMemberName = localStorage.getItem("member_name") || "";
    const savedIsLeader = localStorage.getItem("is_leader") === "true";

    setGameId(savedGameId);
    setTeamId(savedTeamId);
    setMemberId(savedMemberId);
    setMemberName(savedMemberName);
    setIsLeader(savedIsLeader);
  }, []);

const checkAndStartGame = async (gameId: string) => {
  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select("id")
    .eq("game_id", gameId);

  if (teamError || !teams || teams.length < 2) return;

  for (const team of teams) {
    const { count, error } = await supabase
      .from("bingo_cells")
      .select("*", { count: "exact", head: true })
      .eq("game_id", gameId)
      .eq("team_id", team.id)
      .not("title", "is", null);

    if (error || count !== 25) {
      return; // 하나라도 미완성 → 종료
    }
  }

  // 여기까지 왔으면 양 팀 모두 완료
  await supabase
    .from("games")
    .update({ status: "playing" })
    .eq("id", gameId)
    .neq("status", "playing");
};

  const loadData = useCallback(async () => {
    if (!gameId || !teamId || !memberId) {
      setLoading(false);
      setError("접속 정보가 없습니다. 처음부터 다시 접속해주세요.");
      return;
    }

    setError("");
    setMessage("");

    try {
      const { data: gameData, error: gameError } = await supabase
        .from("games")
        .select("id, name, status, winner_team_id")
        .eq("id", gameId)
        .single();

      if (gameError) throw gameError;
      setGame(gameData as Game);

      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, game_id, name, team_order")
        .eq("game_id", gameId)
        .order("team_order", { ascending: true });

      if (teamsError) throw teamsError;

      const allTeams = (teamsData || []) as Team[];
      const myTeamData = allTeams.find((t) => t.id === teamId) || null;
      const opponentTeamData = allTeams.find((t) => t.id !== teamId) || null;

      setMyTeam(myTeamData);
      setOpponentTeam(opponentTeamData);

      const { data: memberData, error: memberError } = await supabase
        .from("team_members")
        .select("id, team_id, name, is_leader")
        .eq("id", memberId)
        .single();

      if (memberError) throw memberError;
      setMember(memberData as Member);

      const { data: myCellsData, error: myCellsError } = await supabase
        .from("bingo_cells")
        .select(
          "id, game_id, team_id, cell_number, opponent_slot, title, image_url, filled_by_team_id, filled_by_member_id, is_checked, checked_by_member_id, checked_by_member_name, checked_at"
        )
        .eq("team_id", teamId)
        .order("cell_number", { ascending: true });

      if (myCellsError) throw myCellsError;
      setMyCells((myCellsData || []) as BingoCell[]);

      if (opponentTeamData) {
        const { data: opponentCellsData, error: opponentCellsError } = await supabase
          .from("bingo_cells")
          .select(
            "id, game_id, team_id, cell_number, opponent_slot, title, image_url, filled_by_team_id, filled_by_member_id, is_checked, checked_by_member_id, checked_by_member_name, checked_at"
          )
          .eq("team_id", opponentTeamData.id)
          .order("cell_number", { ascending: true });

        if (opponentCellsError) throw opponentCellsError;
        setOpponentCells((opponentCellsData || []) as BingoCell[]);
      } else {
        setOpponentCells([]);
      }
    } catch (err: any) {
      setError(err?.message || "데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [gameId, teamId, memberId]);

  useEffect(() => {
    if (!gameId || !teamId || !memberId) return;
    setLoading(true);
    loadData();
  }, [gameId, teamId, memberId, loadData]);

  useEffect(() => {
    if (game?.status === "setup_opponent" && opponentCells.length > 0) {
      const nextTitles: Record<number, string> = {};
      const nextImages: Record<number, string> = {};

      opponentCells.forEach((cell) => {
        if (OPPONENT_SLOT_NUMBERS.includes(cell.cell_number)) {
          nextTitles[cell.cell_number] = cell.title || "";
          nextImages[cell.cell_number] = cell.image_url || "";
        }
      });

      setFormTitles(nextTitles);
      setFormImages(nextImages);
    }
  }, [game?.status, opponentCells]);

useEffect(() => {
  if (game?.status !== "setup_opponent") {
    setOpponentSaveSubmitted(false);
    setConfirmOpponentSave(false);
    return;
  }

  if (!opponentCells.length || !myTeam) return;

  const myFilledCount = opponentCells.filter(
    (cell) =>
      OPPONENT_SLOT_NUMBERS.includes(cell.cell_number) &&
      cell.filled_by_team_id === myTeam.id &&
      !!cell.title &&
      cell.title.trim() !== ""
  ).length;

  if (myFilledCount === 5) {
    setOpponentSaveSubmitted(true);
  } else {
    setOpponentSaveSubmitted(false);
  }
}, [game?.status, opponentCells, myTeam]);

  useEffect(() => {
    if (game?.status === "setup_self" && myCells.length > 0) {
      const nextTitles: Record<number, string> = {};
      const nextImages: Record<number, string> = {};

      myCells.forEach((cell) => {
        if (!OPPONENT_SLOT_NUMBERS.includes(cell.cell_number)) {
          nextTitles[cell.cell_number] = cell.title || "";
          nextImages[cell.cell_number] = cell.image_url || "";
        }
      });

      setFormTitles(nextTitles);
      setFormImages(nextImages);
    }
  }, [game?.status, myCells]);

  useEffect(() => {
    if (game?.status !== "finished") {
      setResultChecked(false);
    }
  }, [game?.status]);

  useEffect(() => {
    if (game?.status !== "playing") {
      setLineEffectCount(0);
      return;
    }

    if (bingoCount > lineEffectCount && bingoCount >= 1) {
      runLineEffect();
      setLineEffectCount(bingoCount);
      return;
    }

    if (bingoCount < lineEffectCount) {
      setLineEffectCount(bingoCount);
    }
  }, [game?.status, bingoCount, lineEffectCount]);

  const opponentBoardReady = useMemo(() => {
    if (!opponentCells.length) return false;
    return OPPONENT_SLOT_NUMBERS.every((n) => {
      const cell = opponentCells.find((c) => c.cell_number === n);
      return !!cell?.title && cell.title.trim() !== "";
    });
  }, [opponentCells]);

  const myBoardReady = useMemo(() => {
    if (!myCells.length) return false;
    return myCells.every((cell) => !!cell.title && cell.title.trim() !== "");
  }, [myCells]);

  const mySelfBoardReady = useMemo(() => {
    if (!myCells.length) return false;

    return myCells
      .filter((cell) => !OPPONENT_SLOT_NUMBERS.includes(cell.cell_number))
      .every((cell) => !!cell.title && cell.title.trim() !== "");
  }, [myCells]);

  const opponentSelfBoardReady = useMemo(() => {
    if (!opponentCells.length) return false;

    return opponentCells
      .filter((cell) => !OPPONENT_SLOT_NUMBERS.includes(cell.cell_number))
      .every((cell) => !!cell.title && cell.title.trim() !== "");
  }, [opponentCells]);

  const displayStatus = useMemo(() => {
    if (!game) return null;

    if (game.status === "finished") return "finished";
    if (!opponentTeam) return "waiting";

    if (!opponentSaveSubmitted && game.status === "setup_opponent") {
      return "setup_opponent";
    }

    if (!mySelfBoardReady || !opponentSelfBoardReady) {
      return "setup_self";
    }

    return "playing";
  }, [
    game,
    opponentTeam,
    opponentSaveSubmitted,
    mySelfBoardReady,
    opponentSelfBoardReady,
  ]);
  
  const canBingo =
    displayStatus  === "playing" &&
    bingoCount >= 3 &&
    !bingoSubmitting &&
    !game?.winner_team_id;

 const statusMeta =
  game && displayStatus ? STATUS_META[displayStatus as Game["status"]] : null;

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  const saveOpponentSlots = async () => {
  if (!game || !myTeam || !opponentTeam || !member) return;

  for (const n of OPPONENT_SLOT_NUMBERS) {
    if (!formTitles[n]?.trim()) {
      setError(`${n}번 칸의 책 제목을 입력해주세요.`);
      return;
    }
  }

  setSaving(true);
  setError("");
  setMessage("");

  try {
    for (const n of OPPONENT_SLOT_NUMBERS) {
      const cell = opponentCells.find((c) => c.cell_number === n);
      if (!cell) {
        throw new Error(`상대팀 ${n}번 칸을 찾지 못했습니다.`);
      }

      const { error: updateError } = await supabase
        .from("bingo_cells")
        .update({
          title: formTitles[n].trim(),
          image_url: formImages[n]?.trim() || null,
          filled_by_team_id: myTeam.id,
          filled_by_member_id: member.id,
          opponent_slot: n,
        })
        .eq("id", cell.id);

      if (updateError) throw updateError;
    }

    const { error: rpcError } = await supabase.rpc(
      "mark_game_setup_self_if_ready",
      { p_game_id: game.id }
    );
    if (rpcError) throw rpcError;

    setConfirmOpponentSave(false);
    setOpponentSaveSubmitted(true);
    setMessage("상대팀 5칸 입력을 저장했습니다. 상대팀 입력 완료를 기다려주세요.");
    await loadData();
  } catch (err: any) {
    setError(err?.message || "상대팀 5칸 저장 중 오류가 발생했습니다.");
  } finally {
    setSaving(false);
  }
};

  const saveMySlots = async () => {
    if (!game || !myTeam || !member) return;

    const myNumbers = Array.from({ length: 25 }, (_, i) => i + 1).filter(
      (n) => !OPPONENT_SLOT_NUMBERS.includes(n)
    );

    for (const n of myNumbers) {
      if (!formTitles[n] || !formTitles[n].trim()) {
        setError(`${n}번 칸의 책 제목을 입력해주세요.`);
        return;
      }
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      for (const n of myNumbers) {
        const cell = myCells.find((c) => c.cell_number === n);
        if (!cell) {
          throw new Error(`내 보드 ${n}번 칸을 찾지 못했습니다.`);
        }

        const { error: updateError } = await supabase
          .from("bingo_cells")
          .update({
            title: formTitles[n].trim(),
            image_url: formImages[n]?.trim() || null,
            filled_by_team_id: myTeam.id,
            filled_by_member_id: member.id,
          })
          .eq("id", cell.id);

        if (updateError) throw updateError;
      }

      await checkAndStartGame(game.id);

      setMessage("내 팀 빙고판 20칸을 저장했습니다.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "내 팀 20칸 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckCell = async (cellId: string) => {
  if (
    !game ||
    !myTeam ||
    !member ||
    game.status !== "playing" ||
    savingCellId ||
    bingoSubmitting ||
    game.winner_team_id
  ) {
    return;
  }

const currentCell = myCells.find((c) => c.id === cellId);
if (!currentCell) return;

if (
  currentCell.is_checked &&
  currentCell.checked_by_member_id &&
  currentCell.checked_by_member_id !== member.id
) {
  setError("다른 팀원이 체크한 칸은 해제할 수 없습니다.");
  return;
}

  setError("");
  setSavingCellId(cellId);

  const nextChecked = !currentCell.is_checked;
  const checkedAt = nextChecked ? new Date().toISOString() : null;

  const previousCells = myCells;

  const optimisticCell: BingoCell = {
    ...currentCell,
    is_checked: nextChecked,
    checked_by_member_id: nextChecked ? member.id : null,
    checked_by_member_name: nextChecked ? member.name : null,
    checked_at: checkedAt,
  };

  setMyCells((prev) =>
    prev.map((item) => (item.id === cellId ? optimisticCell : item))
  );

  try {
    const { data, error: updateError } = await supabase
      .from("bingo_cells")
      .update({
        is_checked: nextChecked,
        checked_by_member_id: nextChecked ? member.id : null,
        checked_by_member_name: nextChecked ? member.name : null,
        checked_at: checkedAt,
      })
      .eq("id", cellId)
      .eq("team_id", myTeam.id)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    setMyCells((prev) =>
      prev.map((item) => (item.id === cellId ? (data as BingoCell) : item))
    );
  } catch (err: any) {
    setMyCells(previousCells);
    setError(`체크 저장에 실패했습니다. ${err?.message || "알 수 없는 오류"}`);
  } finally {
    setSavingCellId(null);
  }
};

  const handleBingo = async () => {
    if (!game || !myTeam || !member) return;

    if (game.status !== "playing") {
      setError("현재는 빙고를 선언할 수 없습니다.");
      return;
    }

    if (game.winner_team_id) {
      setError("이미 우승팀이 결정되었습니다.");
      return;
    }

    const latestBingoCount = countBingos(myCells);
    if (latestBingoCount < 3) {
      setError("빙고 3줄이 완성되어야 선언할 수 있습니다.");
      return;
    }

    setError("");
    setMessage("");
    setBingoSubmitting(true);

    try {
      const { error: finishError } = await supabase
        .from("games")
        .update({
          status: "finished",
          winner_team_id: myTeam.id,
        })
        .eq("id", game.id)
        .is("winner_team_id", null);

      if (finishError) throw finishError;

      setGame((prev) =>
        prev
          ? {
              ...prev,
              status: "finished",
              winner_team_id: myTeam.id,
            }
          : prev
      );

      setMessage("빙고를 선언했습니다. 결과 확인 버튼을 눌러 결과를 확인해주세요.");
    } catch (err: any) {
      setError(err?.message || "빙고 처리에 실패했습니다.");
    } finally {
      setBingoSubmitting(false);
    }
  };

  const handleShowResult = () => {
    if (!game || game.status !== "finished") return;
    setResultChecked(true);

    if (isWinner) {
      runWinEffect();
    } else {
      runLoseEffect();
    }
  };

  const renderCellPreview = (cell: BingoCell) => {
  const checked = cell.is_checked;
  const lineTypes = getCellLineTypes(cell.cell_number);
  const isOnCompletedLine =
    lineTypes.horizontal ||
    lineTypes.vertical ||
    lineTypes.diagonalDown ||
    lineTypes.diagonalUp;

  const checkedByOther =
    checked &&
    cell.checked_by_member_id &&
    member?.id &&
    cell.checked_by_member_id !== member.id;

  const isHighlighted = highlightedCellNumber === cell.cell_number;

  return (
    <div
      key={cell.id}
      id={`bingo-cell-${cell.cell_number}`}
      className={`group relative flex min-h-[430px] w-full flex-col overflow-hidden rounded-[24px] border-2 text-left transition-all duration-300 ${
        checked
          ? isOnCompletedLine
            ? "border-[#7a4b20] bg-[linear-gradient(180deg,#fff7ed_0%,#f6e1bf_55%,#ecd0a3_100%)] shadow-[0_18px_34px_rgba(140,82,39,0.24)]"
            : "border-[#10b981] bg-[linear-gradient(180deg,#f7fff9_0%,#eefbf3_100%)] shadow-[0_14px_28px_rgba(16,185,129,0.12)]"
          : "border-[#d7c6ab] bg-[linear-gradient(180deg,#fffdf9_0%,#fbf4e8_100%)] shadow-[0_10px_24px_rgba(73,52,24,0.08)]"
      } ${
        isHighlighted
          ? "ring-4 ring-[#ffcc66] ring-offset-4 ring-offset-[#f6efe4] scale-[1.015] animate-pulse"
          : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#6f4b2a_0%,#d1a157_50%,#6f4b2a_100%)]" />

      {checked && isOnCompletedLine && (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(255,212,140,0.18),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0%,transparent_28%,transparent_72%,rgba(255,233,192,0.14)_100%)]" />

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="rotate-[-16deg] text-5xl font-black tracking-[0.18em] text-[#8c5227]/10">
              BINGO
            </span>
          </div>
        </>
      )}

      <div className="relative z-20 flex items-center justify-between px-3 pb-2 pt-4">
        <div className="inline-flex items-center gap-2">
          <span className="rounded-full bg-[#2f2219] px-2.5 py-1 text-xs font-black text-[#f5d88a] shadow">
            #{cell.cell_number}
          </span>
          {isOnCompletedLine && (
            <span className="rounded-full bg-[#ffe08a] px-2.5 py-1 text-[11px] font-black text-[#3a2612] shadow">
              BINGO
            </span>
          )}
          {!!cell.opponent_slot && (
            <span className="rounded-full bg-[#fff3cd] px-2.5 py-1 text-[11px] font-black text-[#8b6b39] shadow">
              상대팀
            </span>
          )}
        </div>

        {checked ? (
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-black text-white shadow ${
              isOnCompletedLine
                ? "bg-[#8c5227]"
                : checkedByOther
                ? "bg-[#f97316]"
                : "bg-[#10b981]"
            }`}
          >
            {isOnCompletedLine ? "빙고" : checkedByOther ? "팀원 체크" : "완료"}
          </span>
        ) : (
          <span className="rounded-full bg-[#d9c6a2] px-3 py-1 text-[11px] font-black text-[#4c3625] shadow">
            READY
          </span>
        )}
      </div>

      <div
        className={`relative mx-3 overflow-hidden rounded-[20px] border-[4px] ${
          checked && isOnCompletedLine
            ? "border-[#8c5227] bg-[linear-gradient(180deg,#5a3a20_0%,#3e2818_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "border-[#122033] bg-[#03111f] shadow-[inset_0_0_0_1px_rgba(255,215,130,0.18)]"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 z-10 rounded-[16px] border ${
            checked && isOnCompletedLine ? "border-white/20" : "border-[#d8a654]/60"
          }`}
        />
        <div
          className={`pointer-events-none absolute left-3 right-3 top-3 z-10 h-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-3 left-3 right-3 z-10 h-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-3 top-3 left-3 z-10 w-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-3 top-3 right-3 z-10 w-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />

        <div className="aspect-[3/4] w-full">
          {cell.image_url ? (
            <img
              src={cell.image_url}
              alt={cell.title || `${cell.cell_number}번 책`}
              className={`h-full w-full object-cover ${
                checked && isOnCompletedLine
                  ? "brightness-[0.78] contrast-[0.9] saturate-[0.9]"
                  : checked
                  ? "brightness-[0.95]"
                  : ""
              }`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#243b55,#0b1320_70%)] px-6 text-center">
              <div>
                <div className="text-5xl">📘</div>
                <p className="mt-3 text-sm font-bold text-white/80">
                  책 이미지를 준비 중입니다
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 flex flex-1 flex-col px-3 pb-3 pt-3">
        <p className="line-clamp-2 min-h-[56px] text-[22px] font-black leading-tight text-[#241913]">
          {cell.title || "제목 없음"}
        </p>

        <div
          className={`mt-3 rounded-2xl border px-3 py-2 ${
            checked && isOnCompletedLine
              ? "border-[#ead3b2] bg-[linear-gradient(180deg,#fff8ef_0%,#f6ead8_100%)]"
              : checked
              ? "border-[#d8efe5] bg-[linear-gradient(180deg,#fcfffd_0%,#f2fbf6_100%)]"
              : "border-[#eadfcf] bg-white/90"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[#23324a]">BOOK CARD</span>
            {checked ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-black shadow ${
                  isOnCompletedLine
                    ? "bg-[#8c5227] text-white"
                    : "bg-[#10b981] text-white"
                }`}
              >
                {isOnCompletedLine ? "BINGO" : "CHECK"}
              </span>
            ) : (
              <span className="rounded-full bg-[#d9c6a2] px-3 py-1 text-xs font-black text-[#4c3625]">
                READY
              </span>
            )}
          </div>

          <div className="mt-3">
            {checked ? (
              <div
                className={`rounded-2xl border px-3 py-2 text-sm font-bold ${
                  isOnCompletedLine
                    ? "border-[#e4c89e] bg-[#fff5e8] text-[#7a4b20]"
                    : checkedByOther
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
              >
                {cell.checked_by_member_name
                  ? `${cell.checked_by_member_name} 님이 체크`
                  : "체크 완료"}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#e6d7c1] bg-[#faf5ec] px-3 py-2 text-sm font-semibold text-[#6c5947]">
                결과 카드
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
  const getMiniStatusTone = (cellNumber: number) => {
    const cell = myCells.find((item) => item.cell_number === cellNumber);
    if (!cell) {
      return "border-[#e6dac5] bg-[#f7f0e2] text-[#b7a78c]";
    }

    const checked = cell.is_checked;
    const lineTypes = getCellLineTypes(cell.cell_number);
    const isOnCompletedLine =
      lineTypes.horizontal ||
      lineTypes.vertical ||
      lineTypes.diagonalDown ||
      lineTypes.diagonalUp;

    if (checked && isOnCompletedLine) {
      return "border-[#7a4b20] bg-[linear-gradient(135deg,#8c5227_0%,#c8843b_100%)] text-white shadow-[0_8px_18px_rgba(140,82,39,0.35)]";
    }

    if (checked) {
      return "border-[#1f8a70] bg-[linear-gradient(135deg,#27a17f_0%,#42c59e_100%)] text-white shadow-[0_8px_18px_rgba(39,161,127,0.24)]";
    }

    return "border-[#d9c7a7] bg-[linear-gradient(135deg,#fffaf0_0%,#f3e5c9_100%)] text-[#7b5a32]";
  };

  const scrollToCell = (cellNumber: number) => {
  setHighlightedCellNumber(null);

  window.setTimeout(() => {
    setHighlightedCellNumber(cellNumber);

    const el = document.getElementById(`bingo-cell-${cellNumber}`);
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }

    window.setTimeout(() => {
      setHighlightedCellNumber((prev) => (prev === cellNumber ? null : prev));
    }, 1800);
  }, 40);
};

  const renderMiniStatusBoard = () => {
    const checkedCount = myCells.filter((cell) => cell.is_checked).length;

    return (
      <>
        {/* desktop */}
        <aside className="hidden 2xl:block">
  <div className="fixed right-4 top-3/4 z-30 -translate-y-1/3">
    <div className="w-[220px] overflow-hidden rounded-[24px] border border-[#dcc9a8] bg-[linear-gradient(180deg,#fffaf0_0%,#f7ead3_100%)] shadow-[0_18px_38px_rgba(73,52,24,0.18)]">
      <div className="border-b border-[#ead9bb] bg-[linear-gradient(90deg,#4a3429_0%,#6b4733_50%,#8a5a3f_100%)] px-4 py-3">
        <p className="text-[11px] font-black tracking-[0.18em] text-[#ffe08a]">
          MINI STATUS
        </p>
        <p className="mt-1 text-lg font-black text-white">미니 현황판</p>
      </div>

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((cellNumber) => (
            <button
              key={cellNumber}
              type="button"
              onClick={() => scrollToCell(cellNumber)}
              className={`flex aspect-square items-center justify-center rounded-[12px] border text-[12px] font-black transition hover:-translate-y-0.5 ${getMiniStatusTone(
                cellNumber
              )}`}
              title={`${cellNumber}번 칸으로 이동`}
            >
              {cellNumber}
            </button>
          ))}
        </div>

        <div className="space-y-2 rounded-[18px] border border-[#eadfcf] bg-white/90 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-black text-[#3a2a1b]">체크</span>
            <span className="font-black text-[#3a2a1b]">
              {myCells.filter((cell) => cell.is_checked).length} / 25
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="font-black text-[#3a2a1b]">빙고 줄</span>
            <span className="font-black text-[#3a2a1b]">{bingoCount}</span>
          </div>

          <div className="mt-3 space-y-2 text-[11px] font-bold text-[#6b5848]">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-[#d9c7a7] bg-[#f3e5c9]" />
              미체크
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-[#1f8a70] bg-[#42c59e]" />
              일반 체크
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full border border-[#7a4b20] bg-[#c8843b]" />
              빙고 완성칸
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</aside>

        {/* mobile / tablet */}
        <div className="xl:hidden">
          <div className="fixed bottom-4 right-4 z-30 w-[148px] overflow-hidden rounded-[20px] border border-[#dcc9a8] bg-[linear-gradient(180deg,#fffaf0_0%,#f7ead3_100%)] shadow-[0_16px_34px_rgba(73,52,24,0.18)]">
            <div className="border-b border-[#ead9bb] bg-[linear-gradient(90deg,#4a3429_0%,#6b4733_50%,#8a5a3f_100%)] px-3 py-2">
              <p className="text-[10px] font-black tracking-[0.18em] text-[#ffe08a]">
                MINI
              </p>
              <p className="text-sm font-black text-white">현황판</p>
            </div>

            <div className="p-2.5">
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 25 }, (_, i) => i + 1).map((cellNumber) => (
                  <button
                    key={cellNumber}
                    type="button"
                    onClick={() => scrollToCell(cellNumber)}
                    className={`flex aspect-square items-center justify-center rounded-[8px] border text-[10px] font-black ${getMiniStatusTone(
                      cellNumber
                    )}`}
                    title={`${cellNumber}번 칸으로 이동`}
                  >
                    {cellNumber}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between text-[10px] font-black text-[#3a2a1b]">
                <span>{myCells.filter((cell) => cell.is_checked).length}/25 체크</span>
                <span>{bingoCount}줄</span>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };
  const renderPlayableCell = (cell: BingoCell) => {
  const checked = cell.is_checked;
  const isSavingCell = savingCellId === cell.id;
  const lineTypes = getCellLineTypes(cell.cell_number);
  const isOnCompletedLine =
    lineTypes.horizontal ||
    lineTypes.vertical ||
    lineTypes.diagonalDown ||
    lineTypes.diagonalUp;

  const checkedByMe =
    checked && member?.id && cell.checked_by_member_id === member.id;
  const checkedByOther =
    checked &&
    cell.checked_by_member_id &&
    member?.id &&
    cell.checked_by_member_id !== member.id;

  const isHighlighted = highlightedCellNumber === cell.cell_number;

  return (
    <button
      key={cell.id}
      id={`bingo-cell-${cell.cell_number}`}
      type="button"
      onClick={() => handleCheckCell(cell.id)}
      disabled={
        displayStatus !== "playing" ||
        isSavingCell ||
        bingoSubmitting ||
        !!game?.winner_team_id
      }
      className={`group relative flex min-h-[430px] w-full flex-col overflow-hidden rounded-[24px] border-2 text-left transition-all duration-300 ${
        checked
          ? isOnCompletedLine
            ? "border-[2px] border-red-500 bg-[linear-gradient(180deg,#fff1f1_0%,#ffe4e4_52%,#ffdede_100%)] shadow-[0_18px_34px_rgba(239,68,68,0.28)]"
            : "border-[#10b981] ring-2 ring-[#86efac] bg-[linear-gradient(180deg,#f7fff9_0%,#eefbf3_100%)] shadow-[0_14px_28px_rgba(16,185,129,0.14)]"
          : "border-[#d7c6ab] bg-[linear-gradient(180deg,#fffdf9_0%,#fbf4e8_100%)] shadow-[0_10px_24px_rgba(73,52,24,0.08)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(73,52,24,0.14)]"
      } ${
        isHighlighted
          ? "ring-4 ring-[#ffcc66] ring-offset-4 ring-offset-[#f6efe4] scale-[1.015] animate-pulse"
          : ""
      } ${
        isSavingCell ? "opacity-70" : ""
      } ${
        displayStatus !== "playing" ||
        isSavingCell ||
        bingoSubmitting ||
        !!game?.winner_team_id
          ? "cursor-default"
          : "cursor-pointer"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[linear-gradient(90deg,#6f4b2a_0%,#d1a157_50%,#6f4b2a_100%)]" />

      {checked && isOnCompletedLine && (
        <>
          <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,rgba(255,120,120,0.14),transparent_62%)]" />
          <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,transparent_28%,transparent_72%,rgba(255,220,220,0.10)_100%)]" />

          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <span className="rotate-[-16deg] text-5xl font-black tracking-[0.18em] text-red-500/10">
              BINGO
            </span>
          </div>
        </>
      )}

      <div className="relative z-20 flex items-center justify-between px-3 pb-2 pt-4">
        <div className="inline-flex items-center gap-2">
          <span className="rounded-full bg-[#2f2219] px-2.5 py-1 text-xs font-black text-[#f5d88a] shadow">
            #{cell.cell_number}
          </span>
          {isOnCompletedLine && (
            <span className="rounded-full bg-[#ffe24a] px-2.5 py-1 text-[11px] font-black text-[#201300] shadow">
              BINGO
            </span>
          )}
        </div>

        {checked && (
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-black text-white shadow ${
              isOnCompletedLine
                ? "bg-[#5f5a54]"
                : checkedByOther
                ? "bg-[#f97316]"
                : "bg-[#10b981]"
            }`}
          >
            {isOnCompletedLine
              ? "빙고"
              : checkedByOther
              ? "팀원 체크"
              : "완료"}
          </span>
        )}
      </div>

      <div
        className={`relative mx-3 overflow-hidden rounded-[20px] border-[4px] ${
          checked && isOnCompletedLine
            ? "border-[#5f5a54] bg-[linear-gradient(180deg,#4b4742_0%,#3f3b37_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "border-[#122033] bg-[#03111f] shadow-[inset_0_0_0_1px_rgba(255,215,130,0.18)]"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-0 z-10 rounded-[16px] border ${
            checked && isOnCompletedLine ? "border-white/20" : "border-[#d8a654]/60"
          }`}
        />
        <div
          className={`pointer-events-none absolute left-3 right-3 top-3 z-10 h-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-3 left-3 right-3 z-10 h-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-3 top-3 left-3 z-10 w-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />
        <div
          className={`pointer-events-none absolute bottom-3 top-3 right-3 z-10 w-[2px] ${
            checked && isOnCompletedLine ? "bg-white/20" : "bg-[#d8a654]/80"
          }`}
        />

        <div className="aspect-[3/4] w-full">
          {cell.image_url ? (
            <img
              src={cell.image_url}
              alt={cell.title || `${cell.cell_number}번 책`}
              className={`h-full w-full object-cover transition duration-300 ${
                checked && isOnCompletedLine
                  ? "grayscale brightness-[0.72] contrast-[0.82]"
                  : ""
              } group-hover:scale-[1.02]`}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#243b55,#0b1320_70%)] px-6 text-center">
              <div>
                <div className="text-5xl">📘</div>
                <p className="mt-3 text-sm font-bold text-white/80">
                  책 이미지를 준비 중입니다
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 flex flex-1 flex-col px-3 pb-3 pt-3">
        <p className="line-clamp-2 min-h-[56px] text-[22px] font-black leading-tight text-[#241913]">
          {cell.title || "제목 없음"}
        </p>

        <div
          className={`mt-3 rounded-2xl border px-3 py-2 ${
            checked && isOnCompletedLine
              ? "border-[#d9d1c7] bg-[linear-gradient(180deg,#f3f1ed_0%,#eae6df_100%)]"
              : "border-[#eadfcf] bg-white/90"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-black text-[#23324a]">BOOK CARD</span>
            {checked ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-black shadow ${
                  isOnCompletedLine
                    ? "bg-[#5f5a54] text-white"
                    : "bg-[#10b981] text-white"
                }`}
              >
                {isOnCompletedLine ? "BINGO" : "CHECK"}
              </span>
            ) : (
              <span className="rounded-full bg-[#d9c6a2] px-3 py-1 text-xs font-black text-[#4c3625]">
                READY
              </span>
            )}
          </div>

          <div className="mt-3">
            {checked ? (
              <div
                className={`rounded-2xl border px-3 py-2 text-sm font-bold ${
                  checkedByOther
                    ? "border-orange-200 bg-orange-50 text-orange-700"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
              >
                {cell.checked_by_member_name
                  ? `${cell.checked_by_member_name} 님이 체크`
                  : "체크 완료"}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#e6d7c1] bg-[#faf5ec] px-3 py-2 text-sm font-semibold text-[#6c5947]">
                클릭해서 체크
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
const renderOpponentMiniBoard = () => {
  const checkedSet = new Set(
    opponentCells.filter((cell) => cell.is_checked).map((cell) => cell.cell_number)
  );

  const completedOpponentLines = getCompletedLines(opponentCells);

  const isOnOpponentCompletedLine = (cellNumber: number) => {
    return completedOpponentLines.some((line) => line.includes(cellNumber));
  };

  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 25 }, (_, i) => i + 1).map((cellNumber) => {
        const checked = checkedSet.has(cellNumber);
        const onLine = isOnOpponentCompletedLine(cellNumber);

        return (
          <div
            key={cellNumber}
            className={`flex aspect-square items-center justify-center rounded-[10px] border text-xs font-black ${
              checked
                ? onLine
                  ? "border-[#8c5227] bg-[linear-gradient(135deg,#c8843b_0%,#8c5227_100%)] text-white"
                  : "border-[#1f8a70] bg-[linear-gradient(135deg,#27a17f_0%,#42c59e_100%)] text-white"
                : "border-[#d9c7a7] bg-[linear-gradient(135deg,#fffaf0_0%,#f3e5c9_100%)] text-[#7b5a32]"
            }`}
          >
            {cellNumber}
          </div>
        );
      })}
    </div>
  );
};
  const renderEditableForm = (target: "opponent" | "self") => {
    const numbers =
      target === "opponent"
        ? OPPONENT_SLOT_NUMBERS
        : Array.from({ length: 25 }, (_, i) => i + 1).filter(
            (n) => !OPPONENT_SLOT_NUMBERS.includes(n)
          );

    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {numbers.map((n) => (
          <div key={n} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {n}번 칸
              </span>
              {target === "opponent" ? (
                <span className="text-xs font-medium text-amber-700">상대팀 보드</span>
              ) : (
                <span className="text-xs font-medium text-blue-700">내 팀 보드</span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  책 제목
                </label>
                <input
                  value={formTitles[n] || ""}
                  onChange={(e) =>
                    setFormTitles((prev) => ({
                      ...prev,
                      [n]: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-slate-500"
                  placeholder="책 제목 입력"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  이미지 업로드
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      setSaving(true);
                      setError("");

                      const publicUrl = await uploadImageCompressed(file, gameId, teamId);

                      setFormImages((prev) => ({
                        ...prev,
                        [n]: publicUrl,
                  }));
                    } catch (err: any) {
                      setError(err?.message || "이미지 업로드 중 오류가 발생했습니다.");
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-slate-700"
                />
              </div>

              <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {formImages[n] ? (
                  <img
                    src={formImages[n]}
                    alt={`${n}번 미리보기`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    이미지 미리보기
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 shadow">
          <p className="text-sm font-medium text-slate-700">불러오는 중입니다...</p>
        </div>
      </main>
    );
  }

  if (!gameId || !teamId || !memberId) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-4 text-2xl font-black text-slate-950">팀 화면</h1>
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            접속 정보가 없습니다. 처음 화면으로 돌아가 다시 접속해주세요.
         
        </div>
		</div>
      </main>
    );
  }
  return (
  <main className="min-h-screen bg-[#f6efe4] p-3 md:p-5">
    <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(255,248,220,0.92),rgba(246,239,228,0.96)_35%,rgba(235,224,205,0.98)_70%,rgba(226,211,188,1)_100%)]" />
    <div className="fixed inset-0 -z-10 opacity-[0.06] [background-image:linear-gradient(rgba(120,96,64,0.28)_1px,transparent_1px),linear-gradient(90deg,rgba(120,96,64,0.28)_1px,transparent_1px)] [background-size:24px_24px]" />

    <style
      dangerouslySetInnerHTML={{
        __html: `
          @keyframes thunderMarkGlow {
            0%, 100% { filter: drop-shadow(0 0 10px rgba(100,255,255,0.7)) brightness(1.1); opacity: 1; }
            50% { filter: drop-shadow(0 0 20px rgba(100,255,255,0.9)) brightness(1.3); opacity: 1; }
          }
          @keyframes heavyRain {
            0% { transform: translateY(-10vh) translateX(10vw) rotate(15deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh) translateX(-10vw) rotate(15deg); opacity: 0; }
          }
          @keyframes lightningStrike {
            0%, 100% { background-color: rgba(255,255,255,0); }
            2%, 8% { background-color: rgba(255,255,255,0.95); }
            5% { background-color: rgba(255,255,255,0); }
            10% { background-color: rgba(200,240,255,0.8); }
            12% { background-color: rgba(255,255,255,0); }
          }
          .animate-thunder-mark-glow { animation: thunderMarkGlow 2s infinite ease-in-out; }
          .animate-heavy-rain { animation: heavyRain 0.6s linear infinite; }
          .animate-lightning-strike { animation: lightningStrike 4s infinite; }
        `,
      }}
    />

    {showLineEffect && (
      <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center">
        <div className="rounded-3xl bg-white/95 px-8 py-6 text-center shadow-2xl ring-1 ring-emerald-200">
          <p className="text-4xl font-black text-emerald-600">✨ BINGO! ✨</p>
          <p className="mt-2 text-lg font-bold text-slate-900">한 줄이 완성되었습니다.</p>
        </div>
      </div>
    )}

    {showWinEffect && (
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="z-10 rounded-3xl bg-white/95 px-12 py-10 text-center shadow-2xl ring-4 ring-yellow-400">
          <p className="text-6xl font-black tracking-wide text-pink-600">🎉 WINNER 🎉</p>
          <p className="mt-4 text-2xl font-black text-slate-900">
            우리팀이 우승입니다! 우리가 독서왕이다.~ 🥳
          </p>
          <p className="mt-2 text-base font-bold text-slate-700">
            우리 팀이 가장 먼저 빙고를 완성했습니다.
          </p>
        </div>
      </div>
    )}

    {showLoseEffect && (
      <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-slate-900/90 backdrop-blur-md flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none opacity-80">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-[2px] h-[100px] bg-white/60 animate-heavy-rain"
              style={{
                left: `${Math.random() * 150 - 25}%`,
                animationDelay: `${Math.random()}s`,
                animationDuration: `${0.3 + Math.random() * 0.3}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 pointer-events-none flex flex-wrap justify-around items-center opacity-60">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="text-[100px] animate-thunder-mark-glow"
              style={{
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              ⚡
            </div>
          ))}
        </div>

        <div className="z-10 flex flex-col items-center">
          <div className="animate-lightning-strike px-16 py-12 text-center border-y-8 border-slate-300 bg-black/80 shadow-[0_0_100px_rgba(255,255,255,0.2)]">
            <p className="text-7xl font-black tracking-widest text-white">
              우리가 패배했어요. ㅠㅠ
            </p>
            <p className="mt-6 text-2xl font-bold text-slate-300">
              상대 팀이 먼저 빙고를 완성했습니다... 🌩️
            </p>
          </div>
        </div>
      </div>
    )}

    <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-[#e7dcc8] bg-[#fffaf2] shadow-[0_18px_50px_rgba(73,52,24,0.12)]">

      <div
  className="relative border-b border-[#e7dcc8] px-5 py-6 text-white md:px-8 md:py-7"
  style={headerGradientStyle}
>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,215,120,0.12),transparent_28%)]" />

  <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
    <div className="max-w-3xl">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-yellow-200/30 bg-yellow-300/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-yellow-100">
          DADOKDADOK BOOK CLUB
        </span>
        <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-black tracking-[0.18em] text-white/90">
          1ST ANNIVERSARY
        </span>
        {statusMeta && (
          <span
            className={`rounded-full bg-gradient-to-r ${statusMeta.accent} px-3 py-1 text-[11px] font-black tracking-[0.16em] text-white shadow`}
          >
            {statusMeta.badge}
          </span>
        )}
      </div>

      <h1 className="text-3xl font-black leading-tight md:text-4xl">
        다독다독 1st Anniversary
        <br />
        <span className="text-[#ffe89a]">Book Bingo</span>
      </h1>

      <p className="mt-3 max-w-2xl break-keep text-sm font-medium leading-7 text-white/88 md:text-[15px]">
        독서 동호회 다독다독 1주년 기념 이벤트 게임입니다.
        책으로 빙고판을 완성하고, 우리 팀의 독서 취향과 팀워크로 승부하세요.
      </p>

      {statusMeta && (
        <div className="mt-4 inline-flex max-w-2xl items-start gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-md">
          <div className="mt-0.5 text-base">🎯</div>
          <div>
            <p className="text-sm font-black text-white">{statusMeta.label}</p>
            <p className="mt-1 text-sm font-medium text-white/80">
              {statusMeta.description}
            </p>
          </div>
        </div>
      )}
    </div>

    <div className="flex shrink-0 items-start">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={refreshing}
        className="min-w-[150px] rounded-[22px] bg-[linear-gradient(135deg,#7c3aed_0%,#c026d3_50%,#ec4899_100%)] px-6 py-4 text-base font-black text-white shadow-[0_14px_28px_rgba(168,85,247,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(168,85,247,0.35)]"
      >
        {refreshing ? "새로고침 중..." : "새로고침"}
      </button>
    </div>
  </div>
</div>

      

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {!opponentTeam && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            아직 두 번째 팀이 생성되지 않았습니다. 상대팀 대표가 접속하면 다음 단계로 진행됩니다.
          </div>
        )}

        {game?.status === "waiting" && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            현재는 팀 대기 상태입니다. 두 번째 팀이 생성되면 자동으로 다음 단계로 넘어갑니다.
          </div>
        )}

{displayStatus  === "setup_opponent" && (
  <div className="space-y-6">
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
      <strong>[상대팀 5칸 입력 단계]</strong>
      <br />
      상대팀 빙고판의 1, 7, 13, 19, 25번 칸을 입력해주세요.
    </div>

    {!isLeader ? (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        현재는 대표 입력 단계입니다. 대표가 상대팀 5칸을 입력할 때까지 기다려주세요.
      </div>
    ) : !opponentTeam ? (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
        상대팀 생성 대기 중입니다.
      </div>
    ) : opponentSaveSubmitted ? (
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
        <p className="text-2xl font-black text-slate-900">
          상대팀 5칸 입력을 제출했습니다.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-600">
          상대팀도 5칸 입력을 완료하면 다음 단계로 자동 진행됩니다.
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {refreshing ? "새로고침 중..." : "새로고침"}
        </button>
      </div>
    ) : (
      <>
        {renderEditableForm("opponent")}

        {!confirmOpponentSave ? (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setConfirmOpponentSave(true);
              }}
              disabled={saving}
              className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              최종 결정
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-5">
            <p className="text-base font-black text-amber-900">
              최종 결정하시겠습니까?
            </p>
            <p className="mt-2 text-sm font-medium text-amber-800">
              네를 누르면 상대팀 5칸이 저장되며, 이후에는 상대팀 입력 완료 전까지 대기 상태가 됩니다.
            </p>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpponentSave(false)}
                disabled={saving}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 disabled:opacity-50"
              >
                아니오
              </button>

              <button
                type="button"
                onClick={saveOpponentSlots}
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                {saving ? "저장 중..." : "네"}
              </button>
            </div>
          </div>
        )}
      </>
    )}
  </div>
)}

                {displayStatus === "setup_self" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
              <strong>내 팀 20칸 입력 단계</strong>
              <br />
              상대팀이 채워준 5칸을 제외한 나머지 <strong>20칸</strong>을 입력해 빙고판을 완성하세요.
            </div>

            {!isLeader ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                현재는 대표가 내 팀 빙고판을 완성하는 단계입니다. 대표 입력이 끝날 때까지 기다려주세요.
              </div>
            ) : mySelfBoardReady ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  우리 팀 20칸 저장이 완료되었습니다.
                </div>

                {!opponentSelfBoardReady && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    상대팀이 아직 빙고판을 구성 중입니다. 상대팀 20칸 저장 완료까지 기다려주세요.
                  </div>
                )}

                <div>
                  <h2 className="mb-3 text-lg font-bold text-slate-950">내 팀 보드 현재 상태</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {myCells.map(renderCellPreview)}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {refreshing ? "새로고침 중..." : "상태 새로고침"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="mb-3 text-lg font-bold text-slate-950">내 팀 보드 현재 상태</h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {myCells.map(renderCellPreview)}
                  </div>
                </div>

                {renderEditableForm("self")}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={saveMySlots}
                    disabled={saving}
                    className="rounded-xl bg-black px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                  >
                    {saving ? "저장 중..." : "내 팀 20칸 저장"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
     

  {(displayStatus === "playing" || displayStatus === "finished") && (
  <div className="space-y-5">
    <div className="overflow-hidden rounded-[26px] border border-[#dcc9a8] bg-[linear-gradient(135deg,#fffaf0_0%,#f8ecd8_100%)] shadow-[0_12px_30px_rgba(73,52,24,0.08)]">
      <div
        className="border-b border-[#e7dcc8] px-5 py-3 text-white md:px-6"
        style={headerGradientStyle}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#ffe08a] px-3 py-1 text-xs font-black tracking-[0.18em] text-[#3a2612]">
              TEAM STATUS
            </span>
            <span className="text-sm font-bold text-white/90">
              {game?.status === "finished" ? "FINAL RESULT" : "LIVE PLAY"}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5 md:px-6 md:py-5">
        {/* Row 1 */}
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] border border-[#e4d6bf] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(73,52,24,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
                  GAME STATUS
                </p>
                <p className="mt-2 text-[32px] font-black leading-none text-[#241913]">
                  {statusMeta?.label || game?.status || "-"}
                </p>
              </div>

              {statusMeta && (
                <span
                  className={`rounded-full bg-gradient-to-r ${statusMeta.accent} px-3 py-1 text-[11px] font-black tracking-[0.14em] text-white shadow`}
                >
                  {statusMeta.badge}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-[20px] border border-[#e4d6bf] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(73,52,24,0.05)]">
            <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
              PLAYER
            </p>

            <div className="mt-2 flex items-center gap-3">
              <p className="text-[32px] font-black leading-none text-[#241913]">
                {member?.name || memberName || "-"}
              </p>

              <span className="rounded-full bg-[#2f2219] px-3 py-1 text-xs font-black text-[#f5d88a] shadow">
                {member?.is_leader ? "대표" : "팀원"}
              </span>
            </div>
          </div>

          <div className="rounded-[20px] border border-[#e4d6bf] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(73,52,24,0.05)]">
            <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
              CHECK COUNT
            </p>
            <p className="mt-2 text-[36px] font-black leading-none text-[#241913]">
              {myCells.filter((cell) => cell.is_checked).length}
            </p>
          </div>

          <div className="rounded-[20px] border border-[#e4d6bf] bg-white px-5 py-4 shadow-[0_8px_20px_rgba(73,52,24,0.05)]">
            <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
              CHECK BINGO
            </p>
            <p className="mt-2 text-[36px] font-black leading-none text-[#241913]">
              {bingoCount}
            </p>
          </div>
        </div>

        {/* Row 2 */}
<div className="grid gap-3 xl:grid-cols-2">
  <div className="rounded-[22px] border border-[#e4d6bf] bg-white px-5 py-5 shadow-[0_8px_20px_rgba(73,52,24,0.05)] flex min-h-[220px] flex-col">
    <div>
      <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
        OPPONENT BOARD
      </p>
      <p className="mt-2 text-[34px] font-black leading-none text-[#241913]">
        상대 팀 현황
      </p>
      <p className="mt-3 text-sm font-semibold text-[#6b5848]">
        작은 빙고판으로 상대 팀 진행 상황을 확인할 수 있습니다.
      </p>
    </div>

    <div className="mt-auto flex pt-5">
      <button
        type="button"
        onClick={() => setShowOpponentBoard(true)}
        className="inline-flex h-[56px] min-w-[220px] items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#ff6b6b_0%,#ff8a5b_55%,#f7b733_100%)] px-6 text-base font-black text-white shadow-[0_12px_24px_rgba(255,107,107,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(255,107,107,0.32)]"
      >
        상대 팀 빙고판 보기
      </button>
    </div>
  </div>

  <div className="rounded-[22px] border border-[#e4d6bf] bg-white px-5 py-5 shadow-[0_8px_20px_rgba(73,52,24,0.05)] flex min-h-[220px] flex-col">
    <div>
      <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
        {displayStatus === "finished" ? "RESULT ACTION" : "BINGO ACTION"}
      </p>

      <p className="mt-2 text-[34px] font-black leading-none text-[#241913]">
        {displayStatus === "finished"
          ? resultChecked
            ? "결과 공개"
            : "결과 확인"
          : canBingo
          ? "빙고 가능"
          : "아직 불가"}
      </p>

      <p className="mt-3 text-sm font-semibold text-[#6b5848]">
        {displayStatus === "finished"
          ? resultChecked
            ? "결과 연출을 다시 확인할 수 있습니다."
            : "결과 확인 버튼을 눌러 승패를 확인하세요."
          : canBingo
          ? "지금 바로 빙고를 선언할 수 있습니다."
          : "빙고 3줄 이상이 되면 활성화됩니다."}
      </p>
    </div>

    <div className="mt-auto flex pt-5">
      {displayStatus === "playing" ? (
        <button
          type="button"
          onClick={handleBingo}
          disabled={!canBingo}
          className={`inline-flex h-[56px] min-w-[220px] items-center justify-center rounded-[18px] px-6 text-base font-black transition-all duration-200 ${
            canBingo
              ? "bg-[linear-gradient(135deg,#ff6b6b_0%,#ff8a5b_55%,#f7b733_100%)] text-white shadow-[0_12px_24px_rgba(255,107,107,0.26)] hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(255,107,107,0.32)]"
              : "bg-[linear-gradient(135deg,#cfd8e3_0%,#bcc7d6_100%)] text-white shadow-none cursor-not-allowed"
          }`}
        >
          {bingoSubmitting ? "처리 중..." : "빙고!"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleShowResult}
          className="inline-flex h-[56px] min-w-[220px] items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#7c3aed_0%,#c026d3_50%,#ec4899_100%)] px-6 text-base font-black text-white shadow-[0_12px_24px_rgba(168,85,247,0.26)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(168,85,247,0.32)]"
        >
          {resultChecked ? "결과 다시 보기" : "결과 확인"}
        </button>
      )}
    </div>
  </div>
</div>
      </div>
    </div>

    {displayStatus === "finished" && resultChecked && (
      <div
        className={`rounded-xl border px-4 py-3 text-sm font-bold ${
          isWinner
            ? "border-green-300 bg-green-50 text-green-900"
            : "border-red-300 bg-red-50 text-red-900"
        }`}
      >
        {isWinner
          ? "게임이 종료되었습니다. 축하합니다! 우리 팀이 빙고를 선언해 우승했습니다."
          : "게임이 종료되었습니다. 아쉽지만 상대 팀이 먼저 빙고를 완성했습니다."}
      </div>
    )}

    {displayStatus === "finished" && !resultChecked && (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
        게임이 종료되었습니다. 상단 버튼에서 결과를 확인해주세요.
      </div>
    )}

    <div>
      <h2 className="mb-3 text-lg font-bold text-slate-950">내 팀 빙고판</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {displayStatus === "playing"
          ? myCells.map(renderPlayableCell)
          : myCells.map(renderCellPreview)}
      </div>

      {renderMiniStatusBoard()}
    </div>
  </div>
)}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-900"
          >
            홈으로
          </button>
        </div>

        {(displayStatus === "setup_opponent" || game?.status === "setup_self") && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
            참고: 저장 후 상태가 바로 바뀌지 않으면 새로고침 버튼을 눌러 확인하세요.
          </div>
        )}

        {displayStatus === "setup_opponent" && opponentBoardReady && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            상대팀 5칸 입력이 완료된 상태입니다.
          </div>
        )}

        {displayStatus === "setup_self" && myBoardReady && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            내 팀 빙고판 25칸이 모두 채워졌습니다.
          </div>
        )}
      </div>
      {showOpponentBoard && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
    <div className="w-full max-w-[420px] rounded-[28px] border border-[#e4d6bf] bg-[linear-gradient(180deg,#fffdf8_0%,#f8efe1_100%)] p-6 shadow-[0_24px_50px_rgba(73,52,24,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
            OPPONENT BOARD
          </p>
          <h3 className="mt-2 text-2xl font-black text-[#241913]">
            상대 팀 빙고판
          </h3>
          <p className="mt-2 text-sm font-semibold text-[#6b5848]">
            체크된 칸과 완성된 빙고 줄을 확인할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowOpponentBoard(false)}
          className="rounded-full border border-[#d7c8b0] bg-white px-3 py-1.5 text-xs font-black text-[#4d3a28] shadow-sm"
        >
          닫기
        </button>
      </div>

      <div className="mt-5">
        {renderOpponentMiniBoard()}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#eadfcf] bg-white/90 px-4 py-3">
          <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
            CHECK
          </p>
          <p className="mt-2 text-3xl font-black text-[#241913]">
            {opponentCheckedCount}
          </p>
        </div>

        <div className="rounded-2xl border border-[#eadfcf] bg-white/90 px-4 py-3">
          <p className="text-[11px] font-black tracking-[0.16em] text-[#8b6b39]">
            BINGO
          </p>
          <p className="mt-2 text-3xl font-black text-[#241913]">
            {opponentBingoCount}
          </p>
        </div>
      </div>
    </div>
  </div>
)}
    </main>
  );
}