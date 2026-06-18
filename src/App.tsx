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
  const inputRef = useRef<HTMLInputElement>(null);

  // for layer checking purposes only
  const textRefs = useRef<Record<string, Konva.Text | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>("1");

  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [canvasSize, setCanvasSize] = useState<{ width: number, height: number }>({ width: canvasWidth, height: canvasHeight });
  const [bgColor, setBgColor] = useState('');
  const colors = ['white', 'red', 'green', 'blue'];

  const [viewport, setViewport] = useState({
    x: (window.innerWidth - canvasWidth) / 2,
    y: (window.innerHeight - canvasHeight) / 2,
    scale: 1,
  });

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
    // canvas.style.background = bgColor === "" ? "white" : bgColor;
    canvas.style.background = "transparent";
  };

  // this will focus the input when the layer is 
  // clicked and set the editing id to the selected layer id, this allows only the selected layer to be edited
  const handleLayerClick = (id: string) => {
    setEditingId(id);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  //zoom in, not optimized yet it should zoom in to the position of the mouse cursor, currently it just zooms in to the center of the canvas
  const zoomIn = () => {
    setViewport(prev => ({
      ...prev,
      scale: Math.min(prev.scale * 1.05, 3)
    }));
  };

  // zoom in, not optimized yet it should zoom out from the position of the mouse cursor, currently it just zooms out from the center of the canvas
  const zoomOut = () => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(prev.scale * 0.95, 0.5)
    }));
  };

  // not optimized yet, it should scale responsive to the current scale and position, currently it just resets to scale 1 and position to center
  const resetScale = () => {
    setViewport(prev => ({
      ...prev,
      scale: 1
    }));
  };

  // resets canvas position to center not optimized yet
  // this should reset position responsive to the scaled canvas size, so it will always reset to the center of the screen regardless of the current scale
  const resetPosition = () => {
    setViewport(prev => ({
      ...prev,
      x: (window.innerWidth - canvasSize.width) / 2,
      y: (window.innerHeight - canvasSize.height) / 2,
    }));
  };

  // save image, saves the canvas and avoids the transparent layer of the canvas
  const saveToJpeg = () => {
    const stage = canvasRef.current;
    if (!stage) return;

    uiLayerRef.current?.hide();

    // get bg rect from first layer
    const bgCanvas = stage.getLayers()[0].getChildren()[0] as Konva.Rect;
    const wasTransparent = bgColor === "";

    // if transparent, set to transparent for export
    if (wasTransparent) bgCanvas.fill("transparent");

    const pngUrl = stage.toDataURL({
      mimeType: "image/png",
      pixelRatio: 2,
      x: viewport.x * viewport.scale,
      y: viewport.y * viewport.scale,
      width: canvasSize.width * viewport.scale,
      height: canvasSize.height * viewport.scale,
    });

    // restore white display after export
    if (wasTransparent) bgCanvas.fill("white");
    uiLayerRef.current?.show();

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

  // for testing viewport changes when panning and zooming
  // useEffect(() => {
  //   console.log("viewport: ", viewport);
  // }, [viewport]);

  // for layer testing debugging
  // useEffect(() => {
  //   console.log("selected id: ", selectedId);
  //   console.log("editMode: ", editMode);
  // }, [selectedId, editMode]);

  useEffect(() => {
    const stage = canvasRef.current;
    const pos = stage?.getPointerPosition();

    console.log("mouse position: ", pos);
  }, [canvasRef]);

  return (
    <>
      <div>
        <div ref={containerRef} className="mainCanvas">
          <Stage
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            scaleX={viewport.scale}
            scaleY={viewport.scale}
          >
            {/* color of the canvas only */}
            <Layer>
              <Rect
                x={viewport.x}
                y={viewport.y}
                width={canvasSize.width}
                height={canvasSize.height}
                fill={bgColor || "white"}
                listening={true}
                draggable
              />
            </Layer>
            <Layer ref={uiLayerRef}>
              {
                // for identifying transparent bg
                bgColor === "" ? <Text x={0} y={0} text="transparent background" /> : ""
              }
              {/* canvas background color */}
            </Layer>
            {/* panning layer or the front layer canvas*/}
            <Layer>
              <Rect
                x={viewport.x}
                y={viewport.y}
                width={canvasSize.width}
                height={canvasSize.height}
                fill="transparent"
                draggable
                onclick={(e: KonvaEventObject<PointerEvent>) => {
                  // for testing mouse position on canvas click
                  if (e.evt.button === 2) return; // ignore right click when checking mouse position

                  const stage = e.target.getStage();
                  const pos = stage?.getPointerPosition();

                  if (!pos) return

                  const canvasX = (pos.x - viewport.x) / viewport.scale;
                  const canvasY = (pos.y - viewport.y) / viewport.scale;

                  console.log(canvasX, canvasY);

                  // when canvas is clicked, it will add a temporary text at the mouse position, this is for testing purposes only
                  setTexts(prev => [...prev,
                  {
                    id: `${prev.length + 1}`,
                    text: `Hello ${prev.length + 1}`, 
                    defaultText: `Hello ${prev.length + 1}`, 
                    x: canvasX / canvasSize.width, 
                    y: canvasY / canvasSize.height, 
                    layerId: prev.length > 0 ? `layer${prev.length + 1}` : 'layer1'
                  }]);
                }}
                onDragMove={(e) => {
                  setViewport(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
                }}
                onDragEnd={(e) => {
                  setViewport(prev => ({ ...prev, x: e.target.x(), y: e.target.y() }));
                }}
                // prevents showing the context menu when right clicking on the canvas
                onContextMenu={(e) => {
                  e.evt.preventDefault();
                  console.log("right click canvas");
                }}
              />
            </Layer>
            {/* layer checking purposes */}
            {texts.map((text) => text.layerId).map((layerId) => (
              <Layer key={layerId} x={viewport.x} y={viewport.y}>
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
          <button type="button" style={{ position: "fixed", top: 550, left: 15 }} onClick={() => resetPosition()}>reset position</button>

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
