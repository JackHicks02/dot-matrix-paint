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

const getBit = (bit: number): [number, number] => {
  const byte = Math.floor(bit / 8);
  const offset = bit % 8;
  return [byte, offset];
};

interface CircleProps {
  x: number;
  y: number;
  pixelsRef: RefObject<Record<string, SVGCircleElement>>;
  bitMapRef: RefObject<Uint8Array>;
  userStateRef: RefObject<UserState>;
  handleDraw: () => void;
}

const Circle: FC<CircleProps> = ({
  x,
  y,
  pixelsRef,
  bitMapRef,
  userStateRef,
  handleDraw,
}) => {
  const [colour, setColour] = useState("darkgrey");
  const index = y * DOTMATRIX_SIDE + x;

  const paint = () => {
    const userState = userStateRef.current;
    const [byte, offset] = getBit(index);
    const mask = 1 << offset;
    if (userState.drawMode === DrawMode.DRAW) {
      bitMapRef.current[byte] |= mask;
      setColour("red");
    } else {
      bitMapRef.current[byte] &= ~mask;
      setColour("darkgrey");
    }

    handleDraw();
  };

  const handleMouseOver = () => {
    if (!userStateRef.current.mouseDown) return;
    paint();
  };

  const handleMouseDown = () => {
    userStateRef.current.mouseDown = true;
    paint();
  };

  return (
    <circle
      cx={x * (SCALE + SPACING) + SCALE / 2}
      cy={y * (SCALE + SPACING) + SCALE / 2}
      r={SCALE / 2}
      fill={colour}
      ref={(el) => {
        if (el) pixelsRef.current[`${x}-${y}`] = el;
      }}
      onMouseOver={handleMouseOver}
      onMouseDown={handleMouseDown}
    />
  );
};

function App() {
  const pixelsRef = useRef<Record<string, SVGCircleElement>>({});
  const bitMapRef = useRef(new Uint8Array(512));
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);

  const encode = () => {
    if (!textFieldRef.current) return;
    const bytes = bitMapRef.current;
    let binary = "";
    for (let i = 0; i < bytes.length; i++)
      binary += String.fromCharCode(bytes[i]);
    const base64 = btoa(binary);

    textFieldRef.current.value = base64;
  };

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
          key={`${x}-${y}`}
          x={x}
          y={y}
          pixelsRef={pixelsRef}
          bitMapRef={bitMapRef}
          userStateRef={userStateRef}
          handleDraw={encode}
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
      <div className="h-full flex flex-col w-[600px]">
        <div className="flex gap-2 items-center">
          <h1 className="text-2xl">Base 64 output</h1>
        </div>
        <textarea
          className="w-full h-full border-slate-500 border p-1"
          ref={textFieldRef}
          defaultValue=""
        />
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
