import React, { useRef, useEffect, useState } from 'react';
import { Flame, Wind, Sparkles, AlertCircle, RefreshCw, Volume2, ShieldAlert, Zap, Orbit, Activity } from 'lucide-react';
import { GasDefinition, FuelDefinition } from '../types';

interface ChamberCanvasProps {
  gases: Record<string, number>;
  pressureKpa: number;
  gravityG: number;
  ventilationSpeed: number; // m/s
  fuel: FuelDefinition;
  isIgnited: boolean;
  onToggleIgnite: () => void;
  onCutVentilation: () => void;
  onPurgeChamber: () => void;
  isBeginnerMode: boolean;
  flameTempK: number;
  dangerLevel: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxLife: number;
  life: number;
  color: string;
  type: 'soot' | 'radical' | 'spark' | 'smoke';
}

export const ChamberCanvas: React.FC<ChamberCanvasProps> = ({
  gases,
  pressureKpa,
  gravityG,
  ventilationSpeed,
  fuel,
  isIgnited,
  onToggleIgnite,
  onCutVentilation,
  onPurgeChamber,
  isBeginnerMode,
  flameTempK,
  dangerLevel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const [sparkAnimation, setSparkAnimation] = useState<number>(0);

  // Oxygen starvation timer when g=0 and vent=0
  const [starvationProgress, setStarvationProgress] = useState<number>(0);
  const [isSuffocated, setIsSuffocated] = useState<boolean>(false);

  // Check if gas mix can burn
  const o2 = (gases?.O2 || 0) + (gases?.N2O || 0) * 0.7;
  const novec = gases?.Novec || 0;
  const sf6 = gases?.SF6 || 0;
  const co2 = gases?.CO2 || 0;
  const h2 = gases?.H2 || 0;
  const ch4 = gases?.CH4 || 0;
  const sih4 = gases?.SiH4 || 0;
  const nh3 = gases?.NH3 || 0;
  const c3h8 = gases?.C3H8 || 0;
  const c2h4 = gases?.C2H4 || 0;

  // Silane auto-ignites if O2 is present!
  const isSilaneAutoIgnited = sih4 > 1.2 && o2 > 10;
  const canCombust = (o2 >= 11 && novec <= 6 && sf6 <= 8 && co2 < 38) || isSilaneAutoIgnited;

  // Trigger spark animation effect
  const handleSparkTrigger = () => {
    setSparkAnimation(20);
    onToggleIgnite();
  };

  // Suffocation simulation in stagnant 0-G
  useEffect(() => {
    let interval: any = null;
    if (isIgnited && gravityG === 0 && ventilationSpeed === 0 && canCombust) {
      interval = setInterval(() => {
        setStarvationProgress((prev) => {
          if (prev >= 100) {
            setIsSuffocated(true);
            return 100;
          }
          return prev + 2.5; // Suffocates in ~4 seconds of stagnant air
        });
      }, 100);
    } else {
      setStarvationProgress(0);
      setIsSuffocated(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isIgnited, gravityG, ventilationSpeed, canCombust]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height * 0.58;

      // 1. Deep Space Atmospheric Chamber Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Subtle metallic viewport rim gradient
      const chamberGlow = ctx.createRadialGradient(cx, cy, 50, cx, cy, width * 0.65);
      chamberGlow.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
      chamberGlow.addColorStop(0.7, 'rgba(6, 10, 20, 0.85)');
      chamberGlow.addColorStop(1, '#020617');
      ctx.fillStyle = chamberGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Tech Precision Grid & Crosshairs
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.35)';
      ctx.lineWidth = 1;
      const gridSize = 36;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Chamber center calibration concentric rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.setLineDash([4, 4]);
      [50, 100, 160].forEach((r) => {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // 3. Ventilation Streamlines (Air Flow Vectors)
      if (ventilationSpeed > 0) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.lineWidth = 1.5;
        const speedFactor = ventilationSpeed * 40;
        for (let row = 0; row < 6; row++) {
          const y = height * 0.22 + row * 40;
          const offset = (time * speedFactor * 12) % width;
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();

          // Streamline arrowheads
          const ax = offset;
          ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
          ctx.beginPath();
          ctx.moveTo(ax, y - 3.5);
          ctx.lineTo(ax + 9, y);
          ctx.lineTo(ax, y + 3.5);
          ctx.fill();
        }
      }

      // 4. Burner Platform & Sample Stage
      // Base pedestal
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 42, cy + 32, 84, 18, 5);
      ctx.fill();
      ctx.stroke();

      // Metallic clamp teeth
      ctx.fillStyle = '#475569';
      ctx.fillRect(cx - 32, cy + 24, 10, 8);
      ctx.fillRect(cx + 22, cy + 24, 10, 8);

      // Fuel Sample Core
      let fuelFill = '#f59e0b';
      if (fuel.id === 'hydrogen_jet') fuelFill = '#ec4899';
      else if (fuel.id === 'nomex_suit') fuelFill = '#0284c7';
      else if (fuel.id === 'silane_leak') fuelFill = '#06b6d4';
      else if (fuel.id === 'ammonia_coolant') fuelFill = '#84cc16';
      else if (fuel.id === 'lithium_battery') fuelFill = '#ef4444';

      ctx.fillStyle = fuelFill;
      ctx.shadowColor = fuelFill;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(cx - 20, cy + 18, 40, 14, 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Fuel sample label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(fuel.name.slice(0, 26).toUpperCase(), cx, cy + 66);

      // 5. Electric Spark Arc Animation
      if (sparkAnimation > 0) {
        setSparkAnimation((prev) => Math.max(0, prev - 1));
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx - 24, cy + 10);
        ctx.lineTo(cx - 10, cy + 5 + (Math.random() - 0.5) * 10);
        ctx.lineTo(cx, cy + 10 + (Math.random() - 0.5) * 10);
        ctx.lineTo(cx + 10, cy + 5 + (Math.random() - 0.5) * 10);
        ctx.lineTo(cx + 24, cy + 10);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      const effectivelyBurning = (isIgnited || isSilaneAutoIgnited) && canCombust && !isSuffocated;

      if (effectivelyBurning) {
        // Compute Flame Color & Glow based on gas chemistry
        let coreColor = 'rgba(56, 189, 248, ';
        let outerColor = 'rgba(251, 146, 60, ';
        let isGhostHydrogen = h2 > 4 && ch4 < 4 && c3h8 < 2 && sih4 < 1;
        let isPureOxygenInferno = o2 > 45;
        let isSilaneWhiteFire = sih4 > 1.2;
        let isAmmoniaGreenish = nh3 > 8;
        let isHeavySootHydrocarbon = c3h8 > 2 || c2h4 > 2;

        if (isSilaneWhiteFire) {
          // Blinding white-silver pyrophoric flame with silica smoke
          coreColor = 'rgba(255, 255, 255, ';
          outerColor = 'rgba(207, 250, 254, ';
        } else if (isAmmoniaGreenish) {
          // Faint yellow-greenish ammonia flame
          coreColor = 'rgba(190, 242, 100, ';
          outerColor = 'rgba(234, 179, 8, ';
        } else if (isHeavySootHydrocarbon) {
          // Deep radiant orange / golden flame
          coreColor = 'rgba(249, 115, 22, ';
          outerColor = 'rgba(234, 88, 12, ';
        } else if (isGhostHydrogen) {
          // Nearly invisible pale violet/blue hydrogen flame
          coreColor = 'rgba(192, 132, 252, ';
          outerColor = 'rgba(244, 114, 182, ';
        } else if (ch4 > 4) {
          // Methane rich blue with soot
          coreColor = 'rgba(14, 165, 233, ';
          outerColor = 'rgba(234, 179, 8, ';
        } else if (isPureOxygenInferno) {
          // Blinding white/yellow
          coreColor = 'rgba(255, 255, 255, ';
          outerColor = 'rgba(251, 191, 36, ';
        }

        // Flame Dimensions
        const starvationFade = 1 - starvationProgress / 100;
        let baseRadius = 40 * starvationFade;
        if (gravityG === 0) baseRadius *= 1.25;
        if (isPureOxygenInferno) baseRadius *= 1.4;

        // Forced ventilation stretches flame downwind
        const windShiftX = ventilationSpeed * 50;
        const flameCenterX = cx + windShiftX;
        const flameCenterY = cy;

        // Dynamic Chamber Ambient Illumination from flame
        const ambientReflect = ctx.createRadialGradient(flameCenterX, flameCenterY, 10, flameCenterX, flameCenterY, width * 0.45);
        ambientReflect.addColorStop(0, coreColor + (isGhostHydrogen ? '0.15)' : '0.28)'));
        ambientReflect.addColorStop(0.6, outerColor + (isGhostHydrogen ? '0.04)' : '0.12)'));
        ambientReflect.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ambientReflect;
        ctx.fillRect(0, 0, width, height);

        // Heat Radiation Halo (Schlieren shimmer)
        const radGradient = ctx.createRadialGradient(
          flameCenterX,
          flameCenterY,
          baseRadius * 0.2,
          flameCenterX,
          flameCenterY,
          baseRadius * 2.6
        );
        radGradient.addColorStop(0, coreColor + (isGhostHydrogen ? '0.22)' : '0.45)'));
        radGradient.addColorStop(0.5, outerColor + (isGhostHydrogen ? '0.08)' : '0.22)'));
        radGradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = radGradient;
        ctx.beginPath();
        ctx.arc(flameCenterX, flameCenterY, baseRadius * 2.6, 0, Math.PI * 2);
        ctx.fill();

        // Combustion Morphology
        if (gravityG === 0) {
          // ==================== ZERO-G SPHERICAL DIFFUSION FLAME ====================
          const breathePulse = Math.sin(time * 3) * 2.2;
          const sphereR = Math.max(9, baseRadius + breathePulse);

          if (ventilationSpeed > 0.05) {
            // Asymmetric teardrop trailing in airflow
            ctx.save();
            ctx.translate(cx, cy);
            ctx.beginPath();
            ctx.moveTo(-sphereR * 0.7, 0);
            ctx.bezierCurveTo(
              -sphereR * 0.5,
              -sphereR,
              windShiftX * 0.5,
              -sphereR * 0.8,
              windShiftX * 1.5,
              0
            );
            ctx.bezierCurveTo(
              windShiftX * 0.5,
              sphereR * 0.8,
              -sphereR * 0.5,
              sphereR,
              -sphereR * 0.7,
              0
            );

            const eggGrad = ctx.createRadialGradient(0, 0, 4, windShiftX * 0.8, 0, sphereR * 1.5);
            eggGrad.addColorStop(0, coreColor + (isGhostHydrogen ? '0.4)' : '0.9)'));
            eggGrad.addColorStop(0.6, outerColor + (isGhostHydrogen ? '0.15)' : '0.55)'));
            eggGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = eggGrad;
            ctx.fill();
            ctx.restore();
          } else {
            // Pure quiescent spherical flame
            const sphereGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, sphereR);
            sphereGrad.addColorStop(0, coreColor + (isGhostHydrogen ? '0.35)' : '0.85)'));
            sphereGrad.addColorStop(0.7, coreColor + (isGhostHydrogen ? '0.5)' : '0.72)'));
            sphereGrad.addColorStop(0.92, outerColor + (isGhostHydrogen ? '0.2)' : '0.65)'));
            sphereGrad.addColorStop(1, 'rgba(0,0,0,0)');

            ctx.fillStyle = sphereGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, sphereR, 0, Math.PI * 2);
            ctx.fill();

            // Concentric Radical Emission Shell (OH* UV-Blue Edge)
            ctx.strokeStyle = coreColor + (isGhostHydrogen ? '0.4)' : '0.7)');
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, cy, sphereR * 0.98, 0, Math.PI * 2);
            ctx.stroke();

            // NASA Saffire Soot shell ring
            if ((fuel.sootIndex > 3 || isHeavySootHydrocarbon) && !isGhostHydrogen) {
              ctx.strokeStyle = `rgba(217, 119, 6, ${0.45 * starvationFade})`;
              ctx.lineWidth = 2.5;
              ctx.setLineDash([6, 5]);
              ctx.beginPath();
              ctx.arc(cx, cy, sphereR * 1.18, 0, Math.PI * 2);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        } else {
          // ==================== 1G BUOYANT TEARDROP FLAME ====================
          const flicker = Math.sin(time * 16) * 4.5 + Math.cos(time * 24) * 3;
          const flameH = (baseRadius * 2.3 + flicker) * (gravityG === 1 ? 1.0 : gravityG > 0.3 ? 0.82 : 0.65);
          const flameW = baseRadius * 0.85;

          ctx.save();
          ctx.translate(cx + windShiftX * 0.4, cy + 10);

          ctx.beginPath();
          ctx.moveTo(-flameW * 0.6, 0);
          ctx.quadraticCurveTo(-flameW * 0.8, -flameH * 0.45, 0, -flameH);
          ctx.quadraticCurveTo(flameW * 0.8, -flameH * 0.45, flameW * 0.6, 0);
          ctx.closePath();

          const teardropGrad = ctx.createLinearGradient(0, 0, 0, -flameH);
          teardropGrad.addColorStop(0, coreColor + '0.92)');
          teardropGrad.addColorStop(0.3, coreColor + '0.78)');
          teardropGrad.addColorStop(0.7, outerColor + '0.88)');
          teardropGrad.addColorStop(1, isGhostHydrogen ? 'rgba(216, 180, 254, 0.25)' : 'rgba(245, 158, 11, 0.98)');

          ctx.fillStyle = teardropGrad;
          ctx.fill();
          ctx.restore();
        }

        // Particle generator
        if (Math.random() < 0.65) {
          const pAngle = Math.random() * Math.PI * 2;
          const pDist = Math.random() * baseRadius * 0.65;
          const isWhiteSilica = isSilaneWhiteFire;

          particlesRef.current.push({
            x: flameCenterX + Math.cos(pAngle) * pDist,
            y: flameCenterY + Math.sin(pAngle) * pDist,
            vx: (ventilationSpeed * 2.2) + (gravityG === 0 ? (Math.random() - 0.5) * 0.7 : (Math.random() - 0.5) * 0.9),
            vy: gravityG === 0 ? (Math.random() - 0.5) * 0.7 : - (gravityG * 2.8 + Math.random() * 2),
            size: isWhiteSilica ? Math.random() * 3 + 1.5 : Math.random() * 3 + 1,
            alpha: 1,
            maxLife: 45 + Math.random() * 30,
            life: 0,
            color: isWhiteSilica ? '#f8fafc' : isHeavySootHydrocarbon ? '#ea580c' : fuel.sootIndex > 4 ? '#d97706' : '#38bdf8',
            type: isWhiteSilica ? 'smoke' : Math.random() < 0.7 ? 'soot' : 'radical',
          });
        }
      }

      // Update & Render Particles
      particlesRef.current.forEach((p) => {
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha = 1 - p.life / p.maxLife;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // Purge dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      // Starvation Boundary Warning (0-G Stagnant Air)
      if (gravityG === 0 && ventilationSpeed === 0 && isIgnited && canCombust) {
        ctx.strokeStyle = `rgba(239, 68, 68, ${0.45 + Math.sin(time * 6) * 0.35})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(cx, cy, 78, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#f87171';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        if (isSuffocated) {
          ctx.fillText('SUFFOCATED: CO₂ CLOUD SMOTHERED FLAME', cx, cy - 88);
        } else {
          ctx.fillText(`SELF-SUFFOCATING: ${Math.round(starvationProgress)}% OXYGEN CONSUMED`, cx, cy - 88);
        }
      }

      // Chamber Telemetry HUD Overlay
      ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(14, 14, 230, 84, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '11px JetBrains Mono';
      ctx.textAlign = 'left';
      ctx.fillText(`NULL-G CHAMBER: ${pressureKpa.toFixed(1)} kPa | ${(pressureKpa * 0.145038).toFixed(1)} psi`, 22, 32);
      ctx.fillText(`ACCELERATION: ${gravityG.toFixed(2)} g (${gravityG === 0 ? 'Microgravity' : gravityG === 0.16 ? 'Lunar' : gravityG === 0.38 ? 'Mars' : 'Earth'})`, 22, 48);
      ctx.fillText(`VENT VECTOR: ${ventilationSpeed.toFixed(2)} m/s`, 22, 64);
      ctx.fillStyle = effectivelyBurning ? '#f59e0b' : '#64748b';
      ctx.fillText(`FLAME TEMP: ${effectivelyBurning ? flameTempK + ' K' : '298 K (Ambient)'}`, 22, 80);

      // Gravitational Compass Indicator (Right Top)
      const gx = width - 40;
      const gy = 40;
      ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
      ctx.beginPath();
      ctx.arc(gx, gy, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      if (gravityG === 0) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('0-g', gx, gy + 3.5);
      } else {
        ctx.strokeStyle = '#f59e0b';
        ctx.fillStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(gx, gy - 8);
        ctx.lineTo(gx, gy + 8);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(gx - 4, gy + 4);
        ctx.lineTo(gx, gy + 10);
        ctx.lineTo(gx + 4, gy + 4);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    gases,
    pressureKpa,
    gravityG,
    ventilationSpeed,
    fuel,
    isIgnited,
    isSuffocated,
    starvationProgress,
    canCombust,
    flameTempK,
    sparkAnimation,
  ]);

  return (
    <div className="relative rounded-2xl bg-slate-900/80 border border-slate-800 p-4 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Orbit className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '15s' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wider text-white uppercase font-mono flex items-center gap-2">
              NULL-G Combustion Chamber
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {gravityG === 0 ? '0-G Microgravity' : `${gravityG.toFixed(2)}g Gravity`}
              </span>
            </h2>
          </div>
        </div>

        {/* Status tag */}
        <div className="flex items-center gap-2">
          {isSuffocated ? (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              SMOTHERED IN CO₂ BUBBLE
            </span>
          ) : isSilaneAutoIgnited ? (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
              PYROPHORIC AUTO-IGNITION
            </span>
          ) : !canCombust ? (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              NON-FLAMMABLE
            </span>
          ) : isIgnited ? (
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              FLAME ACTIVE
            </span>
          ) : (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              STANDBY
            </span>
          )}
        </div>
      </div>

      {/* Canvas view - 100% clean and unobstructed */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800/90 shadow-inner">
        <canvas
          ref={canvasRef}
          width={720}
          height={405}
          className="w-full h-full object-cover block"
        />
      </div>

      {/* Astronomy Cadet Look-Up - Moved cleanly below the canvas to prevent blocking the flame! */}
      {isBeginnerMode && (
        <div className="mt-2.5 p-3 rounded-xl bg-slate-950/90 border border-cyan-500/30 text-xs text-slate-200 shadow-md">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-cyan-300 font-mono">Astronomy Cadet Look-Up:</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono ml-auto">
              {gravityG === 0 ? '0-G Observation' : `${gravityG}g Observation`}
            </span>
          </div>
          {gravityG === 0 ? (
            ventilationSpeed === 0 ? (
              <p className="leading-relaxed text-slate-300">
                Notice how fire in zero-g is a <b>calm glowing blue ball</b>! Since there is no gravity, hot air doesn’t rise. Without air conditioning fans, it suffocates in its own smoke bubble!
              </p>
            ) : (
              <p className="leading-relaxed text-slate-300">
                The spaceship air vent is on! Fresh air pushes in from the left, stretching the sphere into an aerodynamic tail and keeping it fed with oxygen.
              </p>
            )
          ) : (
            <p className="leading-relaxed text-slate-300">
              Under {gravityG}g gravity, lighter hot air floats upward like a hot air balloon, pulling cold air in at the base and creating a tall, flickering flame!
            </p>
          )}
        </div>
      )}

      {/* Chamber Action Toolbar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2.5 mt-1">
        <button
          onClick={handleSparkTrigger}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs font-mono transition-all active:scale-95 ${
            isIgnited
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          {isIgnited ? 'Extinguish Flame' : 'Trigger Spark Arc'}
        </button>

        <button
          onClick={onCutVentilation}
          disabled={ventilationSpeed === 0}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs font-mono border transition-all active:scale-95 ${
            ventilationSpeed === 0
              ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-amber-600/20 hover:bg-amber-600/30 border-amber-500/40 text-amber-300'
          }`}
        >
          <Wind className="w-4 h-4" />
          Cut Fans (0.0 m/s)
        </button>

        <button
          onClick={onPurgeChamber}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-xs font-mono bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 transition-all active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          Purge with 100% N₂
        </button>

        <div className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <ShieldAlert className="w-4 h-4 mr-1.5 text-cyan-400" />
          <span>Threat: <strong className="text-white">{dangerLevel}</strong></span>
        </div>
      </div>
    </div>
  );
};
