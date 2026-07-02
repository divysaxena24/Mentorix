import React from 'react';
import { motion } from 'framer-motion';
import { comingSoon } from '@/data/comingSoon';
import { Zap, Sparkles, ShieldCheck, Target, MessageSquare, Map } from 'lucide-react';

export const ComingSoon: React.FC = () => (
  <section className="py-20">
    <h2 className="text-4xl font-black text-center text-white mb-12">Coming Soon</h2>
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.15 } },
      }}
    >
      {comingSoon.map((item, idx) => (
        <motion.div
          key={item.title}
          className="flex flex-col items-center text-center p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 opacity-50 cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.gradient} mb-4`}>
            <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center">
              <item.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white mb-2">{item.title}</h3>
          <span className="px-3 py-1 bg-white/10 text-xs text-white rounded-full">Coming Soon</span>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

export default ComingSoon;
