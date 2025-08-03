import { createServer } from 'http';
import { parse } from 'url';

const server = createServer((req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  console.log(`${req.method} ${pathname}`);

  // Mock session check
  if (pathname === '/api/auth/session' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ user: null }));
    return;
  }

  // Mock sign up
  if (pathname === '/api/auth/sign-up/email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.statusCode = 200;
        res.end(JSON.stringify({
          user: {
            id: 'demo-user-' + Date.now(),
            email: data.email,
            createdAt: new Date().toISOString(),
            emailVerified: false
          },
          session: {
            id: 'demo-session-' + Date.now(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Mock sign in
  if (pathname === '/api/auth/sign-in/email' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        res.statusCode = 200;
        res.end(JSON.stringify({
          user: {
            id: 'demo-user-signin',
            email: data.email,
            createdAt: '2024-01-01T00:00:00.000Z',
            emailVerified: true
          },
          session: {
            id: 'demo-session-signin',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // Mock sign out
  if (pathname === '/api/auth/sign-out' && req.method === 'POST') {
    res.statusCode = 200;
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // 404 for other routes
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Mock auth server running on http://localhost:${PORT}`);
});