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
 * Semi-circle (180-degree) gauge with segmented ring.
 *
 * - Half-circle arc with a thick ring (~20px stroke).
 * - Segments in muted pastel blue tones.
 * - Score number large and bold, centered below the arc.
 * - Label below the number based on score range.
 * - Category loss breakdown below in a clean row layout.
 */

// Pastel blue/purple segment palette (replaces per-category colors)
const SEGMENT_PALETTE = [
  "#93C5FD", // blue-300
  "#A5B4FC", // indigo-300
  "#BAE6FD", // sky-200
  "#C7D2FE", // indigo-200
  "#BFDBFE", // blue-200
  "#DDD6FE", // violet-200
];

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

  const ANIMATION_DURATION = 1200;

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

  // SVG geometry — semi-circle
  const WIDTH = 240;
  const HEIGHT = 140;
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = 120;
  const RADIUS = 90;
  const STROKE_WIDTH = 20;
  const halfCircumference = Math.PI * RADIUS; // 180 degrees
  const GAP_DEGREES = 2;
  const GAP_LENGTH = (GAP_DEGREES / 180) * halfCircumference;

  // Score color — all blue, darker = higher score
  const scoreColor = useMemo(() => {
    if (clampedScore >= 90) return "#1D4ED8";
    if (clampedScore >= 75) return "#2563EB";
    if (clampedScore >= 50) return "#3B82F6";
    return "#60A5FA";
  }, [clampedScore]);

  const scoreLabel = useMemo(() => {
    if (clampedScore >= 90) return "Excellent";
    if (clampedScore >= 75) return "Good";
    if (clampedScore >= 50) return "Needs Work";
    return "Needs Attention";
  }, [clampedScore]);

  const scoreLabelColor = useMemo(() => {
    if (clampedScore >= 90) return "#1D4ED8";
    if (clampedScore >= 75) return "#2563EB";
    if (clampedScore >= 50) return "#3B82F6";
    return "#60A5FA";
  }, [clampedScore]);

  // Build the loss segments
  const lossSegments = useMemo(() => {
    return categoryLosses
      .filter((c) => c.pointsLost > 0)
      .sort((a, b) => b.pointsLost - a.pointsLost);
  }, [categoryLosses]);

  const totalLost = useMemo(
    () => lossSegments.reduce((sum, c) => sum + c.pointsLost, 0),
    [lossSegments]
  );

  // Score arc (filled portion of semi-circle)
  const scoreArcLength = (clampedScore / 100) * halfCircumference;

  // Loss arc segments
  const lossSegmentArcs = useMemo(() => {
    if (totalLost === 0 || lossSegments.length === 0) return [];

    const totalLossArc = ((100 - clampedScore) / 100) * halfCircumference;
    const numGaps = lossSegments.length + 1;
    const totalGapSpace = numGaps * GAP_LENGTH;
    const availableArc = Math.max(0, totalLossArc - totalGapSpace);

    const arcs: Array<{
      name: string;
      pointsLost: number;
      color: string;
      dashArray: string;
      dashOffset: number;
    }> = [];

    let consumedArc = scoreArcLength + GAP_LENGTH;

    for (let i = 0; i < lossSegments.length; i++) {
      const seg = lossSegments[i];
      const segArc = (seg.pointsLost / totalLost) * availableArc;
      const dashArray = `${segArc} ${halfCircumference * 2 - segArc}`;
      // For semi-circle starting from left (9 o'clock), going clockwise
      const dashOffset = halfCircumference * 2 - consumedArc;

      arcs.push({
        name: seg.name,
        pointsLost: seg.pointsLost,
        color: SEGMENT_PALETTE[i % SEGMENT_PALETTE.length],
        dashArray,
        dashOffset,
      });

      consumedArc += segArc + GAP_LENGTH;
    }

    return arcs;
  }, [lossSegments, totalLost, clampedScore, halfCircumference, scoreArcLength]);

  // Animated score arc
  const animatedScoreArc = scoreArcLength * animationProgress;
  const scoreDashArray = `${animatedScoreArc} ${halfCircumference * 2 - animatedScoreArc}`;

  // Semi-circle path (from left to right, arcing upward)
  const pathD = `M ${CENTER_X - RADIUS} ${CENTER_Y} A ${RADIUS} ${RADIUS} 0 0 1 ${CENTER_X + RADIUS} ${CENTER_Y}`;

  return (
    <div className="card-elevated overflow-hidden">
      <div className="flex flex-col items-center">
        {/* SVG Semi-Circle Gauge */}
        <div className="relative w-full" style={{ maxWidth: WIDTH, aspectRatio: `${WIDTH}/${HEIGHT}` }}>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full">
            {/* Background track */}
            <path
              d={pathD}
              fill="none"
              stroke="#E5E5E5"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
            />

            {/* Loss segments */}
            {lossSegmentArcs.map((seg, i) => (
              <path
                key={i}
                d={pathD}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="butt"
                opacity={
                  animationProgress > 0.3
                    ? Math.min(1, (animationProgress - 0.3) / 0.4) * 0.7
                    : 0
                }
                style={{ transition: "opacity 0.3s ease-out" }}
              />
            ))}

            {/* Score arc (on top) */}
            <path
              d={pathD}
              fill="none"
              stroke={scoreColor}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={scoreDashArray}
              strokeDashoffset={0}
            />
          </svg>

          {/* Center score number */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: "50%", bottom: 0, transform: "translateX(-50%)" }}
          >
            <span
              className="font-bold text-surface-900"
              style={{ fontSize: 42, lineHeight: 1 }}
            >
              {displayScore}
            </span>
          </div>
        </div>

        {/* Label and page type */}
        <div className="flex flex-col items-center mt-1">
          <span
            className="text-sm font-semibold"
            style={{ color: scoreLabelColor }}
          >
            {scoreLabel}
          </span>
          <span className="inline-flex items-center rounded-full bg-surface-100 px-2.5 py-0.5 text-2xs font-medium text-surface-500 mt-1.5">
            {pageType}
          </span>
        </div>

        {/* Category loss breakdown */}
        {lossSegments.length > 0 && (
          <div className="w-full mt-4 pt-3 border-t border-surface-200">
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 w-full min-w-0">
              {lossSegments.map((seg, i) => (
                <div key={seg.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        SEGMENT_PALETTE[i % SEGMENT_PALETTE.length],
                    }}
                  />
                  <span className="text-2xs text-surface-500">
                    {seg.name}
                  </span>
                  <span className="text-2xs font-medium text-surface-700">
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
