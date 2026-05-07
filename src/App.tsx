import { useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage, Text } from 'react-konva';
import "./app.css";
import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Html } from 'react-konva-utils';

function App() {

  // canvas size, default size
  const canvasWidth = 700;
  const canvasHeight = 700;

  const canvasRef = useRef<Konva.Stage | null>(null);
  const containerRef = useRef(null);
  const uiLayerRef = useRef<Konva.Layer | null>(null);
  const textref = useRef<Konva.Text | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // for layer checking purposes only
  const textRefs = useRef({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({ width: canvasWidth, height: canvasHeight });
  const [bgColor, setBgColor] = useState('');
  const colors = ['white', 'red', 'green', 'blue'];
  const [textPosition, setTextPosition] = useState<{ x: number, y: number }>({ x: 0.5, y: 0.5, });
  const [text, setText] = useState<string | undefined>("");
  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(1);

  // for text layer check
  const [texts, setTexts] = useState([
    { id: '1', text: 'Layer 1 objects', x: 0.5, y: 0.5, layerId: 'layer1' },
    { id: '2', text: 'Layer 2 objects', x: 0.2, y: 0.2, layerId: 'layer2' },
  ]);

  // initial canvas
  const setupCanvas = () => {
    const stage = canvasRef.current;
    if (!stage) return;

    const canvas = stage.container();
    canvas.style.background = bgColor === "" ? "white" : bgColor;
  };

  // for layer testing
  // current layer test
  const handleLayerClick = (e: KonvaEventObject<MouseEvent> ) => {
    const target = e.target;
    const layer = target.getLayer()

    console.log("Layer: ", layer);
    setEditMode(true);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // text position set
  const handlerLeftClick = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();

    const stage = canvasRef.current;
    if (!stage) return;

    // when text is clicked dont allow it to move around and cancel edit mode
    const clickedNode = e.target;
    if (clickedNode === textref.current) return;
    setEditMode(false);
  };

  // prevents showing the context menu
  const handlerRightClick = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
    setEditMode(false);
  };

  //zoom in
  const zoomIn = () => {
    setScale(prev => Math.min(prev * 1.05, 3));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev * 0.95, 0.5));
  };

  const resetScale = () => {
    setScale(1);
  };

  const saveToJpeg = () => {
    const stage = canvasRef.current;
    if (!stage) return;

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

  // handles canvas size changes
  const handleSizeSubmit = () => {
    console.log("width: ", canvasSize.width);
    console.log("height: ", canvasSize.height);
    setCanvasSize({ width: Number(width), height: Number(height) });
  };

  //color change
  useEffect(() => {
    setupCanvas();
  }, [bgColor]);

  // event clicks
  useEffect(() => {
    const stage = canvasRef.current;
    stage.on("contextmenu", handlerRightClick); // rightClicking

    //clean
    return () => {
      stage.off("contextmenu", handlerRightClick);
      stage.off("click", (e: KonvaEventObject<PointerEvent>) => e.evt.button === 0 && handlerLeftClick(e));
    };
  }, []);

  // pixel ratio pisutu
  const pos = {
    x: textPosition.x * canvasSize.width,
    y: textPosition.y * canvasSize.height,
  };

  // for layer testing debugging
  // useEffect(() => {
  //   console.log("selected id: ", selectedId);
  //   console.log("editMode: ", editMode);
  // }, [selectedId, editMode]);

  return (
    <>
      <div>
        <div ref={containerRef} className="mainCanvas">
          <Stage ref={canvasRef} width={canvasSize.width * scale} height={canvasSize.height * scale} scaleX={scale} scaleY={scale} >
            <Layer ref={uiLayerRef}>
              {
                // for identifying transparent bg
                bgColor === "" ? <Text x={0} y={0} text="transparent background" /> : ""
              }
              {/* canvas background color */}
              <Rect
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
                fill={bgColor || bgColor}
              />
            </Layer>

            {/* layer checking purposes */}
            {['layer1', 'layer2'].map((layerId) => (
              <Layer key={layerId} onClick={handleLayerClick}>
                {
                  texts.filter(t => t.layerId === layerId).map((t) => {
                    const px = {
                      x: t.x * canvasSize.width,
                      y: t.y * canvasSize.height,
                    };
                    return (
                      <Text
                        key={t.id}
                        ref={el => { textRefs.current[t.id] = el; }}
                        x={px.x}
                        y={px.y}
                        text={t.text}
                        fontSize={24}
                        fill={selectedId === t.id ? "green" : "black"} // change color of text base on what layer is picked
                        draggable={selectedId === t.id}
                        onMouseEnter={() => { document.body.style.cursor = 'pointer'; }}
                        onMouseLeave={() => { document.body.style.cursor = 'default'; }}
                        onDragEnd={(e) => {
                          setTexts(prev => prev.map(item =>
                            item.id === t.id
                              ? { ...item, x: e.target.x() / canvasSize.width, y: e.target.y() / canvasSize.height }
                              : item
                          ));
                        }}
                      />
                    )
                  })
                }
              </Layer>
            ))}
            <Layer>
              {/* Text */}
              <Text
                ref={textref}
                x={pos.x}
                y={pos.y}
                align="center"
                verticalAlign="middle"
                fontFamily="Calibri"
                fontSize={24}
                text={text || "hello world"}
                fill="black"
                draggable // enable draggable object
                onMouseEnter={() => { document.body.style.cursor = 'pointer'; }}
                onMouseLeave={() => { document.body.style.cursor = 'default'; }}
                onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                  setTextPosition({
                    x: e.target.x() / canvasSize.width,
                    y: e.target.y() / canvasSize.height,
                  });
                }}
              />
              {// editing text
                editMode && (
                  <Html>
                    <input
                      ref={inputRef}
                      style={{
                        position: "absolute",
                        top: `${pos.y || textref.current?.y()}px`,
                        left: `${pos.x || textref.current?.x()}px`,
                        fontSize: `${24}px`,
                      }}
                      onBlur={() => setEditMode(false)} // exit edit mode when input loses focus
                      onChange={(e) => setText(e.target.value)} // update text state on input change
                      value={text || "hello world"} // set input value to current text state
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

          <button type="button" style={{ position: "fixed", top: 400, left: 15 }} onClick={() => zoomIn()}>+</button>
          <button type="button" style={{ position: "fixed", top: 450, left: 15 }} onClick={() => zoomOut()}>-</button>
          <button type="button" style={{ position: "fixed", top: 500, left: 15 }} onClick={() => resetScale()}>reset scale</button>

          <button type="button" style={{ position: "fixed", top: 350, left: 15 }} onClick={() => setText("")}>reset text</button>
        </div>
      </div>
      <div className="inputs">
        <div className="inputs-container">
          <input type="number" placeholder="width" onChange={(e) => setWidth(e.target.value)} />
          <input type="number" placeholder="height" onChange={(e) => setHeight(e.target.value)} />
          <button onClick={handleSizeSubmit}>confirm</button>
        </div>
      </div>
      <div className="layers">
        {
          texts.map((layer) =>{
            return (<h1 key={layer.id} style={{color:`${layer.id === selectedId ? "blue" : "black"}`}} onClick={() => {setSelectedId(layer.id)}}>{layer.layerId}</h1>)
          })
        }
      </div>
    </>
  );
};

export default App;
