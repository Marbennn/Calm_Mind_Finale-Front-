import React from "react";

export default function Card({
  as: Component = "div",
  className = "",
  hover = true,
  disableClick = true,   // keep hover-only by default
  onClick,
  children,
  ...props
}) {
  const hoverCls = hover
    ? [
        "transform-gpu",
        "transition-[transform,box-shadow,filter]",
        "duration-500",  // Standardized for symmetry; adjust to 500 for slower feel
        "ease-in-out",   // Smoother than custom bezier with overshoot
        "hover:-translate-y-[2px]",
        "hover:scale-[1.012]",
        "hover:shadow-lg",
        "hover:brightness-[1.01]",
        "motion-reduce:transition-none",
        "motion-reduce:hover:transform-none",
        "motion-reduce:hover:shadow-none",
        "motion-reduce:hover:brightness-100",
      ].join(" ")
    : "";

  const pressCls = disableClick ? "" : "active:translate-y-0.5";

  const classes = [
    "bg-card rounded-2xl border border-gray-200 shadow-sm",
    "will-change-transform",
    hoverCls,
    pressCls,
    disableClick ? "cursor-default select-none focus:outline-none" : "",
    className,
  ].join(" ");

  const handleClick = React.useCallback(
    (e) => {
      if (disableClick) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    },
    [disableClick, onClick]
  );

  return (
    <Component
      className={classes}
      tabIndex={disableClick ? -1 : props.tabIndex}
      aria-disabled={disableClick || undefined}
      onClick={handleClick}
      style={{ willChange: "transform, box-shadow, filter" }}  // Added filter for brightness opt-in
      {...props}
    >
      {children}
    </Component>
  );
}