import React, { useRef, useState, useEffect } from "react";

interface Canvas28Props {
  onExport: (blob: Blob) => void;
}

const Canvas28: React.FC<Canvas28Props> = ({ onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [inverted, setInverted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    resetCanvas(ctx);
  }, [inverted]);

  const resetCanvas = (ctx?: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current!;
    const context = ctx || canvas.getContext("2d")!;
    context.fillStyle = inverted ? "#000000" : "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.MouseEvent) => {
    setDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setDrawing(false);
    canvasRef.current!.getContext("2d")!.beginPath();
  };

  const draw = (e: React.MouseEvent) => {
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.lineWidth = 20;
    ctx.lineCap = "round";
    ctx.strokeStyle = inverted ? "#ffffff" : "#000000";

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const clearCanvas = () => {
    resetCanvas();
  };

  const toggleInvert = () => {
    setInverted((prev) => !prev);
  };

  const export28x28 = async () => {
    const src = canvasRef.current!;
    const out = document.createElement("canvas");
    out.width = 28;
    out.height = 28;
    const octx = out.getContext("2d")!;
    octx.imageSmoothingEnabled = true;
    octx.fillStyle = "#ffffff"; // siempre exportamos fondo blanco
    octx.fillRect(0, 0, 28, 28);
    octx.drawImage(src, 0, 0, src.width, src.height, 0, 0, 28, 28);

    // 👇 Si estaba en modo invertido, invertimos los píxeles
    if (inverted) {
      const imgData = octx.getImageData(0, 0, 28, 28);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i]; // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
      }
      octx.putImageData(imgData, 0, 0);
    }

    const blob = await new Promise<Blob>((res) =>
      out.toBlob((b) => res(b!), "image/png")
    );
    onExport(blob);
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={280}
        height={280}
        className="border border-gray-400 rounded-lg bg-white"
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
        onMouseLeave={endDrawing}
      />
      <div className="flex space-x-2">
        <button
          onClick={clearCanvas}
          className="px-4 py-2 bg-red-500 text-white rounded-lg shadow"
        >
          Limpiar
        </button>
        <button
          onClick={toggleInvert}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg shadow"
        >
          Invertir
        </button>
        <button
          onClick={export28x28}
          className="px-4 py-2 bg-green-500 text-white rounded-lg shadow"
        >
          Exportar 28x28
        </button>
      </div>
    </div>
  );
};

export default Canvas28;
