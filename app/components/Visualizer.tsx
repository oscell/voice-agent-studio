"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import {
  MicrophoneState,
  useMicrophone,
} from "../context/MicrophoneContextProvider";

const interpolateColor = (
  startColor: number[],
  endColor: number[],
  factor: number
): number[] => {
  const result = [];
  for (let i = 0; i < startColor.length; i++) {
    result[i] = Math.round(
      startColor[i] + factor * (endColor[i] - startColor[i])
    );
  }
  return result;
};

const Visualizer = (): JSX.Element | null => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothedDataRef = useRef<number[]>([]);
  const setupRequestedRef = useRef(false);

  const { microphone, setupMicrophone, startMicrophone, microphoneState } =
    useMicrophone();
  const { resolvedTheme } = useTheme();
  const themeRef = useRef(resolvedTheme);

  useEffect(() => {
    themeRef.current = resolvedTheme;
  }, [resolvedTheme]);

  // Request microphone access once.
  useEffect(() => {
    if (
      microphoneState !== MicrophoneState.NotSetup ||
      setupRequestedRef.current
    ) {
      return;
    }

    setupRequestedRef.current = true;

    const initializeMicrophone = async () => {
      try {
        await setupMicrophone();
      } catch (err: unknown) {
        console.error("Microphone setup failed", err);
      }
    };

    void initializeMicrophone();
  }, [microphoneState, setupMicrophone]);

  // Start or resume recording when the microphone is ready.
  useEffect(() => {
    if (!microphone) return;
    if (
      microphoneState === MicrophoneState.Ready ||
      microphoneState === MicrophoneState.Paused
    ) {
      startMicrophone();
    }
  }, [microphone, microphoneState, startMicrophone]);

  // Wire the analyser and render the bars.
  useEffect(() => {
    if (!microphone) return;

    const AudioContextCtor =
      typeof window !== "undefined" &&
      ((window as any).AudioContext || (window as any).webkitAudioContext);
    if (!AudioContextCtor) return;

    const audioContext =
      audioContextRef.current ?? (new AudioContextCtor() as AudioContext);
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    const analyser = analyserRef.current ?? audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(microphone.stream);
    source.connect(analyser);

    const dataArray =
      dataArrayRef.current ??
      (new Uint8Array(
        analyser.frequencyBinCount
      ) as Uint8Array<ArrayBuffer>);
    dataArrayRef.current = dataArray;

    // Initialize smoothed data array
    if (smoothedDataRef.current.length !== dataArray.length) {
      smoothedDataRef.current = new Array(dataArray.length).fill(0);
    }

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Size canvas to its container on each frame to respond to layout changes.
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      const context = canvas.getContext("2d");
      if (!context) return;

      const { width, height } = canvas;
      const centerY = height / 2;

      // Clear with a subtle fade effect for trail
      context.fillStyle = themeRef.current === "dark" ? "rgba(0, 0, 0, 0.15)" : "rgba(255, 255, 255, 0.15)";
      context.fillRect(0, 0, width, height);

      analyser.getByteFrequencyData(dataArray);

      // Smooth the data for less jittery visualization
      const smoothingFactor = 0.15;
      dataArray.forEach((value, index) => {
        smoothedDataRef.current[index] =
          smoothedDataRef.current[index] * (1 - smoothingFactor) +
          value * smoothingFactor;
      });

      // Calculate average amplitude and peak for dynamic effects
      const avgAmplitude =
        smoothedDataRef.current.reduce((a, b) => a + b, 0) /
        smoothedDataRef.current.length;
      const peakAmplitude = Math.max(...smoothedDataRef.current);
      const normalizedAvg = avgAmplitude / 255;
      const normalizedPeak = peakAmplitude / 255;
      
      // Dynamic scale factor that responds to volume
      const scaleFactor = 1 + normalizedAvg * 0.3 + normalizedPeak * 0.2;

      // Draw mirrored bars from center
      // Stretch the first 1/3 of frequency bars to fill the full width
      const totalBarCount = Math.min(smoothedDataRef.current.length, 200);
      const barCount = Math.max(1, Math.floor(totalBarCount / 3)); // Use first third
      const barWidth = Math.max(width / barCount, 2);
      const spacing = barWidth * 0.25;
      const actualBarWidth = barWidth - spacing;

      // Dynamic color palette that shifts with volume
      // Base colors shift based on overall amplitude
      const volumeShift = normalizedAvg * 0.5; // 0 to 0.5 shift factor
      
      const baseColorStops = [
        [19, 239, 147],   // Cyan-green
        [20, 154, 251],   // Blue
        [138, 43, 226],   // Purple
        [255, 20, 147],   // Pink
        [255, 140, 0],    // Orange
      ];
      
      // Shift colors based on volume - warmer colors at higher volumes
      const colorStops = baseColorStops.map((color, idx) => {
        const shiftAmount = volumeShift * (idx / (baseColorStops.length - 1));
        return [
          Math.min(255, color[0] + shiftAmount * 30),
          Math.min(255, color[1] + shiftAmount * 20),
          Math.min(255, color[2] - shiftAmount * 15),
        ];
      });

      // Only use the first third of frequency data, stretched to full width
      smoothedDataRef.current.slice(0, barCount).forEach((value, index) => {
        const normalizedValue = value / 255;
        // Use more of the screen - up to 85% instead of 45%
        const baseBarHeight = normalizedValue * (height * 0.85);
        
        // Enhanced dynamic scaling with exponential curve for more dramatic effect
        const exponentialScale = Math.pow(normalizedValue, 0.7);
        const dynamicHeight = baseBarHeight * scaleFactor * (0.8 + exponentialScale * 0.4);
        
        // Color interpolation based on position, amplitude, and volume
        // Map position to full spectrum (0 to 1) even though we're only showing first third
        const positionFactor = index / barCount;
        const colorIndex = Math.floor(positionFactor * (colorStops.length - 1));
        const nextColorIndex = Math.min(
          colorIndex + 1,
          colorStops.length - 1
        );
        const localFactor =
          (positionFactor * (colorStops.length - 1)) % 1;
        
        const baseColor = interpolateColor(
          colorStops[colorIndex],
          colorStops[nextColorIndex],
          localFactor
        );
        
        // Enhanced intensity-based color variation that responds to volume
        const intensityBoost = normalizedValue * (0.4 + normalizedAvg * 0.3);
        const volumeColorShift = normalizedAvg * 20;
        const finalColor = baseColor.map((c, i) => {
          const boosted = c + intensityBoost * 60 + volumeColorShift;
          return Math.min(255, Math.max(0, boosted));
        });

        const x = index * barWidth + spacing / 2;

        // Create dynamic gradient that changes with volume
        const gradientStartY = centerY - dynamicHeight;
        const gradientEndY = centerY + dynamicHeight;
        const gradient = context.createLinearGradient(
          x,
          gradientStartY,
          x,
          gradientEndY
        );

        // Gradient stops that intensify with volume
        const baseOpacity = 0.5 + normalizedAvg * 0.3;
        const topOpacity = Math.min(0.95, baseOpacity + normalizedValue * 0.4);
        const midOpacity = topOpacity * 0.75;
        const bottomOpacity = topOpacity * 0.4;
        
        // Add color variation along the gradient based on volume
        const topColorIntensity = 1 + normalizedAvg * 0.2;
        const topGradientColor = finalColor.map(c => 
          Math.min(255, c * topColorIntensity)
        );
        
        gradient.addColorStop(
          0,
          `rgba(${Math.round(topGradientColor[0])}, ${Math.round(topGradientColor[1])}, ${Math.round(topGradientColor[2])}, ${topOpacity})`
        );

        gradient.addColorStop(
          0.3,
          `rgba(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]}, ${midOpacity})`
        );

        gradient.addColorStop(
          0.7,
          `rgba(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]}, ${midOpacity * 0.8})`
        );

        gradient.addColorStop(
          1,
          `rgba(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]}, ${bottomOpacity})`
        );

        context.fillStyle = gradient;

        // Helper function to draw rounded rectangle
        const drawRoundedRect = (
          ctx: CanvasRenderingContext2D,
          x: number,
          y: number,
          width: number,
          height: number,
          radius: number
        ) => {
          ctx.beginPath();
          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + width - radius, y);
          ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
          ctx.lineTo(x + width, y + height - radius);
          ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
          ctx.lineTo(x + radius, y + height);
          ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
          ctx.lineTo(x, y + radius);
          ctx.quadraticCurveTo(x, y, x + radius, y);
          ctx.closePath();
        };

        // Draw rounded rectangle bars (top)
        const topY = centerY - dynamicHeight;
        const radius = Math.min(actualBarWidth * 0.4, 5);
        
        drawRoundedRect(context, x, topY, actualBarWidth, dynamicHeight, radius);
        context.fill();

        // Draw mirrored bar (bottom)
        const bottomY = centerY;
        drawRoundedRect(context, x, bottomY, actualBarWidth, dynamicHeight, radius);
        context.fill();

        // Enhanced glow effect that scales with volume
        if (normalizedValue > 0.3) {
          const glowIntensity = normalizedValue * (1 + normalizedAvg * 0.5);
          context.shadowBlur = 20 * glowIntensity;
          context.shadowColor = `rgba(${finalColor[0]}, ${finalColor[1]}, ${finalColor[2]}, ${0.5 + normalizedAvg * 0.3})`;
          
          // Redraw with enhanced glow
          drawRoundedRect(context, x, topY, actualBarWidth, dynamicHeight, radius);
          context.fill();

          drawRoundedRect(context, x, bottomY, actualBarWidth, dynamicHeight, radius);
          context.fill();

          context.shadowBlur = 0;
        }
        
        // Add subtle highlight on top of bars for extra depth
        if (normalizedValue > 0.4) {
          const highlightGradient = context.createLinearGradient(
            x,
            topY,
            x,
            topY + dynamicHeight * 0.3
          );
          highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${normalizedValue * 0.15})`);
          highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          
          context.fillStyle = highlightGradient;
          drawRoundedRect(context, x, topY, actualBarWidth, dynamicHeight * 0.3, radius);
          context.fill();
          
          // Reset to main gradient for bottom bar highlight
          const bottomHighlightGradient = context.createLinearGradient(
            x,
            bottomY,
            x,
            bottomY + dynamicHeight * 0.3
          );
          bottomHighlightGradient.addColorStop(0, `rgba(255, 255, 255, ${normalizedValue * 0.15})`);
          bottomHighlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
          
          context.fillStyle = bottomHighlightGradient;
          drawRoundedRect(context, x, bottomY, actualBarWidth, dynamicHeight * 0.3, radius);
          context.fill();
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);

    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      source.disconnect();
    };
  }, [microphone]);

  // Cleanup audio context on unmount.
  useEffect(() => {
    return () => {
      animationRef.current && cancelAnimationFrame(animationRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none opacity-70"
    />
  );
};

export default Visualizer;
