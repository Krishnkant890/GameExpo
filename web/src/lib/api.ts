const API_URL = 'http://localhost:4000';

export async function createEvent(name: string, maxPlayers: number) {
    const res = await fetch(`${API_URL}/events`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, maxPlayers }),
    });
    if (!res.ok) throw new Error('Failed to create event');
    return res.json();
}

export async function getEvent(id: string) {
    const res = await fetch(`${API_URL}/events/${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
}

export async function getPlayers(id: string) {
    const res = await fetch(`${API_URL}/events/${id}/players`);
    if (!res.ok) throw new Error('Failed to fetch players');
    return res.json();
}

export async function joinEvent(id: string, name: string, email: string, phone?: string) {
    const res = await fetch(`${API_URL}/events/${id}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to join event');
    return data;
}

export async function updateEventStatus(id: string, status: 'waiting' | 'active' | 'finished') {
    const res = await fetch(`${API_URL}/events/${id}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
}

export async function submitPrompt(id: string, email: string, prompt: string) {
    const res = await fetch(`${API_URL}/events/${id}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit prompt');
    return data;
}
