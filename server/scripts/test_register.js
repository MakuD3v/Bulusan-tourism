fetch('http://localhost:5000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Maku',
    email: 'makuyangsen@gmail.com',
    password: 'password123',
    role: 'USER'
  })
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
