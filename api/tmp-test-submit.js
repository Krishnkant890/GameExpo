async function testSubmit() {
    console.log("Creating event...");
    const evRes = await fetch('http://localhost:4000/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Event ' + Math.random(), maxPlayers: 2 })
    });
    const ev = await evRes.json();
    console.log("Event:", ev);
    console.log("Joining...");
    const joinRes = await fetch(`http://localhost:4000/events/${ev.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Tester', email: 'test@example.com' })
    });
    const join = await joinRes.json();
    console.log("Join:", join);
    console.log("Submitting prompt...");
    const subRes = await fetch(`http://localhost:4000/events/${ev.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', prompt: 'A cool dog' })
    });
    const sub = await subRes.json();
    console.log("Submit result:", sub);
}
testSubmit().catch(console.error);
export {};
//# sourceMappingURL=tmp-test-submit.js.map