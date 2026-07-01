import { useEffect, useState, useMemo } from 'react';
import { TrendingUp, Clock, FolderOpen, Target, Flame, BarChart3 } from 'lucide-react';
import { mongoClient } from '../lib/mongodbClient';

export function Dashboard({ sessions, projects, logs, onRefresh }) {
    const [animate, setAnimate] = useState(false);
    const [stats, setStats] = useState({
        totalHoursThisWeek: 0,
        totalHoursThisMonth: 0,
        sessionsThisWeek: 0,
        averageSessionDuration: 0,
        streakDays: 0,
    });




    useEffect(() => {
        mongoClient.getStats().then(data => {
            console.log("API response:", data);
            setStats({
                totalHoursThisWeek: data.total.hours || 0,

                sessionsThisWeek:
                    data.total.sessions || 0,

                averageSessionDuration:
                    data.total.avgSessionHours || 0,

                streakDays: data.streak || 0
            });
        });
    }, [sessions]);

    const chartData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = new Date();
        const weekData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = days[date.getDay()];

            const dayHours = sessions
                .filter(s => {
                    const sessionDate = new Date(s.startTime);
                    return sessionDate.toDateString() === date.toDateString();
                })
                .reduce((acc, s) => acc + (s.duration || 0), 0) / 3600;

            weekData.push({ day: dayName, hours: Math.round(dayHours * 10) / 10 });
        }

        return weekData;
    }, [sessions]);


    useEffect(() => {
        setAnimate(false);

        const timer = setTimeout(() => {
            setAnimate(true);
        }, 50);

        return () => clearTimeout(timer);
    }, [sessions]);

    const maxHours = Math.max(...chartData.map(d => d.hours), 1);

    const projectBreakdown = useMemo(() => {
        const projectTimes = {};

        sessions.forEach(s => {
            projectTimes[s.projectName] = (projectTimes[s.projectName] || 0) + (s.duration || 0);
        });

        return Object.entries(projectTimes)
            .map(([name, seconds]) => ({ name, hours: Math.round(seconds / 360) / 10 }))
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 5);
    }, [sessions]);

    const recentLogs = logs
        .filter(l => l.accomplishments.length > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<Clock className="w-5 h-5" />}
                    label="Hours This Week"
                    value={stats.totalHoursThisWeek}
                    suffix="h"
                    color="primary"
                />
                <StatCard
                    icon={<Target className="w-5 h-5" />}
                    label="Sessions"
                    value={stats.sessionsThisWeek}
                    suffix=""
                    color="accent"
                />
                <StatCard
                    icon={<Flame className="w-5 h-5" />}
                    label="Day Streak"
                    value={stats.streakDays}
                    suffix="days"
                    color="warm"
                />
                <StatCard
                    icon={<BarChart3 className="w-5 h-5" />}
                    label="Avg Session"
                    value={stats.averageSessionDuration}
                    suffix="h"
                    color="slate"
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary-400" />
                        Weekly Activity
                    </h3>
                    <div className="glass-card p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Flame className="w-5 h-5 text-warm-400" />
                            Activity Streak
                        </h3>

                        <div className="flex items-center gap-6">
                            <div className="relative w-24 h-24 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full border-8 border-slate-800"></div>

                                <div
                                    className="absolute inset-0 rounded-full border-8 border-warm-400"
                                    style={{
                                        clipPath: `inset(${100 - Math.min(
                                            (stats.streakDays / 30) * 100,
                                            100
                                        )}% 0 0 0)`
                                    }}
                                ></div>

                                <div className="text-center">
                                    <p className="text-2xl font-bold text-slate-100">
                                        {stats.streakDays}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        Days
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-slate-300 font-medium">
                                    Current streak
                                </p>

                                <p className="text-sm text-slate-500 mt-1">
                                    Keep logging work daily to grow your streak.
                                </p>

                                <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-linear-to-r from-warm-500 to-red-500 rounded-full"
                                        style={{
                                            width: `${Math.min(
                                                (stats.streakDays / 30) * 100,
                                                100
                                            )}%`
                                        }}
                                    />
                                </div>

                                <p className="text-xs text-slate-500 mt-2">
                                    Goal: 30 day streak
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between mt-4 text-sm">
                        <span className="text-slate-500">Total: {stats.totalHoursThisWeek}h</span>
                        <span className="text-slate-500">Goal: 40h</span>
                    </div>
                </div>

                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-accent-400" />
                        Project Time
                    </h3>
                    {projectBreakdown.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            No project data yet. Start tracking time!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {projectBreakdown.map((p, i) => {
                                const totalHours = projectBreakdown.reduce((acc, x) => acc + x.hours, 0);
                                const percentage = (p.hours / totalHours) * 100;
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300">{p.name}</span>
                                            <span className="text-slate-500">{p.hours}h ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-linear-to-r from-primary-600 to-accent-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {recentLogs.length > 0 && (
                <div className="glass-card p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className="text-warm-400">Recent Accomplishments</span>
                    </h3>
                    <div className="space-y-2">
                        {recentLogs.flatMap(log =>
                            log.accomplishments.slice(0, 3).map((acc, i) => (
                                <div key={`${log._id}-${i}`} className="flex items-center gap-3 text-sm">
                                    <span className="w-2 h-2 rounded-full bg-accent-500" />
                                    <span className="text-slate-300">{acc}</span>
                                    <span className="text-slate-600 text-xs ml-auto">{new Date(log.date).toLocaleDateString()}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, suffix, color }) {
    const colorClasses = {
        primary: 'text-primary-400 bg-primary-600/10',
        accent: 'text-accent-400 bg-accent-600/10',
        warm: 'text-warm-400 bg-warm-600/10',
        slate: 'text-slate-400 bg-slate-600/10',
    };

    return (
        <div className="glass-card p-4">
            <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className="text-2xl font-bold text-slate-100">
                {value}
                <span className="text-sm font-normal text-slate-500 ml-1">{suffix}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
    );
}