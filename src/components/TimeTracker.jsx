import { useState, useEffect, useCallback } from 'react';
import { Play, Square, Clock, Tag, FolderOpen, Timer } from 'lucide-react';
import { mongoClient } from '../lib/mongodbClient';

export function TimeTracker({ projects, sessions, onDataRefresh }) {
    const [isRunning, setIsRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [selectedProject, setSelectedProject] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [startTime, setStartTime] = useState(null);

    // Ticks the clock every second while a session is running
    useEffect(() => {
        let interval;
        if (isRunning && startTime) {
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, startTime]);

    // On page load, resume any session that was already running
    useEffect(() => {
        const loadActiveSession = async () => {
            try {
                const session = await mongoClient.getActiveSession();
                if (!session) return;
                setIsRunning(true);
                setCurrentSessionId(session._id || null);
                setStartTime(new Date(session.startTime));
                setElapsed(Math.floor((Date.now() - new Date(session.startTime).getTime()) / 1000));
                setSelectedProject(session.projectId);
                setDescription(session.description || '');
                setTags(session.tags?.join(', ') || '');
            } catch (err) {
                console.error('Failed to load active session:', err);
            }
        };
        loadActiveSession();
    }, []);

    // Converts raw seconds to HH:MM:SS
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Starts a new session
    const handleStart = async () => {
        if (!selectedProject) return;
        const session = await mongoClient.createSession({
            projectId: selectedProject,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        });
        setCurrentSessionId(session._id || null);
        setStartTime(new Date(session.startTime));
        setIsRunning(true);
        setElapsed(0);
        onDataRefresh();
    };

    // Stops the current session
    const handleStop = useCallback(async () => {
        if (!currentSessionId) return;
        try {
            await mongoClient.stopSession(currentSessionId);
            setIsRunning(false);
            setElapsed(0);
            setCurrentSessionId(null);
            setStartTime(null);
            setDescription('');
            setTags('');
            onDataRefresh();
        } catch (err) {
            console.error(err);
            alert('Failed to stop session');
        }
    }, [currentSessionId, onDataRefresh]);

    // Last 5 completed sessions
    const recentSessions = sessions
        .filter(s => s.endTime)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-6">

            {/* Timer Card */}
            <div className="glass-card p-6">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Timer className="w-5 h-5 text-primary-400" />
                    Time Tracker
                </h2>

                {/* Clock display */}
                <div className="bg-slate-900/50 rounded-2xl p-8 text-center mb-6">
                    <div className={`font-mono text-5xl font-bold tracking-wider ${isRunning ? 'text-accent-400 glow-accent' : 'text-slate-300'}`}>
                        {formatTime(elapsed)}
                    </div>
                    {isRunning && (
                        <div className="mt-2 text-sm text-slate-400 animate-pulse-soft">
                            Recording time...
                        </div>
                    )}
                </div>

                {/* Form fields */}
                <div className="space-y-4">

                    {/* Project selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <FolderOpen className="w-4 h-4 inline mr-2" />
                            Project
                        </label>
                        <select
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            disabled={isRunning}
                            className="input-field disabled:opacity-50"
                        >
                            <option value="">Select a project</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={isRunning}
                            placeholder="What are you working on?"
                            className="input-field disabled:opacity-50"
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            <Tag className="w-4 h-4 inline mr-2" />
                            Tags (comma separated)
                        </label>
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            disabled={isRunning}
                            placeholder="frontend, bug-fix, feature"
                            className="input-field disabled:opacity-50"
                        />
                    </div>

                    {/* Start / Stop button */}
                    <div className="flex gap-3 pt-2">
                        {!isRunning ? (
                            <button
                                onClick={handleStart}
                                disabled={!selectedProject}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Play className="w-5 h-5" />
                                Start Session
                            </button>
                        ) : (
                            <button
                                onClick={handleStop}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all duration-200"
                            >
                                <Square className="w-5 h-5" />
                                Stop Session
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Recent Sessions Card */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-400" />
                    Recent Sessions
                </h3>
                {recentSessions.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No sessions recorded yet. Start tracking!</p>
                ) : (
                    <div className="space-y-3">
                        {recentSessions.map(session => (
                            <SessionCard key={session._id} session={session} />
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

// ─── SessionCard ────────────────────────────────────────────────────────────

function SessionCard({ session }) {
    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    const date = new Date(session.startTime);

    return (
        <div className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-medium text-slate-200">{session.description || 'Working session'}</p>
                    <p className="text-sm text-slate-500">{session.projectName}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                        {session.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-mono text-lg text-accent-400">{formatDuration(session.duration)}</p>
                    <p className="text-xs text-slate-500">{date.toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}