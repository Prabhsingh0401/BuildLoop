import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api/tasks';
const JWT = `eyJ0eXBlIjoiZGVmYXVsdCIsImlpZCI6Imluc18zQmJla256Rmt6bkRac2tGZnpNTWRQbEp4R3giLCJyaWQiOiJ1c2VyXzNCaXF4RFFlYlZ3dlBkMkppbFY4U0lNa1RsQiIsImluaXRpYWxzIjoiSiJ9`;
const PROJECT_ID = '60d21b4667d0d8992e610c85'; // valid ObjectId
let taskId = '';

async function runTests() {
  const headers = { 
    'Authorization': `Bearer ${JWT}`,
    'Content-Type': 'application/json'
  };

  try {
    // 1. GET
    let r = await fetch(`${BASE_URL}/${PROJECT_ID}`, { headers });
    console.log(`[Test 1] GET Empty tasks: ${r.status}`);
    const r1 = await r.json();
    console.log(r1);

    // 2. POST
    const body = {
      title: 'Test manual task',
      projectId: PROJECT_ID,
      description: 'Created manually',
      tags: ['phase2', 'test'],
      assignee: 'user_clerk123'
    };
    r = await fetch(BASE_URL, { method: 'POST', headers, body: JSON.stringify(body) });
    console.log(`\n[Test 2] POST Create task: ${r.status}`);
    const r2 = await r.json();
    console.log(r2);
    if (r2.task && r2.task._id) taskId = r2.task._id;

    if (!taskId) taskId = '60d21b4667d0d8992e610c85'; // fallback if 401/500

    // 3. GET
    r = await fetch(`${BASE_URL}/${PROJECT_ID}`, { headers });
    console.log(`\n[Test 3] GET tasks again: ${r.status}`);

    // 4. PATCH valid
    r = await fetch(`${BASE_URL}/${taskId}`, { 
      method: 'PATCH', headers, body: JSON.stringify({ status: 'in_progress' }) 
    });
    console.log(`\n[Test 4] PATCH valid: ${r.status}`);

    // 5. PATCH forbidden
    r = await fetch(`${BASE_URL}/${taskId}`, { 
      method: 'PATCH', headers, body: JSON.stringify({ title: 'should be rejected' }) 
    });
    console.log(`\n[Test 5] PATCH forbidden field: ${r.status}`);
    
    // 6. PATCH invalid enum
    r = await fetch(`${BASE_URL}/${taskId}`, { 
      method: 'PATCH', headers, body: JSON.stringify({ status: 'completed' }) 
    });
    console.log(`\n[Test 6] PATCH invalid status: ${r.status}`);

    // 7. PATCH non-existent
    r = await fetch(`${BASE_URL}/000000000000000000000000`, { 
      method: 'PATCH', headers, body: JSON.stringify({ status: 'done' }) 
    });
    console.log(`\n[Test 7] PATCH non-existent: ${r.status}`);

    // 8. GET no auth
    r = await fetch(`${BASE_URL}/${PROJECT_ID}`);
    console.log(`\n[Test 8] GET no auth header: ${r.status}`);
    
  } catch (error) {
    console.error("Test framework failed:", error);
  }
}

runTests();
