
import { http, HttpResponse } from 'msw';

// A mock JWT token for testing
const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InVzZXItMTIzIiwiZW1haWwiOiJ0ZXN0QGVnaXMubG9jYWwiLCJyb2xlIjoiYWRtaW4ifQ.some_signature';

export const handlers = [
    // Intercept the POST /auth/login request
    http.post('http://localhost:3000/auth/login', async ({ request }) => {

        // You can add logic here to check the request body if needed
        const info = await request.json();

        // Check for correct credentials as a bonus test
        if ((info as any).email === 'admin@aegis.local' && (info as any).password === 'password123') {
            // If correct, return a successful response with the token
            return HttpResponse.json({ access_token: mockToken });
        } else {
            // If incorrect, return an error response
            return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }
    }),
];