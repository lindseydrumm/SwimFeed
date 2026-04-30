import { motion } from 'framer-motion';

type Props = {
  onStart: () => void;
};

export function WelcomePage({ onStart }: Props) {
  return (
    <div className="relative h-screen w-screen flex flex-col justify-between items-center text-center px-6 py-10 overflow-hidden">
      
      {/* BACKGROUND MOTION (THE KEY PART) */}
      <div className="absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 -translate-x-1/2 w-[8px] bg-slate-600/40"
            style={{
              height: '200%',
              x: `${(i - 1) * 80}px`, // spread lanes horizontally
            }}
            animate={{
              y: ['-50%', '0%'], // 👈 continuous downward motion
            }}
            transition={{
              duration: 6 + i, // slight variation = more natural
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}

        {/* Water gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 mt-16">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-4xl font-bold text-white tracking-tight"
        >
          Swim<span className="text-cyan-400">Feed</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="text-slate-400 mt-4 max-w-sm"
        >
          Follow the sport. Track the moments. Stay in your lane.
        </motion.p>
      </div>

      {/* CTA */}
      <div className="relative z-10 mb-10">
        <motion.button
          onClick={onStart}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.96 }}
          className="px-10 py-3 bg-white text-black hover:bg-cyan-500 rounded-full font-medium tracking-wide shadow-lg"
        >
          Get Started
        </motion.button>
      </div>
    </div>
  );
}
