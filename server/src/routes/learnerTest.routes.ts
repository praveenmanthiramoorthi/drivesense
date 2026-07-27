import { Router, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../database/connection';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logAudit } from '../services/audit.service';

const router = Router();

// Learner licence e-test questions
const QUESTIONS = [
  {
    id: 1,
    question: 'What does a round sign with a red border and white background indicate?',
    options: ['Mandatory sign', 'Prohibitory sign', 'Warning sign', 'Informatory sign'],
    correct: 1,
    category: 'Traffic Signs',
  },
  {
    id: 2,
    question: 'When approaching a zebra crossing, a driver should:',
    options: ['Speed up to cross quickly', 'Slow down and stop if pedestrians are crossing', 'Honk continuously', 'Swerve around pedestrians'],
    correct: 1,
    category: 'Road Safety',
  },
  {
    id: 3,
    question: 'The minimum age for obtaining a driving licence for a motor vehicle without gear in India is:',
    options: ['14 years', '16 years', '18 years', '21 years'],
    correct: 1,
    category: 'Traffic Rules',
  },
  {
    id: 4,
    question: 'A flashing red traffic signal means:',
    options: ['Slow down', 'Stop, then proceed when safe', 'Go ahead', 'Turn right'],
    correct: 1,
    category: 'Traffic Signs',
  },
  {
    id: 5,
    question: 'When driving on a hill, which vehicle has the right of way?',
    options: ['Vehicle going downhill', 'Vehicle going uphill', 'Heavier vehicle', 'Faster vehicle'],
    correct: 1,
    category: 'Traffic Rules',
  },
  {
    id: 6,
    question: 'What should you do when an emergency vehicle with a siren approaches from behind?',
    options: ['Speed up', 'Maintain your speed', 'Pull over to the left and stop', 'Honk back'],
    correct: 2,
    category: 'Road Safety',
  },
  {
    id: 7,
    question: 'A yellow diamond-shaped sign typically indicates:',
    options: ['School zone', 'Warning/caution', 'Speed limit', 'No parking'],
    correct: 1,
    category: 'Traffic Signs',
  },
  {
    id: 8,
    question: 'The safe following distance in good weather conditions is at least:',
    options: ['1 second', '2 seconds', '3 seconds', '5 seconds'],
    correct: 2,
    category: 'Driving Etiquette',
  },
  {
    id: 9,
    question: 'When is it illegal to overtake another vehicle?',
    options: ['On a straight road with clear visibility', 'Near a pedestrian crossing', 'On a multi-lane highway', 'When the road is empty'],
    correct: 1,
    category: 'Traffic Rules',
  },
  {
    id: 10,
    question: 'What does a solid white line on the road edge indicate?',
    options: ['You can park here', 'Edge of the road — do not cross', 'Overtaking zone', 'Bus stop ahead'],
    correct: 1,
    category: 'Traffic Signs',
  },
];

// GET /api/learner-test/questions
router.get('/questions', authMiddleware, requireRole('applicant'), (_req: Request, res: Response) => {
  // Return questions without correct answers
  const questions = QUESTIONS.map(({ correct, ...q }) => q);
  res.json({ questions, total: questions.length, timeLimit: 900 }); // 15 minutes
});

// POST /api/learner-test/submit
router.post('/submit', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const { answers } = req.body; // Array of { questionId, selectedOption }

  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: 'Answers array is required' });
    return;
  }

  const db = getDb();
  const applicant = db.prepare(`
    SELECT id FROM applicants WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant not found' });
    return;
  }

  // Calculate score
  let score = 0;
  const results = answers.map((answer: { questionId: number; selectedOption: number }) => {
    const question = QUESTIONS.find(q => q.id === answer.questionId);
    const isCorrect = question ? answer.selectedOption === question.correct : false;
    if (isCorrect) score++;
    return {
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      correctOption: question?.correct,
      isCorrect,
    };
  });

  const total = QUESTIONS.length;
  const status = score >= 7 ? 'passed' : 'failed';

  // Save test result
  const testId = uuid();
  db.prepare(`
    INSERT INTO learner_tests (id, applicant_id, score, total, status, answers_json, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(testId, applicant.id, score, total, status, JSON.stringify(results));

  // Update applicant status
  if (status === 'passed') {
    db.prepare(`
      UPDATE applicants SET learner_licence_status = 'passed' WHERE id = ?
    `).run(applicant.id);
  } else {
    db.prepare(`
      UPDATE applicants SET learner_licence_status = 'failed' WHERE id = ?
    `).run(applicant.id);
  }

  logAudit(
    req.user!.userId,
    'LEARNER_TEST_COMPLETED',
    'learner_test',
    testId,
    `Score: ${score}/${total} - ${status.toUpperCase()}`,
    req.ip || ''
  );

  res.json({
    testId,
    score,
    total,
    status,
    results,
    message: status === 'passed'
      ? 'Congratulations! You passed the learner licence e-test.'
      : 'Unfortunately, you did not pass. You can retake the test after 7 days.',
  });
});

// GET /api/learner-test/result
router.get('/result', authMiddleware, requireRole('applicant'), (req: Request, res: Response) => {
  const db = getDb();
  const applicant = db.prepare(`
    SELECT id FROM applicants WHERE user_id = ?
  `).get(req.user!.userId) as any;

  if (!applicant) {
    res.status(404).json({ error: 'Applicant not found' });
    return;
  }

  const test = db.prepare(`
    SELECT * FROM learner_tests
    WHERE applicant_id = ?
    ORDER BY started_at DESC LIMIT 1
  `).get(applicant.id);

  res.json({ test });
});

export default router;
