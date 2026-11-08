import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Code2, GitBranch, Sparkles, Users } from 'lucide-react';
import { GoatIcon } from '../components/GoatLogo';
import { CONTACT_EMAIL } from '../lib/config';

const mail = (subject, body) =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

const roles = [
  { title: 'Founding engineer', detail: 'The first or second person who owns the product, the codebase, and the pace.' },
  { title: 'Senior product engineer', detail: 'Ships features end to end. Comfortable in the product, the API, and the messy middle.' },
  { title: 'Platform and infrastructure', detail: 'The person other engineers trust with deploys, data, and the systems that cannot fall over.' },
  { title: 'Applied ML', detail: 'Models in production, not a slide. Evaluation, latency, and the product around the model.' },
  { title: 'Frontend systems', detail: 'Interfaces that feel finished. Design sense plus the engineering to keep them fast.' },
];

const steps = [
  { n: '01', title: 'The bar', body: 'You tell us the work, the level, and what “good” has looked like on this team. We do not start from a keyword list.' },
  { n: '02', title: 'The search', body: 'We talk to engineers the job boards never surface. Strong people who are under-titled, between roles, or invisible to inbound.' },
  { n: '03', title: 'The short list', body: 'You meet a handful. We stay on the process until someone starts, including the close and the first week.' },
];

export default function RecruitingPage() {
  useEffect(() => {
    const previous = document.title;
    document.title = 'GOATED Recruiting — Software engineering search';
    return () => { document.title = previous; };
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,136,0.08),transparent_55%)]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <a href="https://www.goated.solutions" className="flex items-center gap-3">
          <span className="text-brand"><GoatIcon /></span>
          <span>
            <span className="block font-black tracking-tight bg-gradient-to-r from-brand via-emerald-300 to-cyan-400 bg-clip-text text-transparent">GOATED</span>
            <span className="block text-[10px] uppercase tracking-[0.28em] text-slate-500">Recruiting</span>
          </span>
        </a>
        <nav className="hidden items-center gap-6 text-sm text-slate-400 sm:flex">
          <a href="#search" className="hover:text-white">The search</a>
          <a href="#roles" className="hover:text-white">Roles</a>
          <a href="#introduce" className="hover:text-white">Introduce someone</a>
          <a href={mail('GOATED Recruiting — a search', 'The role:\nThe team:\nWhat good looks like:\n')} className="rounded-full bg-brand px-4 py-2 font-semibold text-black hover:bg-emerald-300">Start a search</a>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-24">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-xs font-bold uppercase tracking-[0.28em] text-brand">
            Software engineering recruiting
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-4 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            We find the engineers the market missed.
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
            An engineer-led search for teams that need someone who can build. A short list of exceptional people, not a pile of resumes. We work a small number of roles at a time.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={mail('GOATED Recruiting — a search', 'The role:\nThe team:\nWhat good looks like:\n')} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-300">
              Hire an engineer <ArrowRight size={16} />
            </a>
            <a href={mail('GOATED Recruiting — I am an engineer', 'What I build:\nWhere I am now:\nA link to work:\n')} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:border-brand/50">
              I am an engineer
            </a>
          </div>
        </section>

        <section id="search" className="border-y border-white/[0.04] bg-white/[0.02]">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
            {[
              { icon: Code2, title: 'Engineers reading the work', body: 'The search is run by people who have shipped software. We can tell a strong engineer from a polished profile.' },
              { icon: Sparkles, title: 'Underpriced on purpose', body: 'The interesting people are often a level below the title they deserve, or outside the companies everyone already calls.' },
              { icon: Users, title: 'A few teams, not a marketplace', body: 'We take roles we can actually fill. You get attention, a point of view, and a list short enough to meet.' },
            ].map(item => (
              <div key={item.title}>
                <item.icon className="text-brand" size={18} />
                <h2 className="mt-3 font-bold">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">How a search runs</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(step => (
              <div key={step.n} className="rounded-2xl border border-white/[0.06] bg-black/40 p-6">
                <div className="font-mono text-sm text-brand">{step.n}</div>
                <h3 className="mt-3 text-xl font-black">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="roles" className="mx-auto max-w-6xl px-6 pb-20">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Roles we run</p>
          <h2 className="mt-3 text-3xl font-black sm:text-4xl">Software engineering, across the stack.</h2>
          <div className="mt-8 divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {roles.map(role => (
              <div key={role.title} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-baseline sm:justify-between">
                <div className="flex items-center gap-3 font-semibold">
                  <GitBranch size={14} className="text-brand" />
                  {role.title}
                </div>
                <p className="max-w-xl text-sm text-slate-400">{role.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="introduce" className="mx-auto max-w-6xl px-6 pb-24">
          <div className="rounded-3xl border border-brand/20 bg-gradient-to-br from-brand/10 to-transparent p-8 sm:p-12">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-brand">Introductions</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black sm:text-5xl">Know an engineer who is better than their title?</h2>
            <p className="mt-4 max-w-xl text-slate-300">Introduce them. If we place them, you are paid. A name, a link, and why you would work with them again is enough.</p>
            <a href={mail('GOATED Recruiting — an introduction', 'Who they are:\nWhy they are exceptional:\nHow you know them:\n')} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-emerald-300">
              Make an introduction <ArrowUpRight size={16} />
            </a>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/[0.04] px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>GOATED Recruiting</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a>
          <a href="https://www.goated.solutions" className="hover:text-white">goated.solutions</a>
        </div>
      </footer>
    </div>
  );
}
