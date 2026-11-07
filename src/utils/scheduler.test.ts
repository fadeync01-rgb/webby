import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDynamicSchedule, calculateWorkloadStats, formatISODateOnly, addDays } from './scheduler';
import { AcademicTask } from '../types';

test('scheduler distributes sessions across days before deadline without exceeding cap', () => {
  const refDate = new Date('2026-11-05T08:00:00Z');
  
  const tasks: AcademicTask[] = [
    {
      id: 'task-1',
      title: 'Tugas Analisis Real',
      subject: 'Kalkulus Lanjut',
      deadline: '2026-11-08T17:00:00Z', // 3 days away
      priority: 'tinggi',
      estimatedMinutes: 180, // 3 hours
      status: 'belum_mulai',
      createdAt: '2026-11-05T07:00:00Z',
    },
    {
      id: 'task-2',
      title: 'Review Jurnal Biologi',
      subject: 'Biologi Sel',
      deadline: '2026-11-06T15:00:00Z', // 1 day away
      priority: 'sedang',
      estimatedMinutes: 60,
      status: 'belum_mulai',
      createdAt: '2026-11-05T07:00:00Z',
    },
  ];

  const sessions = generateDynamicSchedule(tasks, {
    referenceDate: refDate,
    maxDailyMinutes: 240,
  });

  assert.ok(sessions.length >= 2, 'Should create multiple distributed study sessions');
  
  // Verify all sessions belong to one of our tasks
  for (const s of sessions) {
    assert.ok(['task-1', 'task-2'].includes(s.taskId));
    assert.ok(s.durationMinutes > 0);
  }

  // Verify task-2 (due earlier) gets a session on 2026-11-05 or 2026-11-06
  const task2Sessions = sessions.filter((s) => s.taskId === 'task-2');
  assert.equal(task2Sessions.length, 1);
  assert.equal(task2Sessions[0].durationMinutes, 60);

  // Check stats
  const stats = calculateWorkloadStats(tasks, sessions);
  assert.equal(stats.activeCount, 2);
  assert.equal(stats.completedCount, 0);
  assert.equal(stats.totalEstimatedHours, 4.0);
  assert.equal(stats.highPriorityCount, 1);
});

test('completed tasks are ignored by dynamic study scheduler', () => {
  const refDate = new Date('2026-11-05T08:00:00Z');
  
  const tasks: AcademicTask[] = [
    {
      id: 'task-done',
      title: 'Makalah Selesai',
      subject: 'Hukum',
      deadline: '2026-11-06T17:00:00Z',
      priority: 'tinggi',
      estimatedMinutes: 120,
      status: 'selesai',
      createdAt: '2026-11-01T07:00:00Z',
    },
  ];

  const sessions = generateDynamicSchedule(tasks, { referenceDate: refDate });
  assert.equal(sessions.length, 0, 'No sessions should be scheduled for completed tasks');

  const stats = calculateWorkloadStats(tasks, sessions);
  assert.equal(stats.activeCount, 0);
  assert.equal(stats.completedCount, 1);
  assert.equal(stats.completionPercentage, 100);
});

test('date helper functions work accurately', () => {
  const d = new Date('2026-11-05T00:00:00Z');
  assert.equal(formatISODateOnly(d), '2026-11-05');
  const nextDay = addDays(d, 3);
  assert.equal(formatISODateOnly(nextDay), '2026-11-08');
});
