import { useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage, Text } from 'react-konva';
import "./app.css";

function App() {

  // canvas size
  const canvasWidth = 700;
  const canvasHeight = 700;

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const uiLayerRef = useRef(null);

  const [bgColor, setBgColor] = useState('');
  const colors = ['white', 'red', 'green', 'blue'];
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });

  // initial canvas
  const setupCanvas = () => {
    const stage = canvasRef.current;
    if (!stage) return;

    const canvas = stage.container();
    canvas.style.background = bgColor === "" ? "white" : bgColor;

    const handlerLeftClick = (e) => {
      e.evt.preventDefault();

      const mousePos = stage.getPointerPosition();
      setTextPosition({ x: mousePos.x, y: mousePos.y });
    };

    // prevents showing the context menu
    const handlerContextMenu = (e) => {
      e.evt.preventDefault();
    };


    stage.on("contextmenu", handlerContextMenu); // rightClicking
    stage.on("click", (e) => e.evt.button === 0 && handlerLeftClick(e)); // left clicking 

    // cleanup function for the mouse event
    return () => {
      stage.off("contextmenu", handlerLeftClick);
      stage.off("click", (e) => e.evt.button === 0 && handlerLeftClick(e));
    };
  };

  const saveToJpeg = () => {
    const stage = canvasRef.current;

    // hide the transparent layer visual
    uiLayerRef.current.hide();

    const pngUrl = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2
    });

    uiLayerRef.current.show();

    // creates a donwload link element
    const link = document.createElement('a');
    link.download = "canvas.png";
    link.href = pngUrl;
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
              x={textPosition.x}
              y={textPosition.y}
              fontFamily="Calibri"
              fontSize={24}
              text={"Hello world"}
              fill="black"
            />
          </Layer>
        </Stage>
      </div>
      <div style={{ position: "fixed", top: 15, left: 15 }}>
        {colors.map((color, index) => {
          // basic color selection
          return (<div key={index} className="palettes" style={{ backgroundColor: `${color}` }} onClick={() => setBgColor(color)} />)
        })}
      </div>
      <div>
        <button type="button" style={{ position: "fixed", top: 250, left: 15 }} onClick={() => saveToJpeg()}>export to png</button>
        <button type="button" style={{ position: "fixed", top: 300, left: 15 }} onClick={() => removeBgColor()}>remove bg color</button>
      </div>
    </div>
  );
};

export default App;
