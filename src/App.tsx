import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type ReactElement,
  type RefObject,
} from "react";

const DOTMATRIX_SIDE = 64;
const SPACING = 2;

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
  const offset = 7 - (bit % 8);
  return [byte, offset];
};

interface CircleProps {
  x: number;
  y: number;
  width: number;
  pixelsRef: RefObject<
    Record<
      string,
      { elem: SVGCircleElement; setColour: (colour: string) => void }
    >
  >;
  bitMapRef: RefObject<Uint8Array>;
  userStateRef: RefObject<UserState>;
  handleDraw: () => void;
}

const Circle: FC<CircleProps> = ({
  x,
  y,
  width,
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
      cx={x * (width + SPACING) + width / 2}
      cy={y * (width + SPACING) + width / 2}
      r={width / 2}
      fill={colour}
      ref={(el) => {
        if (!el) return;
        pixelsRef.current[`${x}-${y}`] = { elem: el, setColour };
      }}
      onMouseOver={handleMouseOver}
      onMouseDown={handleMouseDown}
    />
  );
};

function App() {
  const pixelsRef = useRef<
    Record<
      string,
      { elem: SVGCircleElement; setColour: (colour: string) => void }
    >
  >({});
  const bitMapRef = useRef(new Uint8Array(512));
  const textFieldRef = useRef<HTMLTextAreaElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [sideLength, setSideLength] = useState(0);

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

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const setSize = () => {
      const { clientWidth, clientHeight } = container;
      const _sideLength =
        clientWidth > clientHeight ? clientHeight : clientWidth;

      setSideLength(_sideLength);
    };

    window.addEventListener("resize", setSize);

    setSize();
    return () => {
      window.removeEventListener("resize", setSize);
    };
  }, []);

  const pixels: ReactElement[] = [];
  const pixelWidth =
    (sideLength - SPACING * (DOTMATRIX_SIDE - 1)) / DOTMATRIX_SIDE;

  for (let y = 0; y < DOTMATRIX_SIDE; y++) {
    for (let x = 0; x < DOTMATRIX_SIDE; x++) {
      pixels.push(
        <Circle
          key={`${x}-${y}`}
          x={x}
          y={y}
          width={pixelWidth}
          pixelsRef={pixelsRef}
          bitMapRef={bitMapRef}
          userStateRef={userStateRef}
          handleDraw={encode}
        />
      );
    }
  }

  const handleClearAll = () => {
    const textField = textFieldRef.current;

    if (!textField) return;

    Object.values(pixelsRef.current).forEach(({ setColour }) => {
      setColour("darkGrey");
    });
    bitMapRef.current = new Uint8Array(512);
    textField.value = "";
  };

  return (
    <div className="w-screen relative h-screen overflow-hidden bg-slate-700 flex p-2 gap-4 items-center font-mono text-white">
      <div
        className="h-full w-full  overflow-hidden flex flex-col"
        style={{ maxWidth: "60%" }}
      >
        <div className="flex-1 flex" ref={containerRef}>
          <svg
            width={sideLength}
            height={sideLength}
            className="bg-slate-900 flex-1"
          >
            {pixels}
          </svg>
        </div>
        <div className="h-fit flex gap-2">
          <button
            className="bg-slate-500 border border-slate-200 px-4 py-2 rounded-md hover:brightness-125 cursor-pointer"
            onClick={() => {
              userStateRef.current.drawMode = DrawMode.DRAW;
            }}
          >
            Draw
          </button>
          <button
            className="bg-slate-500 border border-slate-200 px-4 py-2 rounded-md hover:brightness-125 cursor-pointer"
            onClick={() => {
              userStateRef.current.drawMode = DrawMode.ERASE;
            }}
          >
            Erase
          </button>
          <button
            className="bg-slate-500 border border-slate-200 px-4 py-2 rounded-md hover:brightness-125 cursor-pointer"
            onClick={handleClearAll}
          >
            Clear
          </button>
        </div>
      </div>
      <div className="h-full flex flex-col w-full">
        <div className="flex gap-2 items-center">
          <h1 className="text-2xl">Base 64 output</h1>
        </div>
        <textarea
          spellCheck={false}
          className="w-full h-full border-slate-500 border p-1"
          ref={textFieldRef}
          defaultValue=""
        />
      </div>
    </div>
  );
}

export default App;
