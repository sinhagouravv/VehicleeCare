import React, { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";

function AnimatedLiquidGlass({ isActive, darkMode, isPressed }) {
  const shadowColor = darkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.15)";
  const highlightColor = darkMode ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)";

  return (
    <div
      className="relative w-full h-full rounded-full overflow-hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px) saturate(100%) brightness(1.02)",
        WebkitBackdropFilter: "blur(12px) saturate(100%) brightness(1.02)",
        boxShadow: isPressed ? `0 4px 8px ${shadowColor}, 0 0 0 1px rgba(255,255,255,0.2)` : `0 2px 4px ${shadowColor}`,
        transition: "box-shadow 0.1s ease-out",
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-1/2 rounded-t-full"
        style={{
          background: `linear-gradient(145deg, ${highlightColor} 0%, transparent 60%)`,
        }}
      />
      <motion.div
        className="absolute top-0 left-0 w-full h-full rounded-full pointer-events-none"
        initial={false}
        animate={{
          background: isActive
            ? `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`
            : `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)`,
          x: isActive ? ["0%", "100%"] : ["100%", "0%"],
        }}
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
        style={{ opacity: 0.6 }}
      />
      <div
        className="absolute bottom-0 left-0 w-full h-1/4 rounded-b-full"
        style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.05) 0%, transparent 100%)`,
        }}
      />
    </div>
  );
}

const sizeConfig = {
  xs: { trackWidth: 34, trackHeight: 20, knobWidth: 16, knobHeight: 16, knobMargin: 2, indicatorWidth: 1.5, indicatorHeight: 6, indicatorOffset: 6, circleSize: 4.5 },
  sm: { trackWidth: 38, trackHeight: 24, knobWidth: 20, knobHeight: 20, knobMargin: 2, indicatorWidth: 2, indicatorHeight: 7, indicatorOffset: 7, circleSize: 5.5 },
  md: { trackWidth: 44, trackHeight: 28, knobWidth: 24, knobHeight: 24, knobMargin: 2, indicatorWidth: 2, indicatorHeight: 9, indicatorOffset: 8, circleSize: 6.5 },
  lg: { trackWidth: 54, trackHeight: 34, knobWidth: 30, knobHeight: 30, knobMargin: 2, indicatorWidth: 2, indicatorHeight: 11, indicatorOffset: 10, circleSize: 8 },
};

const colorThemes = {
  default: {
    light: { active: "#26BF4D", inactive: "hsl(0, 0%, 90%)" },
    dark: { active: "#26BF4D", inactive: "hsl(0, 0%, 25%)" },
  },
  success: {
    light: { active: "hsl(142, 76%, 36%)", inactive: "hsl(0, 0%, 90%)" },
    dark: { active: "hsl(142, 76%, 30%)", inactive: "hsl(0, 0%, 25%)" },
  },
  warning: {
    light: { active: "hsl(38, 92%, 50%)", inactive: "hsl(0, 0%, 90%)" },
    dark: { active: "hsl(38, 92%, 45%)", inactive: "hsl(0, 0%, 25%)" },
  },
  danger: {
    light: { active: "hsl(0, 84%, 60%)", inactive: "hsl(0, 0%, 90%)" },
    dark: { active: "hsl(0, 84%, 50%)", inactive: "hsl(0, 0%, 25%)" },
  },
  purple: {
    light: { active: "hsl(271, 91%, 65%)", inactive: "hsl(0, 0%, 90%)" },
    dark: { active: "hsl(271, 91%, 55%)", inactive: "hsl(0, 0%, 25%)" },
  },
  cyan: {
    light: { active: "hsl(187, 85%, 53%)", inactive: "hsl(0, 0%, 90%)" },
    dark: { active: "hsl(187, 85%, 43%)", inactive: "hsl(0, 0%, 25%)" },
  },
};

const VELOCITY_THRESHOLD = 200;

export default function ToggleSwitch({
  className = "",
  isActive: initialIsActive = false,
  onChange = () => {},
  darkMode = false,
  glassEffect = true,
  size = "sm",
  colorTheme = "default",
}) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isDragging, setIsDragging] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [showSweep, setShowSweep] = useState(false);
  const [sweepDirection, setSweepDirection] = useState("right");
  const trackRef = useRef(null);
  const velocityRef = useRef(0);

  const shouldReduceMotion = useReducedMotion();

  const { trackWidth, trackHeight, knobWidth, knobHeight, knobMargin, indicatorWidth, indicatorHeight, indicatorOffset, circleSize } = sizeConfig[size] || sizeConfig.sm;

  const calculateTravel = () => {
    return trackWidth - knobWidth - knobMargin * 2;
  };

  const motionX = useMotionValue(initialIsActive ? calculateTravel() : 0);

  const springConfig = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 750, damping: 38, mass: 0.6 };

  const springX = useSpring(motionX, springConfig);

  useEffect(() => {
    setIsActive(initialIsActive);
    const newX = initialIsActive ? calculateTravel() : 0;
    motionX.set(newX);
  }, [initialIsActive]);

  function getBackgroundColor() {
    const theme = colorThemes[colorTheme] || colorThemes.default;
    const mode = darkMode ? theme.dark : theme.light;
    return isActive ? mode.active : mode.inactive;
  }

  function triggerSweep(direction) {
    if (shouldReduceMotion) return;
    setSweepDirection(direction);
    setShowSweep(true);
    setTimeout(() => setShowSweep(false), 150);
  }

  function handlePointerDown(e) {
    setIsPressed(true);
    if (e.target && e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }
  }

  function handlePointerUp() {
    setIsPressed(false);
  }

  function handlePointerCancel() {
    setIsPressed(false);
  }

  function handleComponentClick() {
    if (isDragging) return;

    const newState = !isActive;
    setIsActive(newState);

    const newX = newState ? calculateTravel() : 0;
    motionX.set(newX);

    triggerSweep(newState ? "right" : "left");

    onChange(newState);
  }

  function handleDragStart() {
    setIsDragging(true);
    velocityRef.current = 0;
  }

  function handleDrag(_event, info) {
    const maxTravel = calculateTravel();
    const currentX = motionX.get() + info.delta.x;
    const clampedX = Math.max(0, Math.min(currentX, maxTravel));
    motionX.set(clampedX);
    velocityRef.current = info.velocity.x;
  }

  function handleDragEnd() {
    const maxTravel = calculateTravel();
    const currentX = motionX.get();
    const velocity = velocityRef.current;

    let newState;
    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      newState = velocity > 0;
    } else {
      newState = currentX > maxTravel / 2;
    }

    if (newState !== isActive) {
      triggerSweep(newState ? "right" : "left");
    }

    setIsActive(newState);
    const finalX = newState ? maxTravel : 0;
    motionX.set(finalX);
    onChange(newState);

    setTimeout(() => setIsDragging(false), 10);
  }

  const trackStyle = {
    width: `${trackWidth}px`,
    height: `${trackHeight}px`,
  };

  const pressTransition = shouldReduceMotion ? { duration: 0 } : { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] };

  return (
    <div
      className={`${className} relative cursor-pointer touch-none overflow-visible flex items-center shrink-0 select-none`}
      onClick={handleComponentClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerUp}
      data-name={isActive ? "Toggle-On" : "Toggle-Off"}
    >
      <motion.div
        ref={trackRef}
        className="relative z-0 h-full w-full rounded-full shrink-0"
        style={trackStyle}
        animate={{
          backgroundColor: getBackgroundColor(),
          boxShadow: isPressed ? "0 0 0 2px rgba(0,0,0,0.08)" : "0 0 0 0px rgba(0,0,0,0)",
        }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" }}
        data-name="Track"
      >
        {glassEffect && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              boxShadow: "inset 0 1px 2px rgba(255,255,255,0.15)",
            }}
          />
        )}

        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            left: `${indicatorOffset}px`,
            top: "50%",
            transform: "translateY(-50%)",
            width: `${indicatorWidth}px`,
            height: `${indicatorHeight}px`,
          }}
          animate={{
            opacity: isActive ? 1 : 0,
          }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "100px",
            }}
          />
        </motion.div>

        <motion.div
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            right: `${indicatorOffset}px`,
            top: "50%",
            transform: "translateY(-50%)",
            width: `${circleSize}px`,
            height: `${circleSize}px`,
          }}
          animate={{
            opacity: isActive ? 0 : 0.5,
          }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="rounded-full"
            style={{
              width: `${circleSize}px`,
              height: `${circleSize}px`,
              border: `${Math.max(1.5, circleSize * 0.15)}px solid`,
              borderColor: darkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)",
            }}
          />
        </motion.div>

        {showSweep && !shouldReduceMotion && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              height: "2px",
              top: "50%",
              marginTop: "-1px",
              background: "rgba(255,255,255,0.5)",
            }}
            initial={{
              width: "0%",
              left: sweepDirection === "right" ? "10%" : "90%",
              opacity: 0,
            }}
            animate={{
              width: "80%",
              left: sweepDirection === "right" ? "10%" : "10%",
              opacity: [0, 0.7, 0],
            }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          />
        )}
      </motion.div>

      <motion.div
        className="absolute rounded-full z-20 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: calculateTravel() }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{
          x: springX,
          width: `${knobWidth}px`,
          height: `${trackHeight - knobMargin * 2}px`,
          top: `${knobMargin}px`,
          left: `${knobMargin}px`,
          overflow: "visible",
        }}
        animate={{
          scale: isDragging ? 1.25 : 1,
          boxShadow: isDragging
            ? "0 12px 40px -8px rgba(0, 0, 0, 0.35), 0 6px 16px -4px rgba(0, 0, 0, 0.2)"
            : "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
        transition={pressTransition}
        data-name="Knob"
      >
        <motion.div
          className="w-full h-full rounded-full relative overflow-hidden"
          animate={{
            backgroundColor: isDragging ? "rgba(255, 255, 255, 0.08)" : "#FAFAFA",
          }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            backdropFilter: isDragging ? "blur(32px) brightness(1.1)" : "blur(0px)",
            WebkitBackdropFilter: isDragging ? "blur(32px) brightness(1.1)" : "blur(0px)",
            boxShadow: isDragging
              ? "0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.25), inset 0 0 20px rgba(255, 255, 255, 0.12), inset 0 -2px 8px rgba(0, 0, 0, 0.1), inset 0 2px 8px rgba(255, 255, 255, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1), inset 0 -4px 8px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div
            className="absolute top-0 left-[10%] w-[80%] h-[45%] rounded-t-full pointer-events-none"
            style={{
              background: isDragging
                ? "linear-gradient(180deg, rgba(255,255,255,0.25) 0%, transparent 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 40%, transparent 100%)",
            }}
          />
          <div
            className="absolute top-[5%] left-[15%] w-[70%] h-[25%] rounded-full pointer-events-none"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)",
              filter: "blur(2px)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-full h-[40%] rounded-b-full pointer-events-none"
            style={{
              background: isDragging
                ? "linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)"
                : "linear-gradient(to top, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.04) 50%, transparent 100%)",
            }}
          />
        </motion.div>
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          animate={{
            opacity: isDragging ? 1 : 0,
          }}
          transition={{ duration: 0.1 }}
          style={{
            border: "1px solid rgba(255, 255, 255, 0.35)",
            boxShadow: "inset 0 0 12px -2px rgba(255, 255, 255, 0.5), inset 0 1px 2px rgba(255, 255, 255, 0.4)",
          }}
        />
      </motion.div>
    </div>
  );
}
