import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, FileText, Search, CheckCircle, Shield, BarChart3, ArrowRight, Star, Users, TrendingUp, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { useLanguage } from '@/i18n/LanguageContext';
import heroImage from '@/assets/hero-city.jpg';

export default function Landing() {
  const { t } = useLanguage();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);

  const features = [
    { icon: FileText, title: t('landing_feature_submit'), desc: t('landing_feature_submit_desc') },
    { icon: Search, title: t('landing_feature_track'), desc: t('landing_feature_track_desc') },
    { icon: Shield, title: t('landing_feat_transparent'), desc: t('landing_feat_transparent_desc') },
    { icon: BarChart3, title: t('landing_feat_data'), desc: t('landing_feat_data_desc') },
  ];

  const stats = [
    { value: '5,000+', label: t('landing_stat1') },
    { value: '200+', label: t('landing_stat2') },
    { value: '98%', label: t('landing_stat3') },
  ];

  return (
    <div className="min-h-screen bg-white selection:bg-black selection:text-white overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        <motion.div
          style={{ y: y1 }}
          className="absolute inset-0 z-0"
        >
          <img src={heroImage} alt="Smart city" className="h-full w-full object-cover scale-105" />
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-blue-400" /> Tirupati • Smart City
            </div>

            <h1 className="mb-6 font-heading text-6xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl leading-[1.05]">
              {t('landing_hero_line1')}<br />
              <span className="text-white/60">{t('landing_hero_line2')}</span>
            </h1>

            <p className="mx-auto mb-12 max-w-xl text-lg text-white/70 leading-relaxed font-medium">
              {t('landing_hero_desc')}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <Button
                size="lg"
                asChild
                className="bg-white text-slate-950 hover:bg-white/90 rounded-full px-10 h-14 text-sm font-bold tracking-tight shadow-cinematic transition-all hover:scale-105 active:scale-95"
              >
                <Link to="/register">{t('get_started')}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Board */}
      <section className="relative z-20 py-12 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-[2rem] p-8 text-center border-slate-100"
              >
                <p className="font-heading text-4xl font-extrabold text-slate-950 mb-1">{s.value}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-20 py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-24 flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xl"
            >
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">{t('landing_why_label')}</p>
              <h2 className="font-heading text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
                {t('landing_why_title')}
              </h2>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-xs text-sm text-slate-500 leading-relaxed"
            >
              {t('landing_why_desc')}
            </motion.p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative rounded-[2.5rem] bg-slate-50 p-10 transition-all hover:bg-slate-950 hover:shadow-cinematic"
              >
                <div className="mb-20 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-sm group-hover:bg-white/10 group-hover:text-white transition-colors duration-500">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-4 font-heading text-xl font-bold tracking-tight text-slate-950 group-hover:text-white transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 group-hover:text-white/60 transition-colors leading-relaxed">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl rounded-[3rem] bg-slate-950 p-16 text-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <img src={heroImage} alt="" className="h-full w-full object-cover grayscale" />
          </div>
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="mb-6 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">{t('landing_cta_soon')}</p>
            <h2 className="mb-8 font-heading text-4xl font-extrabold tracking-tight sm:text-6xl">
              {t('landing_cta_title')}
            </h2>
            <div className="flex flex-wrap justify-center gap-6">
              <Button size="lg" asChild className="bg-white text-slate-950 hover:bg-white/90 rounded-full px-12 h-16 text-base font-bold tracking-tight">
                <Link to="/register">{t('get_started')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-white/10 bg-white/5 text-white hover:bg-white/10 rounded-full px-12 h-16 text-base font-bold tracking-tight">
                <Link to="/login">{t('sign_in')}</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Minimal Footer */}
      <footer className="py-20 px-6 border-t border-slate-100">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-slate-950 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tighter">Voice4City</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">© 2026 {t('landing_hero_tagline')}</p>
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-950 transition-colors">Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
