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
  const textRefs = useRef<Record<string, Konva.Text | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>("1");

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({ width: canvasWidth, height: canvasHeight });
  const [bgColor, setBgColor] = useState('');
  const colors = ['white', 'red', 'green', 'blue'];

  const [scale, setScale] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);

  // for text layer check
  const [texts, setTexts] = useState([
    { id: '1', text: 'Layer 1 objects', defaultText: "Layer 1 objects", x: 0.5, y: 0.5, layerId: 'layer1' },
    { id: '2', text: 'Layer 2 objects', defaultText: "Layer 2 objects", x: 0.2, y: 0.2, layerId: 'layer2' },
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
  const handleLayerClick = (id: string) => {
    setEditingId(id);

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
  };

  // prevents showing the context menu
  const handlerRightClick = (e: KonvaEventObject<PointerEvent>) => {
    e.evt.preventDefault();
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
    stage?.on("contextmenu", handlerRightClick); // rightClicking

    //clean
    return () => {
      stage?.off("contextmenu", handlerRightClick);
      stage?.off("click", (e: KonvaEventObject<PointerEvent>) => e.evt.button === 0 && handlerLeftClick(e));
    };
  }, []);

  // for layer testing debugging
  // useEffect(() => {
  //   console.log("selected id: ", selectedId);
  //   console.log("editMode: ", editMode);
  // }, [selectedId, editMode]);

  return (
    <>
      <div>
        <div ref={containerRef} className="mainCanvas">
          <Stage ref={canvasRef} width={canvasSize.width * scale} height={canvasSize.height * scale} scaleX={scale} scaleY={scale}>
            {/* for background */}
            <Layer>
              <Rect
                x={0}
                y={0}
                width={canvasSize.width}
                height={canvasSize.height}
                fill={bgColor || bgColor}
                listening={false}
              />
            </Layer>
            <Layer ref={uiLayerRef}>
              {
                // for identifying transparent bg
                bgColor === "" ? <Text x={0} y={0} text="transparent background" /> : ""
              }
              {/* canvas background color */}
            </Layer>
            {/* layer checking purposes */}
            {['layer1', 'layer2'].map((layerId) => (
              <Layer key={layerId}>
                {
                  texts.filter(t => t.layerId === layerId).map((t) => {
                    const px = {
                      x: t.x * canvasSize.width,
                      y: t.y * canvasSize.height,
                    };

                    return (
                      <>
                        <Text
                          key={t.id}
                          ref={el => { textRefs.current[t.id] = el; }}
                          x={px.x}
                          y={px.y}
                          text={t.text}
                          fontSize={24}
                          fill={selectedId === t.id ? "green" : "black"} // change color of text base on what layer is picked
                          draggable={selectedId === t.id}
                          onClick={() => {
                            selectedId === t.id ? console.log('x: ', t.x, ' ', 'y: ', t.y) : "";
                            if (selectedId === t.id) handleLayerClick(t.id); // this allows only selected layer to be clicked or edited
                          }}
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
                        {// editing text
                          editingId === t.id && (
                            <Html>
                              <input
                                ref={inputRef}
                                style={{
                                  position: "absolute",
                                  top: `${px.y}px`,
                                  left: `${px.x}px`,
                                  fontSize: `${24}px`,
                                }}
                                onBlur={() => setEditingId(null)} // exit edit mode when input loses focus
                                onChange={(e) => {
                                  setTexts(prev =>
                                    prev.map(item =>
                                      item.id === t.id
                                        ? { ...item, text: e.target.value }
                                        : item
                                    )
                                  );
                                }} // update text state on input change
                                value={t.text} // set input value to current text state
                              />
                            </Html>)
                        }
                      </>
                    )
                  })
                }
              </Layer>
            ))}
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

          <button type="button" style={{ position: "fixed", top: 350, left: 15 }} onClick={() => setTexts(prev => prev.map(item => ({ ...item, text: item.defaultText })))}>reset text</button>
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
          texts.map((layer) => {
            return (<h1 key={layer.id} style={{ color: `${layer.id === selectedId ? "blue" : "black"}` }} onClick={() => { setSelectedId(layer.id) }}>{layer.layerId}</h1>)
          })
        }
      </div>
    </>
  );
};

export default App;
