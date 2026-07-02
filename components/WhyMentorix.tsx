import React from 'react';
import { motion } from 'framer-motion';
import { whyMentorix } from '../data/whyMentorix';
import { Sparkles, ShieldCheck, Target, PenTool, FileText, MessageSquare } from 'lucide-react';

export const WhyMentorix: React.FC = () => (
  <section className="py-20">
    <h2 className="text-4xl font-black text-center text-white mb-12">Why Mentorix?</h2>
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
      {whyMentorix.map((card, idx) => (
        <motion.div
          key={card.title}
          className="flex flex-col items-center text-center p-6 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 shadow-lg"
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(255,255,255,0.12)' }}
          transition={{ duration: 0.3 }}
        >
          <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} mb-4`}>
            <div className="w-12 h-12 bg-slate-950 rounded-full flex items-center justify-center">
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white mb-2">{card.title}</h3>
          <p className="text-slate-400 text-sm">{card.description}</p>
        </motion.div>
      ))}
    </motion.div>
  </section>
);

export default WhyMentorix;
