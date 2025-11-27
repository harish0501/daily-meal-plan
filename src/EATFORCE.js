import React, { useState, useEffect } from 'react';
import {
  Bell, Droplets, Activity, Utensils, Clock, CheckCircle, X, Zap, Flame,
  Target, Download, Weight, TrendingUp, TrendingDown
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';

const EATFORCE = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState([]);
  const [completedTasks, setCompletedTasks] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [workoutLog, setWorkoutLog] = useState('');
  const [dailyLog, setDailyLog] = useState({});
  const [weight, setWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState({});

  const todayKey = format(new Date(), 'yyyy-MM-dd');

  // Load everything from localStorage
  useEffect(() => {
    const keys = ['EATFORCE_LOG', 'EATFORCE_COMPLETED', 'EATFORCE_WEIGHT'];
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (key.includes('LOG')) setDailyLog(parsed);
        if (key.includes('COMPLETED')) setCompletedTasks(parsed);
        if (key.includes('WEIGHT')) {
          setWeightHistory(parsed);
          if (parsed[todayKey]) setWeight(parsed[todayKey]);
        }
      }
    });
  }, []);

  // Save everything
  useEffect(() => {
    localStorage.setItem('EATFORCE_LOG', JSON.stringify(dailyLog));
    localStorage.setItem('EATFORCE_COMPLETED', JSON.stringify(completedTasks));
    localStorage.setItem('EATFORCE_WEIGHT', JSON.stringify(weightHistory));
  }, [dailyLog, completedTasks, weightHistory]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notification permission
  const requestNotif = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationsEnabled(perm === 'granted');
    }
  };

  const sendNotification = (title, body) => {
    if (notificationsEnabled) {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
    setNotifications(prev => [...prev.slice(-5), { id: Date.now(), title, body }]);
  };

  // Day cycle
  const dayCycle = Math.floor((new Date() - new Date('2025-01-01')) / 86400000) % 14;

  // Lunch & Workout of the day
  const lunchIdeas = [
    "Grilled Paneer + Stir-fried Veggies + Quinoa", "Chickpea Salad + Tofu + Olive Oil",
    "Dal Tadka + Cauliflower Rice + Raita", "Egg White Bhurji + 1 Roti + Salad",
    "Soya Chunk Curry + Broccoli + Brown Rice", "Moong Khichdi + Greek Yogurt",
    "Rajma + Jeera Rice + Salad", "Palak Paneer + 1 Millet Roti",
    "Besan Chilla ×3 + Mint Chutney", "Mushroom Masala + Roasted Veggies",
    "Vegetable Oats Upma + Sprouts", "Tandoori Soya Chaap + Greens",
    "Mixed Lentil Soup + Grilled Protein", "Paneer Tikka + Cucumber Salad"
  ];

  const workoutPlans = [
    "Push Day – Chest & Triceps", "Lower Body Hypertrophy", "Full Body HIIT + Abs",
    "Pull Day – Back & Biceps", "Legs + Shoulders", "Active Recovery – 10K Steps",
    "Push Volume", "Full Body Circuit", "Deadlift & Pull Power", "Upper Pump",
    "Lower Endurance", "HIIT Hell", "Rest / Light Walk", "Full Body Beast Mode"
  ];

  const todayLunch = lunchIdeas[dayCycle];
  const todayWorkout = workoutPlans[dayCycle];

  // Meal Plan (your original schedule)
  const mealPlan = [ /* ← Paste your entire original mealPlan array here (07:00 Wake Up → 21:30 Bedtime) */ ];

  const markAsComplete = (time) => {
    const key = `${time}-${todayKey}`;
    setCompletedTasks(prev => ({ ...prev, [key]: true }));
  };

  const saveWorkoutLog = () => {
    setDailyLog(prev => ({
      ...prev,
      [todayKey]: {
        ...(prev[todayKey] || {}),
        workoutDone: workoutLog || "Not logged",
        loggedAt: new Date().toISOString()
      }
    }));
    setWorkoutLog('');
  };

  const saveWeight = () => {
    if (!weight || isNaN(weight)) return;
    setWeightHistory(prev => ({ ...prev, [todayKey]: parseFloat(weight) }));
  };

  const getWeightTrend = () => {
    const dates = Object.keys(weightHistory).sort().reverse();
    if (dates.length < 2) return null;
    const diff = weightHistory[dates[0]] - weightHistory[dates[1]];
    return diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  };

  const getWeightStreak = () => {
    let streak = 0;
    let date = new Date();
    while (true) {
      const key = format(date, 'yyyy-MM-dd');
      if (weightHistory[key]) {
        streak++;
        date = subDays(date, 1);
      } else break;
    }
    return streak;
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    const log = dailyLog[todayKey] || {};
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("EATFORCE DOMINATION REPORT", 20, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, 20, 50);
    doc.text(`Weight: ${weightHistory[todayKey] || '—'} kg`, 20, 65);
    doc.text(`Meals Completed: ${Object.keys(completedTasks).filter(k => k.includes(todayKey)).length}/10`, 20, 80);
    doc.text(`Lunch: ${todayLunch}`, 20, 95);
    doc.text(`Workout Plan: ${todayWorkout}`, 20, 110);
    doc.text(`Actual Workout: ${log.workoutDone || 'Not logged'}`, 20, 125);
    doc.save(`EATFORCE_${todayKey}.pdf`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-5 pb-32">

        {/* HEADER */}
        <div className="bg-zinc-900 rounded-3xl p-6 mb-6 border-2 border-zinc-800">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-6xl font-black tracking-tighter">EATFORCE</h1>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Zap size={18} /> Zero Mercy Protocol
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
              <div className="text-sm text-zinc-500 uppercase">{format(new Date(), 'EEEE, MMM d')}</div>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-full h-5 overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000" style={{width: `${(Object.keys(completedTasks).filter(k=>k.includes(todayKey)).length/10)*100}%`}} />
          </div>
        </div>

        {/* BODY WEIGHT TRACKER */}
        <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-black flex items-center gap-3"><Weight size={32} /> Body Weight</h2>
            {getWeightTrend() && (
              <div className={`text-3xl font-black flex items-center gap-2 ${getWeightTrend().startsWith('-') ? 'text-green-500' : 'text-red-500'}`}>
                {getWeightTrend().startsWith('-') ? <TrendingDown /> : <TrendingUp />}
                {getWeightTrend()} kg
              </div>
            )}
          </div>
          <div className="flex gap-4 items-end">
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="kg"
              className="flex-1 bg-black border-2 border-zinc-700 rounded-2xl px-6 py-5 text-4xl font-black text-center"
            />
            <button onClick={saveWeight} disabled={weightHistory[todayKey]} className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xl disabled:opacity-50">
              {weightHistory[todayKey] ? 'LOCKED' : 'LOG'}
            </button>
          </div>
          {weightHistory[todayKey] && (
            <div className="text-center mt-4">
              <div className="text-6xl font-black">{weightHistory[todayKey]} kg</div>
              <div className="text-zinc-400 uppercase text-sm tracking-wider">Streak: {getWeightStreak()} days</div>
            </div>
          )}
        </div>

        {/* TODAY'S MISSION */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6">
            <h3 className="font-black uppercase mb-2 flex items-center gap-2"><Utensils size={24} /> Lunch Target</h3>
            <p className="text-lg font-bold">{todayLunch}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6">
            <h3 className="font-black uppercase mb-2 flex items-center gap-2"><Flame size={24} className="text-orange-500" /> Workout Order</h3>
            <p className="text-lg font-bold">{todayWorkout}</p>
          </div>
        </div>

        {/* Workout Log + PDF */}
        <div className="space-y-4 mb-8">
          <textarea
            value={workoutLog}
            onChange={e => setWorkoutLog(e.target.value)}
            placeholder="What did you actually destroy today?"
            className="w-full bg-black border-2 border-zinc-700 rounded-2xl p-5 text-white"
            rows="3"
          />
          <div className="flex gap-4">
            <button onClick={saveWorkoutLog} className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-xl uppercase">Lock Training Log</button>
            <button onClick={downloadReport} className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-xl uppercase flex items-center justify-center gap-3">
              <Download size={28} /> PDF Report
            </button>
          </div>
        </div>

        {/* Notifications Button */}
        {!notificationsEnabled && (
          <button onClick={requestNotif} className="w-full bg-white text-black py-6 rounded-3xl font-black text-2xl uppercase mb-8 flex items-center justify-center gap-4">
            <Bell size={32} /> Activate Alerts
          </button>
        )}

        {/* Rest of your meal schedule goes here – keep your original mealPlan rendering code */}
        {/* Just paste your mealPlan array and the schedule UI from your first version */}

      </div>
    </div>
  );
};

export default EATFORCE;