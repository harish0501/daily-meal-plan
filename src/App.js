import React, { useState, useEffect } from 'react';
import {
  Bell, Droplets, Activity, Utensils, Clock, CheckCircle, X, Zap, Flame,
  Target, Download, Weight, TrendingUp, TrendingDown
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';

const EATFORCE = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedTasks, setCompletedTasks] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [workoutLog, setWorkoutLog] = useState('');
  const [dailyLog, setDailyLog] = useState({});
  const [weight, setWeight] = useState('');
  const [weightHistory, setWeightHistory] = useState({});
  const [lastWaterReminder, setLastWaterReminder] = useState(null);
  const [lastMoveReminder, setLastMoveReminder] = useState(null);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const dayCycle = Math.floor((new Date() - new Date('2025-01-01')) / 86400000) % 14;

  // Load data
  useEffect(() => {
    const keys = ['EATFORCE_LOG', 'EATFORCE_COMPLETED', 'EATFORCE_WEIGHT'];
    keys.forEach(k => {
      const data = localStorage.getItem(k);
      if (data) {
        const parsed = JSON.parse(data);
        if (k.includes('LOG')) setDailyLog(parsed);
        if (k.includes('COMPLETED')) setCompletedTasks(parsed);
        if (k.includes('WEIGHT')) {
          setWeightHistory(parsed);
          if (parsed[todayKey]) setWeight(parsed[todayKey]);
        }
      }
    });
  }, []);

  // Save data
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

  // Notifications
  const requestNotif = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationsEnabled(perm === 'granted');
    }
  };

  const sendNotification = (title, body) => {
    if (notificationsEnabled && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
    setNotifications(prev => [...prev.slice(-5), { id: Date.now(), title, body }]);
  };

  // Vitamin Schedule
  const getVitaminSchedule = () => {
    const day = dayCycle;
    return {
      zinc: day % 7 === 0 || day % 7 === 3,
      vitaminD: day % 7 === 0 || day % 7 === 2 || day % 7 === 5,
      vitaminC: day % 7 === 1 || day % 7 === 4 || day % 7 === 6,
      iron: day === 0 || day === 10
    };
  };

  const vitaminSchedule = getVitaminSchedule();

  // Meal Plan
  const mealPlan = [
    { time: "07:00", title: "WAKE UP", subtitle: "Warm Water Routine", description: "300ml warm water + 1 tbsp ACV + 1 cap Aloe", type: "hydration" },
    { time: "07:30", title: "HERBAL TEA", subtitle: "Metabolism Boost", description: "1 cup Herbal Tea Concentrate + lemon", type: "drink" },
    { time: "08:00", title: "BREAKFAST", subtitle: "Herbalife Shake #1", description: "F1 (2 scoops) + PDM + Fiber + 250ml liquid", supplements: ["Multivitamin", "Cell Activator", "Omega-3", "CoQ10"], type: "meal" },
    { time: "10:30", title: "MID-MORNING", subtitle: "Power Snack", description: "Fruit / 10-12 nuts / Greek yogurt + 300ml water", type: "snack" },
    { time: "13:00", title: "LUNCH", subtitle: "Main Meal", description: "½ plate veggies + ¼ protein + ¼ carbs + salad", supplements: () => {
        const base = ["Multivitamin", "Omega-3", "Cell Activator"];
        if (vitaminSchedule.zinc) base.push("Zinc");
        if (vitaminSchedule.vitaminD) base.push("Vitamin D");
        return base;
      }, note: "400ml water", type: "meal" },
    { time: "15:30", title: "AFTERNOON", subtitle: "Energy Boost", description: "Herbal Tea / Chana / Fruit + 250ml water", type: "snack" },
    { time: "17:30", title: "PRE-WORKOUT", subtitle: "Fuel Up", description: "Banana OR ½ scoop PDM in water", type: "prep" },
    { time: "18:00", title: "WORKOUT", subtitle: "Beast Mode", description: "Strength / HIIT / Chloe Ting + 500ml water", type: "workout" },
    { time: "19:30", title: "DINNER", subtitle: "Herbalife Shake #2", description: "F1 + PDM + Fiber + 250ml liquid", supplements: ["Multivitamin"], type: "meal" },
    { time: "21:30", title: "BEDTIME", subtitle: "Wind Down", description: "200ml warm water", supplements: () => {
        const s = [];
        if (vitaminSchedule.vitaminC) s.push("Vitamin C");
        if (vitaminSchedule.iron) s.push("Iron");
        return s;
      }, type: "bedtime" }
  ];

  const lunchIdeas = [
    "Grilled Paneer + Veggies + Quinoa", "Chickpea Salad + Tofu", "Dal Tadka + Cauli Rice", "Egg White Bhurji + Roti",
    "Soya Curry + Broccoli", "Moong Khichdi + Yogurt", "Rajma + Jeera Rice", "Palak Paneer + Millet Roti",
    "Besan Chilla ×3", "Mushroom Masala", "Oats Upma + Sprouts", "Tandoori Soya Chaap", "Lentil Soup", "Paneer Tikka Salad"
  ];

  const workoutPlans = [
    "Push Day", "Lower Body", "Full Body HIIT", "Pull Day", "Legs + Shoulders", "Active Recovery",
    "Push Volume", "Full Body Circuit", "Deadlift Power", "Upper Pump", "Lower Endurance", "HIIT Hell",
    "Rest Day", "Full Body Beast"
  ];

  // Reminders
  useEffect(() => {
    const mins = currentTime.getMinutes();
    const hour = currentTime.getHours();
    const timeStr = currentTime.toTimeString().slice(0, 5);

    // Water every 2 hours
    if (mins === 0 && hour % 2 === 0 && lastWaterReminder !== timeStr) {
      sendNotification("HYDRATE", "500ml now. 3.5L daily.");
      setLastWaterReminder(timeStr);
    }

    // Move every 90 mins
    if (mins % 90 === 0 && mins !== 0 && lastMoveReminder !== timeStr) {
      sendNotification("MOVE", "Stand up. Walk. 10K steps today.");
      setLastMoveReminder(timeStr);
    }

    // Meal reminders
    mealPlan.forEach(meal => {
      if (timeStr === meal.time) {
        const key = `${meal.time}-${todayKey}`;
        if (!completedTasks[key]) {
          const supps = typeof meal.supplements === 'function' ? meal.supplements() : meal.supplements || [];
          const suppText = supps.length ? `\n\nStack: ${supps.join(' • ')}` : '';
          sendNotification(meal.title, `${meal.description}${suppText}`);
        }
      }
    });
  }, [currentTime]);

  const markAsComplete = (time) => {
    const key = `${time}-${todayKey}`;
    setCompletedTasks(prev => ({ ...prev, [key]: true }));
  };

  const saveWorkoutLog = () => {
    setDailyLog(prev => ({
      ...prev,
      [todayKey]: { ...(prev[todayKey] || {}), workoutDone: workoutLog || "Logged", loggedAt: new Date().toISOString() }
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
    while (weightHistory[format(date, 'yyyy-MM-dd')]) {
      streak++;
      date = subDays(date, 1);
    }
    return streak;
  };

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("EATFORCE DOMINATION REPORT", 20, 30);
    doc.setFontSize(14);
    doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, 20, 50);
    doc.text(`Weight: ${weightHistory[todayKey] || '-'} kg`, 20, 65);
    doc.text(`Meals: ${Object.keys(completedTasks).filter(k => k.includes(todayKey)).length}/10`, 20, 80);
    doc.text(`Lunch: ${lunchIdeas[dayCycle]}`, 20, 95);
    doc.text(`Workout: ${workoutPlans[dayCycle]}`, 20, 110);
    doc.text(`Actual: ${dailyLog[todayKey]?.workoutDone || 'Not logged'}`, 20, 125);
    doc.save(`EATFORCE_${todayKey}.pdf`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto p-5 pb-32">

        {/* HEADER */}
        <div className="bg-zinc-900 rounded-3xl p-8 mb-6 border-2 border-zinc-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-7xl font-black tracking-tighter">EATFORCE</h1>
              <p className="text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap size={20} /> ZERO MERCY PROTOCOL
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</div>
              <div className="text-sm text-zinc-500 uppercase">{format(new Date(), 'EEEE, MMM d')}</div>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-full h-6 overflow-hidden">
            <div className="h-full bg-white transition-all" style={{width: `${(Object.keys(completedTasks).filter(k => k.includes(todayKey)).length / 10) * 100}%`}} />
          </div>
        </div>

        {/* WEIGHT TRACKER */}
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
            <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)}
              placeholder="kg" className="flex-1 bg-black border-2 border-zinc-700 rounded-2xl px-6 py-5 text-4xl font-black text-center" />
            <button onClick={saveWeight} disabled={!!weightHistory[todayKey]}
              className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xl disabled:opacity-50">
              {weightHistory[todayKey] ? 'LOCKED' : 'LOG'}
            </button>
          </div>
          {weightHistory[todayKey] && (
            <div className="text-center mt-6">
              <div className="text-7xl font-black">{weightHistory[todayKey]} kg</div>
              <div className="text-zinc-400 uppercase text-sm tracking-wider">Streak: {getWeightStreak()} days</div>
            </div>
          )}
        </div>

        {/* TODAY'S MISSION */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6">
            <h3 className="font-black uppercase mb-2 flex items-center gap-2"><Utensils size={24} /> Lunch Target</h3>
            <p className="text-lg font-bold">{lunchIdeas[dayCycle]}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-zinc-700 rounded-3xl p-6">
            <h3 className="font-black uppercase mb-2 flex items-center gap-2"><Flame size={24} className="text-orange-500" /> Workout Order</h3>
            <p className="text-lg font-bold">{workoutPlans[dayCycle]}</p>
          </div>
        </div>

        {/* Workout Log + PDF */}
        <div className="space-y-4 mb-8">
          <textarea value={workoutLog} onChange={e => setWorkoutLog(e.target.value)}
            placeholder="What did you actually destroy today?"
            className="w-full bg-black border-2 border-zinc-700 rounded-2xl p-5 text-white" rows="3" />
          <div className="flex gap-4">
            <button onClick={saveWorkoutLog} className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-xl uppercase">Lock Training Log</button>
            <button onClick={downloadReport} className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-xl uppercase flex items-center justify-center gap-3">
              <Download size={28} /> PDF Report
            </button>
          </div>
        </div>

        {/* Activate Alerts */}
        {!notificationsEnabled && (
          <button onClick={requestNotif} className="w-full bg-white text-black py-6 rounded-3xl font-black text-2xl uppercase mb-8 flex items-center justify-center gap-4">
            <Bell size={32} /> Activate Alerts
          </button>
        )}

        {/* Full Schedule */}
        <div className="space-y-4">
          {mealPlan.map((meal, i) => {
            const key = `${meal.time}-${todayKey}`;
            const isDone = completedTasks[key];
            const isPast = new Date().toTimeString().slice(0,5) > meal.time;

            return (
              <div key={i} className={`rounded-3xl p-6 border-2 transition-all ${isDone ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className={`text-3xl font-black px-4 py-2 rounded-xl ${isDone ? 'bg-black text-white' : 'bg-zinc-800'}`}>
                        {meal.time}
                      </span>
                      <div>
                        <div className="text-2xl font-black uppercase">{meal.title}</div>
                        <div className="text-sm opacity-70 uppercase">{meal.subtitle}</div>
                      </div>
                    </div>
                    <p className="font-bold mb-3">{meal.description}</p>
                    {typeof meal.supplements === 'function' && meal.supplements().length > 0 && (
                      <div className="text-sm font-bold opacity-80">
                        Stack: {meal.supplements().join(' • ')}
                      </div>
                    )}
                  </div>
                  {!isDone && !isPast && (
                    <button onClick={() => markAsComplete(meal.time)}
                      className="bg-white text-black w-16 h-16 rounded-2xl font-black text-3xl shadow-xl">
                      Check
                    </button>
                  )}
                  {isDone && <div className="text-6xl">Check</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EATFORCE;