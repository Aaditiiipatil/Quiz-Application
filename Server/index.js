const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;
const SECRET_KEY = 'your_secret_key';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quizapp',
  password: 'new_secure_password',
  port: 5432
});

const QUESTIONS = [
  {
    id: 1,
    question: 'What does HTML stand for?',
    options: ['Hyper Trainer Marking Language', 'HyperText Markup Language', 'HighText Machine Language'],
    answer: 'HyperText Markup Language',
    required: true
  },
  {
    id: 2,
    question: 'Which language is used for styling web pages?',
    options: ['HTML', 'JQuery', 'CSS'],
    answer: 'CSS',
    required: true
  },
  {
    id: 3,
    question: 'Which is a JavaScript framework?',
    options: ['Laravel', 'Django', 'React'],
    answer: 'React',
    required: false
  },
  {
    id: 4,
    question: 'What does SQL stand for?',
    options: ['Strong Question Language', 'Structured Query Language', 'Structured Quick Language'],
    answer: 'Structured Query Language',
    required: true
  },
  {
    id: 5,
    question: 'Which of the following is a backend language?',
    options: ['HTML', 'Python', 'CSS'],
    answer: 'Python',
    required: true
  },
  {
    id: 6,
    question: 'What is the square root of 16?',
    options: ['2', '4', '8'],
    answer: '4',
    required: false
  },
  {
    id: 7,
    question: 'Which company developed JavaScript?',
    options: ['Microsoft', 'Netscape', 'Google'],
    answer: 'Netscape',
    required: true
  },
  {
    id: 8,
    question: 'What does API stand for?',
    options: ['Application Programming Interface', 'Advanced Programming Internet', 'Application Protocol Interface'],
    answer: 'Application Programming Interface',
    required: false
  }
];



pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    score INT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Table creation failed:', err));

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Login route
app.post('/login', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });

  const token = jwt.sign({ name, email }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

app.get('/questions', authenticateToken, (req, res) => {
  const q = QUESTIONS.map(({ id, question, options, required }) => ({ id, question, options, required }));
  res.json(q);
});

app.post('/submit', authenticateToken, async (req, res) => {
  const { name, email } = req.user;
  const { answers } = req.body;

  if (!Array.isArray(answers) || answers.length !== QUESTIONS.length) {
    return res.status(400).json({ error: 'Incomplete answers' });
  }

  const exists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0) return res.status(409).json({ error: 'Already submitted' });

  let score = 0;
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === q.answer) score++; // if (answers[i] && answers[i] ===q.answers{
                                                              //score++;
                                                               //}
  });

  await pool.query('INSERT INTO users(name, email, score) VALUES($1, $2, $3)', [name, email, score]);

  const results = await pool.query('SELECT * FROM users ORDER BY score DESC, submitted_at ASC');
  const rank = results.rows.findIndex(r => r.email === email) + 1;
  const result = score >= Math.ceil(QUESTIONS.length / 2) ? 'Pass' : 'Fail';

  res.json({ score, rank, result });
});

//  to fetch all results
app.get('/results', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name, email, score, submitted_at FROM users ORDER BY score DESC, submitted_at ASC'
    );

    const passMark = Math.ceil(QUESTIONS.length / 2); // e.g., 50% score to pass

    const ranked = result.rows.map((user, idx) => ({
      name: user.name,
      email: user.email,
      score: user.score,
      rank: idx + 1,
      result: user.score >= passMark ? 'Pass' : 'Fail'
    }));

    res.json(ranked);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
