'use client';

import { Trophy, Users, Calendar, ArrowRight, Star, Loader2 } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/database";

type Match = Database['public']['Tables']['matches']['Row'] & {
  home_team: Database['public']['Tables']['teams']['Row'];
  away_team: Database['public']['Tables']['teams']['Row'];
};

export default function Home() {
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedMatches() {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!home_team_id(*),
          away_team:teams!away_team_id(*)
        `)
        .eq('status', 'scheduled')
        .order('start_time', { ascending: true })
        .limit(3);

      if (!error && data) {
        setFeaturedMatches(data as Match[]);
      }
      setLoading(false);
    }

    fetchFeaturedMatches();
  }, []);

  return (
    <div className="flex flex-col gap-16 animate-fade-in py-8">
      {/* Hero Section */}
      <section className="relative group overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-argentina-blue/10" />

        {/* Visual Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-argentina-blue/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-argentina-gold/5 blur-[100px] rounded-full -translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10 py-24 px-8 text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-argentina-gold/10 border border-argentina-gold/20 text-[10px] font-black uppercase tracking-[0.2em] text-argentina-gold mb-2 shadow-lg animate-bounce">
            <Star size={12} fill="currentColor" /> <span>Liga Profesional 2026</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
            <span className="block text-white">EL PRODE</span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-argentina-blue via-white to-argentina-blue bg-[length:200%_auto] animate-shimmer">
              ARGENTINO
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Demostrá que sos el que más sabe de fútbol. Pronosticá los resultados de la Liga Profesional,
            competí en el ranking nacional y ganá premios exclusivos.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 justify-center pt-8">
            <Link href="/predictions"
              className="group/btn px-10 py-5 rounded-2xl bg-argentina-blue text-navy-950 font-black text-lg transition-all shadow-[0_10px_30px_rgba(117,170,219,0.4)] hover:shadow-[0_15px_40px_rgba(117,170,219,0.5)] hover:-translate-y-1 active:scale-95 flex items-center gap-3">
              <span>Jugar Ahora</span>
              <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
            <button className="px-10 py-5 rounded-2xl glass-panel text-white font-black text-lg hover:bg-white/5 transition-all border border-white/10 flex items-center gap-3">
              Ver Reglamento
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {[
          { icon: Users, label: "Jugadores Activos", value: "+15k", color: "text-blue-400" },
          { icon: Trophy, label: "Premios Entregados", value: "$450k", color: "text-argentina-gold" },
          { icon: Calendar, label: "Próxima Fecha", value: "Fecha 16", color: "text-argentina-blue" },
        ].map((stat, i) => (
          <div key={i} className="group glass-panel p-8 rounded-3xl flex items-center gap-6 border border-white/5 hover:border-white/10 transition-all hover:bg-white/[0.02]">
            <div className={`p-4 rounded-2xl bg-white/5 ${stat.color} transition-transform group-hover:scale-110`}>
              <stat.icon size={32} />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Featured Section */}
      <section className="px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-argentina-blue font-black tracking-widest uppercase text-[10px]">
              <Star size={12} fill="currentColor" />
              <span>Próximos Partidos</span>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tight">Partidos Destacados</h2>
          </div>
          <Link href="/predictions" className="group text-argentina-blue font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:text-white transition-colors">
            Ver fixture completo <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={40} className="animate-spin text-argentina-blue" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredMatches.map((match) => (
              <div key={match.id} className="relative group">
                <div className="absolute -inset-[1px] bg-gradient-to-b from-argentina-blue/40 to-transparent rounded-3xl blur-md opacity-0 group-hover:opacity-40 transition-opacity" />
                <div className="relative glass-panel rounded-3xl overflow-hidden border border-white/10 bg-navy-900/60 p-8 space-y-8">
                  <div className="flex items-center justify-between text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <span>Fecha {match.round}</span>
                    <span className="text-gray-500">
                      {new Date(match.start_time).toLocaleDateString('es-AR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}hs
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Link href={`/teams/${match.home_team.id}`} className="flex flex-col items-center gap-3 w-[40%] text-center group/team">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center p-3 shadow-inner group-hover/team:scale-105 transition-transform border border-white/5">
                        {match.home_team.badge_url ? (
                          <img src={match.home_team.badge_url} alt={match.home_team.name} className="w-full h-full object-contain drop-shadow-lg" />
                        ) : (
                          <div className="text-2xl font-black text-white opacity-20">{match.home_team.short_name}</div>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate w-full group-hover/team:text-argentina-blue transition-colors">
                        {match.home_team.name}
                      </span>
                    </Link>

                    <div className="text-xl font-black text-gray-700 italic shrink-0">VS</div>

                    <Link href={`/teams/${match.away_team.id}`} className="flex flex-col items-center gap-3 w-[40%] text-center group/team">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center p-3 shadow-inner group-hover/team:scale-105 transition-transform border border-white/5">
                        {match.away_team.badge_url ? (
                          <img src={match.away_team.badge_url} alt={match.away_team.name} className="w-full h-full object-contain drop-shadow-lg" />
                        ) : (
                          <div className="text-2xl font-black text-white opacity-20">{match.away_team.short_name}</div>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate w-full group-hover/team:text-argentina-blue transition-colors">
                        {match.away_team.name}
                      </span>
                    </Link>
                  </div>

                  <Link href="/predictions" className="block w-full py-4 rounded-xl bg-white/5 hover:bg-argentina-blue hover:text-navy-950 text-[10px] font-black text-argentina-blue text-center uppercase tracking-[0.2em] transition-all border border-argentina-blue/20">
                    Pronosticar Ahora
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
