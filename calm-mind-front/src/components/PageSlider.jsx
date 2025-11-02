/* eslint-disable no-unused-vars */
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function PageSlider({ children }) {
  const location = useLocation();
  const dir = location.state?.dir ?? 0;

  const variants = {
    initial: (d) => ({ x: d === 1 ? "100%" : d === -1 ? "-100%" : 0, opacity: 0 }),
    animate: { x: 0, opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
    exit:    (d) => ({ x: d === 1 ? "-100%" : d === -1 ? "100%" : 0, opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }),
  };

  return (
    <motion.div
      className="fixed inset-0"
      custom={dir}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
