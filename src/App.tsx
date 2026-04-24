import { useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage, Text } from 'react-konva';
import "./app.css";
import { textArea } from "./textArea";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Html } from 'react-konva-utils';

function App() {

  // canvas size
  const canvasWidth = 700;
  const canvasHeight = 700;

  const canvasRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef(null);
  const uiLayerRef = useRef<Konva.Layer | null>(null);
  const textref = useRef<Konva.Text | null>(null);

  const [bgColor, setBgColor] = useState('');
  const colors = ['white', 'red', 'green', 'blue'];
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [text, setText] = useState<string | undefined>("");
  const [editMode, setEditMode] = useState(false);

  // initial canvas
  const setupCanvas = () => {
    const stage = canvasRef.current;
    if (!stage) return;

    const canvas = stage.container();
    canvas.style.background = bgColor === "" ? "white" : bgColor;

    // text position set
    const handlerLeftClick = (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();

      const mousePos = stage.getPointerPosition();

      // when text is clicked dont allow it to move around
      const clickedNode = e.target;
      if (clickedNode === textref.current) return;

      setTextPosition({ x: mousePos?.x || 0, y: mousePos?.y || 0 });
    };

    // prevents showing the context menu
    const handlerContextMenu = (e: KonvaEventObject<PointerEvent>) => {
      e.evt.preventDefault();
    };

    stage.on("contextmenu", handlerContextMenu); // rightClicking
    stage.on("click", (e: KonvaEventObject<PointerEvent>) => e.evt.button === 0 && handlerLeftClick(e)); // left clicking 

    // cleanup function for the mouse event
    return () => {
      stage.off("contextmenu", handlerLeftClick);
      stage.off("click", (e: KonvaEventObject<PointerEvent>) => e.evt.button === 0 && handlerLeftClick(e));
    };
  };

  const saveToJpeg = () => {
    const stage = canvasRef.current;

    // hide the transparent layer visual
    uiLayerRef.current?.hide();

    const pngUrl = stage?.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2
    });

    uiLayerRef.current?.show();

    // creates a donwload link element
    const link = document.createElement('a');
    link.download = "canvas.png";
    link.href = pngUrl || "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // removes canvas bg color
  const removeBgColor = () => {
    return setBgColor("");
  };

  useEffect(() => {
    setupCanvas();

    // clicking the text
    textref.current?.on('click', () => {
      setEditMode(true);
      console.log("edit mode enabled");
    });

  }, [bgColor]);

  return (
    <div>
      <div ref={containerRef} className="mainCanvas">
        <Stage ref={canvasRef} width={canvasWidth} height={canvasHeight} >
          <Layer ref={uiLayerRef}>
            {
              // for identifying transparent bg
              bgColor === "" ? <Text x={0} y={0} text="transparent background" /> : ""
            }
          </Layer>
          <Layer>
            <Rect
              x={0}
              y={0}
              width={canvasWidth}
              height={canvasHeight}
              fill={bgColor || bgColor}
            />
            <Text
              ref={textref}
              x={textPosition.x || 50}
              y={textPosition.y || 50}
              fontFamily="Calibri"
              fontSize={24}
              text={text || "hello world"}
              fill="black"
            />

            {// editing text
            editMode && (
              <Html>
                <input
                  placeholder="DOM input from Konva nodes"
                  style={{
                    position: "absolute",
                    top: `${textPosition.y || textref.current?.y()}px`,
                    left: `${textPosition.x || textref.current?.x()}px`,
                    fontSize: "24px",
                  }}
                  onBlur={() => setEditMode(false)} // exit edit mode when input loses focus
                  onChange={(e) => setText(e.target.value)} // update text state on input change
                  value={text} // set input value to current text state
                />
              </Html>)}

          </Layer>
        </Stage>
      </div>
      <div className="color-selection">
        {colors.map((color, index) => {
          // basic color selection
          return (<div key={index} className="palettes" style={{ backgroundColor: `${color}` }} onClick={() => setBgColor(color)} />)
        })}
      </div>
      <div>
        <button type="button" style={{ position: "fixed", top: 250, left: 15 }} onClick={() => saveToJpeg()}>export to png</button>
        <button type="button" style={{ position: "fixed", top: 300, left: 15 }} onClick={() => removeBgColor()}>remove bg color</button>
        <button type="button" style={{ position: "fixed", top: 350, left: 15 }} onClick={() => textArea("nice", setText)}>Test text area</button>
        <button type="button" style={{ position: "fixed", top: 400, left: 15 }} onClick={() => setText("")}>reset text</button>
      </div>
    </div>
  );
};

export default App;
