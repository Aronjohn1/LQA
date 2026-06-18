import React, { useRef, useEffect, useState } from "react";
import jsQR from "jsqr";
const CameraScanner = ({
  onScan,
  onError
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment"
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      startScanning();
    } catch (err) {
      console.error("Camera error:", err);
      onError(err);
    }
  };
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
  };
  const startScanning = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const scan = () => {
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height);
      if (code) {
        onScan(code.data);
      }
      setTimeout(() => requestAnimationFrame(scan), 400);
    };
    requestAnimationFrame(scan);
  };
  return <div>
      <video ref={videoRef} autoPlay muted className="w-full rounded-[8px] bg-[#000]" />

      <canvas ref={canvasRef} className="hidden" />
    </div>;
};
export default CameraScanner;
