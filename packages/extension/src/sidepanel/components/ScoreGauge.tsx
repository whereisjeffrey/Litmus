import React, { useEffect, useRef, useState, useMemo } from "react";

interface CategoryLoss {
  name: string;
  pointsLost: number;
  color: string;
}

interface ScoreGaugeProps {
  score: number;
  categoryLosses: CategoryLoss[];
  pageType: string;
  animated?: boolean;
}

/**
 * Full-circle donut gauge with segmented ring.
 *
 * - The filled arc represents the score (colored by score range).
 * - The unfilled arc is split into colored segments showing WHERE points were lost.
 * - Small gaps between segments for a modern look.
 * - Score number counts up and is centered inside the ring.
 * - Category loss breakdown listed below the ring.
 */
export default function ScoreGauge({
  score,
  categoryLosses,
  pageType,
  animated = true,
}: ScoreGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  // Animation state
  const [displayScore, setDisplayScore] = useState(animated ? 0 : clampedScore);
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1);
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const ANIMATION_DURATION = 1200; // ms

  useEffect(() => {
    if (!animated) {
      setDisplayScore(clampedScore);
      setAnimationProgress(1);
      return;
    }

    startTimeRef.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayScore(Math.round(eased * clampedScore));
      setAnimationProgress(eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [clampedScore, animated]);

  // SVG geometry
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const RADIUS = 78;
  const STROKE_WIDTH = 22;
  const circumference = 2 * Math.PI * RADIUS;
  const GAP_DEGREES = 2.5; // gap between segments in degrees
  const GAP_LENGTH = (GAP_DEGREES / 360) * circumference;

  // Score color
  const scoreColor = useMemo(() => {
    if (clampedScore >= 90) return "#2D7D55"; // deep teal/green
    if (clampedScore >= 75) return "#3D9E6E"; // soft green
    if (clampedScore >= 50) return "#C9A23B"; // warm amber
    return "#D15A4C"; // red/coral
  }, [clampedScore]);

  const scoreLabel = useMemo(() => {
    if (clampedScore >= 90) return "Excellent";
    if (clampedScore >= 75) return "Solid";
    if (clampedScore >= 50) return "Needs Work";
    return "Needs Attention";
  }, [clampedScore]);

  const scoreBg = useMemo(() => {
    if (clampedScore >= 90) return "#F0FAF4";
    if (clampedScore >= 75) return "#F0FAF4";
    if (clampedScore >= 50) return "#FDF8EE";
    return "#FDF2F0";
  }, [clampedScore]);

  // Build the loss segments
  // Filter out zero-loss categories, sort by largest loss first
  const lossSegments = useMemo(() => {
    return categoryLosses
      .filter((c) => c.pointsLost > 0)
      .sort((a, b) => b.pointsLost - a.pointsLost);
  }, [categoryLosses]);

  const totalLost = useMemo(
    () => lossSegments.reduce((sum, c) => sum + c.pointsLost, 0),
    [lossSegments]
  );

  // Score arc (filled portion)
  const scoreArcLength = (clampedScore / 100) * circumference;

  // Loss arc segments — divide the remaining ring among categories
  const lossArcSegments = useMemo(() => {
    if (totalLost === 0 || lossSegments.length === 0) return [];

    const totalLossArc = ((100 - clampedScore) / 100) * circumference;
    const totalGaps = lossSegments.length * GAP_LENGTH;
    const availableArc = Math.max(0, totalLossArc - totalGaps);

    let currentOffset = circumference - scoreArcLength;
    // We need to account for the gap after the score arc
    currentOffset -= GAP_LENGTH / 2;

    return lossSegments.map((seg) => {
      const segLength = (seg.pointsLost / totalLost) * availableArc;
      currentOffset -= segLength + GAP_LENGTH;
      return {
        ...seg,
        arcLength: segLength,
        // dashoffset places the segment: circumference - (position + length) from start
        dashOffset: currentOffset + segLength, // corrected for SVG rotation
      };
    });
  }, [lossSegments, totalLost, clampedScore, circumference, scoreArcLength]);

  // Compute each loss segment's position along the ring.
  // The score arc starts at 12 o'clock (top) and goes clockwise.
  // Loss segments fill the remaining gap, also clockwise, starting where score ends.
  const lossSegmentArcs = useMemo(() => {
    if (totalLost === 0 || lossSegments.length === 0) return [];

    const totalLossArc = ((100 - clampedScore) / 100) * circumference;
    const numGaps = lossSegments.length + 1; // gap before first, between each, after last (before score start)
    const totalGapSpace = numGaps * GAP_LENGTH;
    const availableArc = Math.max(0, totalLossArc - totalGapSpace);

    const arcs: Array<{
      name: string;
      pointsLost: number;
      color: string;
      dashArray: string;
      dashOffset: number;
    }> = [];

    // Start position: right after the score arc + first gap
    let consumedArc = scoreArcLength + GAP_LENGTH;

    for (const seg of lossSegments) {
      const segArc = (seg.pointsLost / totalLost) * availableArc;

      // dasharray: segArc visible, rest invisible
      const dashArray = `${segArc} ${circumference - segArc}`;
      // dashoffset: shift so segment starts at consumedArc from top
      // SVG circle starts at 3 o'clock, we rotate -90 to start at 12 o'clock.
      // dashoffset = circumference - consumedArc
      const dashOffset = circumference - consumedArc;

      arcs.push({
        name: seg.name,
        pointsLost: seg.pointsLost,
        color: seg.color,
        dashArray,
        dashOffset,
      });

      consumedArc += segArc + GAP_LENGTH;
    }

    return arcs;
  }, [lossSegments, totalLost, clampedScore, circumference, scoreArcLength]);

  // Animated score arc
  const animatedScoreArc = scoreArcLength * animationProgress;
  const scoreDashArray = `${animatedScoreArc} ${circumference - animatedScoreArc}`;

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-col items-center">
        {/* SVG Gauge */}
        <div className="relative w-[200px] max-w-full aspect-square">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className="w-full h-full transform -rotate-90"
          >
            {/* Background track (very subtle) */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke="#ECEAE4"
              strokeWidth={STROKE_WIDTH}
              opacity={0.5}
            />

            {/* Loss segments (behind score arc, always visible) */}
            {lossSegmentArcs.map((seg, i) => (
              <circle
                key={i}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                opacity={animationProgress > 0.3 ? Math.min(1, (animationProgress - 0.3) / 0.4) * 0.6 : 0}
                style={{ transition: "opacity 0.3s ease-out" }}
              />
            ))}

            {/* Score arc (on top) */}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={scoreColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={scoreDashArray}
              strokeDashoffset={0}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
            <span
              className="font-semibold text-surface-900"
              style={{ fontSize: 38, lineHeight: 1 }}
            >
              {displayScore}
            </span>
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-2xs font-medium mt-2"
              style={{ backgroundColor: scoreBg, color: scoreColor }}
            >
              {scoreLabel}
            </span>
            <span className="text-2xs text-surface-500 mt-1 capitalize">
              {pageType} page
            </span>
          </div>
        </div>

        {/* Category loss breakdown */}
        {lossSegments.length > 0 && (
          <div className="w-full mt-3 pt-3 border-t border-surface-200">
            <div className="flex flex-col gap-1.5">
              {lossSegments.map((seg) => (
                <div key={seg.name} className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-2xs text-surface-600 truncate flex-1 min-w-0">
                    {seg.name}
                  </span>
                  <span className="text-2xs font-medium text-surface-800 flex-shrink-0">
                    &minus;{seg.pointsLost}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
