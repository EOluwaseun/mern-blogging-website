import { AnimatePresence, animate, motion } from 'framer-motion';

const AnimationWrapper = ({
  children,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  transition = { duration: 1 },
  className,
  keyValue,
}) => {
  return (
    <motion.div
      keyValue={keyValue}
      initial={initial}
      animate={animate}
      transition={transition}
      className={className}
    >
      {children}
    </motion.div>
  );
};
export default AnimationWrapper;
