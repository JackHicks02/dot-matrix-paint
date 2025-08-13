import {
  useEffect,
  useRef,
  useState,
  type FC,
  type ReactElement,
  type RefObject,
} from "react";

const SCALE = 12;
const DOTMATRIX_SIDE = 64;
const SPACING = 2;
const SCALED_SIDE = DOTMATRIX_SIDE * (SCALE + SPACING);

enum DrawMode {
  DRAW = 0,
  ERASE = 1,
}

type UserState = {
  mouseDown: boolean;
  drawMode: DrawMode;
};

interface CircleProps {
  x: number;
  y: number;
  pixelsRef: RefObject<Record<string, SVGCircleElement>>;
  bitMapRef: RefObject<number[]>;
  userStateRef: RefObject<UserState>;
}

const Circle: FC<CircleProps> = ({
  x,
  y,
  pixelsRef,
  bitMapRef,
  userStateRef,
}) => {
  const [colour, setColour] = useState("grey");

  const index = y * DOTMATRIX_SIDE + x;

  const handleMouseOver = () => {
    const userState = userStateRef.current;

    if (!userState.mouseDown) return;
    const newColour = userState.drawMode === 0 ? "red" : "grey";

    setColour(newColour);
    bitMapRef.current[index] = 1;
  };

  return (
    <circle
      key={`${x}-${y}`}
      cx={x * (SCALE + SPACING) + SCALE / 2}
      cy={y * (SCALE + SPACING) + SCALE / 2}
      r={SCALE / 2}
      fill={colour}
      ref={(el) => {
        if (el) pixelsRef.current[`${x}-${y}`] = el;
      }}
      onMouseOver={handleMouseOver}
    />
  );
};

function App() {
  const pixelsRef = useRef<Record<string, SVGCircleElement>>({});
  const bitMapRef = useRef(Array(DOTMATRIX_SIDE * DOTMATRIX_SIDE).fill(0));

  const userStateRef = useRef<UserState>({
    mouseDown: false,
    drawMode: DrawMode.DRAW,
  });

  useEffect(() => {
    const handleMouseDown = () => {
      userStateRef.current.mouseDown = true;
    };

    const handleMouseUp = () => {
      userStateRef.current.mouseDown = false;
    };

    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const pixels: ReactElement[] = [];
  for (let y = 0; y < DOTMATRIX_SIDE; y++) {
    for (let x = 0; x < DOTMATRIX_SIDE; x++) {
      pixels.push(
        <Circle
          x={x}
          y={y}
          pixelsRef={pixelsRef}
          bitMapRef={bitMapRef}
          userStateRef={userStateRef}
        />
      );
    }
  }

  return (
    <div className="w-screen relative h-screen bg-slate-700 flex p-2 gap-4 items-center font-mono text-white">
      <svg
        width={SCALED_SIDE}
        height={SCALED_SIDE}
        style={{ width: SCALED_SIDE, height: SCALED_SIDE }}
        className="bg-slate-900"
      >
        {pixels}
      </svg>
      <div className="h-full">
        <h1>Base 64 output</h1>
      </div>
      <div className="absolute right-2 top-2 flex flex-col gap-4 bg-slate-600 p-2 rounded-md">
        <button
          className="bg-slate-400 border border-amber-400 px-4 py-2 rounded-md hover:brightness-125 cursor-pointer"
          onClick={() => {
            userStateRef.current.drawMode = DrawMode.DRAW;
          }}
        >
          Draw
        </button>
        <button
          className="bg-slate-400 border border-amber-400 px-4 py-2 rounded-md hover:brightness-125 cursor-pointer"
          onClick={() => {
            userStateRef.current.drawMode = DrawMode.ERASE;
          }}
        >
          Erase
        </button>
      </div>
    </div>
  );
}

export default App;
