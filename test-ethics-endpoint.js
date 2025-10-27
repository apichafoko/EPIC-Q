const fetch = require('node-fetch');

async function testEthicsEndpoint() {
  try {
    // Primero hacer login para obtener el token
    console.log('🔍 Haciendo login...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'urifraij@gmail.com',
        password: 'password123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('🔍 Login response:', loginData);

    if (!loginData.success) {
      console.error('❌ Login failed');
      return;
    }

    // Extraer el token de las cookies
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    console.log('🔍 Set-Cookie header:', setCookieHeader);
    
    const authTokenMatch = setCookieHeader?.match(/auth-token=([^;]+)/);
    const authToken = authTokenMatch ? authTokenMatch[1] : null;
    console.log('🔍 Extracted auth token:', authToken ? `${authToken.substring(0, 20)}...` : 'null');

    if (!authToken) {
      console.error('❌ No auth token found in cookies');
      return;
    }

    // Ahora probar el endpoint de ética
    console.log('🔍 Probando endpoint de ética...');
    const ethicsResponse = await fetch('http://localhost:3001/api/coordinator/ethics?projectId=test', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-project-id': 'test',
        'Cookie': `auth-token=${authToken}`
      },
      body: JSON.stringify({
        ethicsSubmitted: true,
        ethicsApproved: false
      })
    });

    console.log('🔍 Ethics response status:', ethicsResponse.status);
    const ethicsData = await ethicsResponse.json();
    console.log('🔍 Ethics response data:', ethicsData);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEthicsEndpoint();
