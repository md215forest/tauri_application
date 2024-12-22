// react-kanbanをインポートする
// 型定義ファイル（.d.ts）がないため、`@ts-ignore`を指定することで
// TypeScriptのエラーを抑止している

// @ts-ignore
import Board from "@asseinfo/react-kanban";
import "@asseinfo/react-kanban/dist/styles.css";
import { useState, useEffect } from "react";
// Tauriが提供するinvoke関数をインポートする
import { invoke } from "@tauri-apps/api/core";

// ボードを表す型定義
type TBoard = {
  columns: [TColumn];
};

// カラムを表す型定義
type TColumn = {
  id: number;
  title: string;
  cards: [TCard];
};

// カードを表す型定義
type TCard = {
  id: number;
  title: string;
  description: string | undefined;
};

// カードの移動元を表す型定義
type TMovedFrom = {
  fromColumnId: number;
  fromPosition: number;
};

// カードの移動先を表す型定義
type TMovedTo = {
  toColumnId: number;
  toPosition: number;
};

// カードの位置を表すクラス
class CardPos {
  columnId: number;
  position: number;

  constructor(columnId: number, position: number) {
    this.columnId = columnId;
    this.position = position;
  }
}

// かんばんボードに最初に表示するデータを作成する
const board = {
  columns: [
    {
      id: 0,
      title: "バックログ",
      cards: [
        {
          id: 0,
          title: "かんばんボードを追加する",
          description: "react-kanbanを使用する",
        },
      ],
    },
    {
      id: 1,
      title: "開発中",
      cards: [],
    },
  ],
};

// カードの追加直後に呼ばれるハンドラ
async function handleAddCard(board: TBoard, column: TColumn, card: TCard) {
  const pos = new CardPos(column.id, 0);
  // IPCでCoreプロセスのhandle_add_cardを呼ぶ（引数はJSON形式）
  await invoke<void>("handle_add_card", { card: card, pos: pos });
}

// カードの移動直後に呼ばれるハンドラ
async function handleMoveCard(
  board: TBoard,
  card: TCard,
  from: TMovedFrom,
  to: TMovedTo
) {
  const fromPos = new CardPos(from.fromColumnId, from.fromPosition);
  const toPos = new CardPos(to.toColumnId, to.toPosition);
  await invoke<void>("handle_move_card", {
    card: card,
    from: fromPos,
    to: toPos,
  });
}

// カードの削除直後に呼ばれるハンドラ
async function handleRemoveCard(board: TBoard, column: TColumn, card: TCard) {
  await invoke<void>("handle_remove_card", { card: card, columnId: column.id });
}

// かんばんボードコンポーネントを表示する
function App() {
  const [board, setBoard] = useState<TBoard | null>(null);

  // ボードのデータを取得する
  useEffect(() => {
    (async () => {
      // IPCでCoreプロセスのget_boardを呼ぶ
      const board = await invoke<TBoard>("get_board", {})
        // 例外が発生したらその旨コンソールに表示する
        .catch((err: any) => {
          console.error(err);
          return null;
        });
      console.debug(board);
      // ボードのデータをかんばんボードにセットする
      setBoard(board);
    })();
  }, []);

  return (
    <>
      {board != null && (
        <Board
          initialBoard={board}
          allowAddCard={{ on: "top" }}
          allowRemoveCard
          disableColumnDrag
          onNewCardConfirm={(draftCard: any) => ({
            id: new Date().getTime(),
            ...draftCard,
          })}
          onCardNew={handleAddCard}
          onCardDragEnd={handleMoveCard}
          onCardRemove={handleRemoveCard}
        />
      )}
    </>
  );
}

export default App;
