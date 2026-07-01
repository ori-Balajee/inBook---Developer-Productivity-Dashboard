const API_BASE_URL = 'http://localhost:5000/api';

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
}

export const mongoClient = {

    // PROJECTS //
    async getProjects() {
        return apiRequest('/projects');
    },
    async createProject(project) {
        return apiRequest('/projects', { method: 'POST', body: JSON.stringify(project) });
    },
    async updateProject(id, updates) {
        return apiRequest(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    async deleteProject(id) {
        await apiRequest(`/projects/${id}`, { method: 'DELETE' });
        return true;
    },

    // SESSIONS //
    async getSessions() {
        return apiRequest('/sessions');
    },
    async getActiveSession() {
        return apiRequest('/sessions/active');
    },
    async createSession(session) {
        return apiRequest('/sessions', {
            method: 'POST',
            body: JSON.stringify({
                projectId: session.projectId,
                description: session.description,
                tags: session.tags,
            }),
        });
    },
    async stopSession(id) {
        return apiRequest(`/sessions/${id}/stop`, { method: 'PUT' });
    },
    async updateSession(id, updates) {
        if (updates.endTime) {
            return apiRequest(`/sessions/${id}/stop`, { method: 'PUT' });
        }
        return apiRequest(`/sessions/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    async deleteSession(id) {
        await apiRequest(`/sessions/${id}`, { method: 'DELETE' });
        return true;
    },


    // === Logs ===
    async getLogs() {
        return apiRequest('/logs');
    },
    async createLog(log) {
        return apiRequest('/logs', { method: 'POST', body: JSON.stringify(log) });
    },
    async updateLog(id, updates) {
        return apiRequest(`/logs/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    async deleteLog(id) {
        await apiRequest(`/logs/${id}`, { method: 'DELETE' });
        return true;
    },


    // === Snippets ===
    async getSnippets() {
        return apiRequest('/snippets');
    },
    async createSnippet(snippet) {
        return apiRequest('/snippets', { method: 'POST', headers: {
            'Content-Type': 'application/json',
        }, body: JSON.stringify(snippet) });
    },
    async updateSnippet(id, updates) {
        return apiRequest(`/snippets/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
    },
    async deleteSnippet(id) {
        await apiRequest(`/snippets/${id}`, { method: 'DELETE' });
        return true;
    },

    // === Stats ===
    async getStats() {
        const sessionsRes = await apiRequest('/sessions/stats');
        return sessionsRes || {
            totalHoursThisWeek: 0,
            totalHoursThisMonth: 0,
            sessionsThisWeek: 0,
            topProject: 'None',
            averageSessionDuration: 0,
            streakDays: 0,
        };
    },
}