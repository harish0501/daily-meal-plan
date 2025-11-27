import React, { useState, useEffect } from 'react';
import {
  Bell, Droplets, Activity, Utensils, Clock, CheckCircle, X, Zap, Flame,
  Target, Download, Weight, TrendingUp, TrendingDown
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import jsPDF from 'jspdf';

const App = () => {
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
        try {
          const parsed = JSON.parse(data);
          if (k.includes('LOG')) setDailyLog(parsed);
          if (k.includes('COMPLETED')) setCompletedTasks(parsed);
          if (k.includes('WEIGHT')) {
            setWeightHistory(parsed);
            if (parsed[todayKey]) setWeight(parsed[todayKey]);
          }
        } catch (e) {
          console.log('Parse error:', e);
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

  // Helper function - FIXED: Add this here to avoid "not defined" error
  const getTimeInMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

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
    { time: "07:00", title: "🌅 WAKE UP", subtitle: "Warm Water Routine", description: "300ml warm water + 1 tbsp Apple Cider Vinegar + 1 cap Aloe Concentrate", type: "hydration" },
    { time: "07:30", title: "☕ HERBAL TEA", subtitle: "Metabolism Boost", description: "1 cup Herbal Tea Concentrate + optional lemon", type: "drink" },
    { time: "08:00", title: "🍽 BREAKFAST", subtitle: "Herbalife Shake #1", description: "Formula 1 (2 scoops) + PDM (1 scoop) + Active Fiber (1 scoop) + 250ml water/almond milk", supplements: ['Multivitamin', "Men's Choice", 'Cell Activator', 'Omega-3', 'CoQ10 (200mg)', 'Cell-U-Loss'], type: "meal" },
    { time: "10:30", title: "🍏 MID-MORNING", subtitle: "Power Snack", description: "Choose ONE: Fruit / 10-12 nuts / Greek yogurt / Herbal Tea + 300ml water", type: "snack" },
    { time: "13:00", title: "🍽 LUNCH", subtitle: "Main Meal", description: "½ plate veggies + ¼ plate protein (paneer/tofu/lentils) + ¼ plate carbs + salad", supplements: () => {
        const base = ['Multivitamin', 'Omega-3', 'Cell Activator', 'Cell-U-Loss'];
        if (vitaminSchedule.zinc) base.push('Zinc');
        if (vitaminSchedule.vitaminD) base.push('Vitamin D');
        return base;
      }, note: '400ml water', type: "meal" },
    { time: "15:30", title: "☕ AFTERNOON", subtitle: "Energy Boost", description: "Herbal Tea / Roasted chana / Fruit / Protein bar + 250ml water", type: "snack" },
    { time: "17:30", title: "🏋️ PRE-WORKOUT", subtitle: "Fuel Up", description: "Optional: 1 banana OR ½ scoop PDM in water", type: "prep" },
    { time: "18:00", title: "💪 WORKOUT", subtitle: "Beast Mode", description: "Strength training / HIIT / Chloe Ting + 500ml water", type: "workout" },
    { time: "19:30", title: "🍽 DINNER", subtitle: "Herbalife Shake #2", description: "Formula 1 (2 scoops) + PDM (1 scoop) + Active Fiber (1 scoop) + 250ml water", alternative: 'Alternative: Veggie soup + paneer/tofu OR grilled veggies + protein', supplements: ['Multivitamin', 'Cell-U-Loss'], type: "meal" },
    { time: "21:30", title: "🌙 BEDTIME", subtitle: "Wind Down", description: "200ml warm water", supplements: () => {
        const s = [];
        if (vitaminSchedule.vitaminC) s.push('Vitamin C');
        if (vitaminSchedule.iron) s.push('Iron');
        return s;
      }, type: "bedtime" }
  ];

  const lunchIdeas = [
    "Grilled Paneer + Stir-fried Veggies + Quinoa", "Chickpea Salad Bowl + Grilled Tofu + Olive Oil Dressing", "Dal Tadka + Cauliflower Rice + Cucumber Raita", "Egg White Bhurji (6 whites) + Multigrain Roti + Salad",
    "Soya Chunk Curry + Broccoli + Brown Rice", "Grilled Chicken (if non-veg) + Steamed Veggies", "Moong Dal Khichdi + Greek Yogurt + Pickle", "Rajma (low oil) + Jeera Rice (small portion) + Salad",
    "Palak Paneer + 1 Roti + Beetroot Salad", "Mixed Lentil Soup + Grilled Fish (if non-veg) + Greens", "Besan Chilla (3) + Mint Chutney + Tomato Salad", "Tandoori Soya Chaap + Roasted Veggies + Yogurt",
    "Vegetable Oats Upma + Sprouts Salad", "Mushroom Masala + 1 Millet Roti + Carrot Salad"
  ];

  const workoutPlans = [
    "Upper Body Strength – Push Focus (Bench, OHP, Triceps)", "Lower Body Hypertrophy (Squats, RDL, Leg Press)", "Full Body HIIT + Core Crusher (Chloe Ting 2025 Abs)", "Pull Day – Back & Biceps (Pull-ups, Rows, Curls)",
    "Legs + Shoulders (Lunges, Lateral Raises, Calf)", "Active Recovery – 10K Steps + Yoga Flow", "Push Day Volume (Incline, Dips, Overhead)", "Full Body Circuit – 4 Rounds EMOM",
    "Deadlift & Pull Power Day", "Upper Body Pump – High Reps 15-20", "Lower Body Endurance – High Volume", "HIIT Hell – 30/15 Tabata + Finisher",
    "Rest or Light Walk – Recovery Priority", "Full Body Beast Mode – Compound Only"
  ];

  const todayLunch = lunchIdeas[dayCycle];
  const todayWorkout = workoutPlans[dayCycle];

  // Reminders
  useEffect(() => {
    const mins = currentTime.getMinutes();
    const hour = currentTime.getHours();
    const timeStr = currentTime.toTimeString().slice(0, 5);

    // Water every 2 hours
    if (mins === 0 && hour % 2 === 0 && lastWaterReminder !== timeStr) {
      sendNotification("💧 HYDRATE", "500ml now. 3.5L daily goal.");
      setLastWaterReminder(timeStr);
    }

    // Move every 90 mins
    if (mins % 90 === 0 && mins !== 0 && lastMoveReminder !== timeStr) {
      sendNotification("🚶 MOVE IT", "Stand up. Get those steps in! 10K today.");
      setLastMoveReminder(timeStr);
    }

    // Meal reminders (within 5 min window)
    mealPlan.forEach(meal => {
      const diff = Math.abs(parseInt(timeStr.replace(':', '')) - parseInt(meal.time.replace(':', '')));
      if (diff <= 5) {
        const key = `${meal.time}-${todayKey}`;
        if (!completedTasks[key]) {
          const supps = typeof meal.supplements === 'function' ? meal.supplements() : meal.supplements || [];
          const suppText = supps.length ? `\n\n💊 Stack: ${supps.join(' • ')}` : '';
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
      [todayKey]: { ...(prev[todayKey] || {}), workoutDone: workoutLog || "Not logged", loggedAt: new Date().toISOString(), mealsCompleted: Object.keys(completedTasks).filter(k => k.includes(todayKey)).length }
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

  const getCompletedCount = () => Object.keys(completedTasks).filter(k => k.includes(todayKey)).length;

  const downloadReport = () => {
    const doc = new jsPDF();
    const log = dailyLog[todayKey] || {};
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("EATFORCE DAILY DOMINATION REPORT", 20, 30);
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${format(new Date(), 'dd MMMM yyyy')}`, 20, 50);
    doc.text(`Weight: ${weightHistory[todayKey] || '—'} kg`, 20, 65);
    doc.text(`Meals Annihilated: ${log.mealsCompleted || getCompletedCount()}/10`, 20, 80);
    doc.text(`Lunch Target: ${todayLunch}`, 20, 95);
    doc.text(`Workout Plan: ${todayWorkout}`, 20, 110);
    doc.text(`Actual Workout: ${log.workoutDone || 'Not logged'}`, 20, 125);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleTimeString()}`, 20, 155);
    doc.save(`EATFORCE_${todayKey}.pdf`);
  };

  const getCurrentMeal = () => {
    const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    let closest = null;
    let minDiff = Infinity;
    mealPlan.forEach(meal => {
      const mealMins = getTimeInMinutes(meal.time);
      const diff = Math.abs(nowMins - mealMins);
      if (diff < minDiff && diff <= 30) {
        minDiff = diff;
        closest = meal;
      }
    });
    return closest;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="bg-zinc-900 rounded-3xl shadow-2xl p-6 mb-6 border-2 border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-black tracking-tighter mb-1">EATFORCE</h1>
              <div className="flex items-center gap-2 text-zinc-400">
                <Zap size={16} />
                <span className="text-sm font-bold tracking-widest uppercase">Zero Mercy Protocol</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-xs text-zinc-500 font-bold tracking-widest uppercase">
                {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="bg-zinc-800 rounded-full h-4 overflow-hidden mb-3">
            <div className="h-full bg-white transition-all duration-500 rounded-full" style={{ width: `${(getCompletedCount() / mealPlan.length) * 100}%` }}></div>
          </div>
          <div className="text-center text-sm font-black text-zinc-400 tracking-widest uppercase">
            {getCompletedCount() } / {mealPlan.length} Annihilated
          </div>
          {!notificationsEnabled && (
            <button onClick={requestNotif} className="w-full bg-white text-black py-5 rounded-2xl font-black text-lg mt-6 hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center gap-3 uppercase tracking-wider">
              <Bell size={24} /> Activate Alerts
            </button>
          )}
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl hover:border-white transition-all">
            <Droplets size={32} className="mb-2" />
            <div className="text-3xl font-black">3.5L</div>
            <div className="text-xs font-black opacity-60 uppercase tracking-wider">Water</div>
          </div>
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl hover:border-white transition-all">
            <Activity size={32} className="mb-2" />
            <div className="text-3xl font-black">10K</div>
            <div className="text-xs font-black opacity-60 uppercase tracking-wider">Steps</div>
          </div>
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-5 shadow-xl hover:border-white transition-all">
            <Flame size={32} className="mb-2 text-orange-500" />
            <div className="text-3xl font-black">{mealPlan.length}</div>
            <div className="text-xs font-black opacity-60 uppercase tracking-wider">Targets</div>
          </div>
        </div>

        {/* Vitamins */}
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl shadow-2xl p-6 mb-6">
          <h2 className="text-2xl font-black mb-5 flex items-center gap-3 uppercase tracking-wide">
            <Target size={28} /> Supplement Protocol
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Zinc', active: vitaminSchedule.zinc, time: 'Lunch' },
              { name: 'Vitamin D', active: vitaminSchedule.vitaminD, time: 'Lunch' },
              { name: 'Vitamin C', active: vitaminSchedule.vitaminC, time: 'Bedtime' },
              { name: 'Iron', active: vitaminSchedule.iron, time: 'Bedtime' }
            ].map((vit, i) => (
              <div key={i} className={`p-5 rounded-2xl font-black transition-all border-2 ${vit.active ? 'bg-white text-black border-white scale-105' : 'bg-zinc-800 text-zinc-600 border-zinc-700'}`}>
                <div className="text-lg uppercase tracking-wide">{vit.name}</div>
                <div className="text-xs opacity-60 uppercase tracking-widest">{vit.time}</div>
                <div className="text-3xl mt-2">{vit.active ? '●' : '○'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body Weight Tracker */}
        <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 border-2 border-zinc-700 rounded-3xl p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black flex items-center gap-3 uppercase">
              <Weight size={32} /> Body Weight
            </h2>
            {getWeightTrend() && (
              <div className={`text-3xl font-black ${getWeightTrend().startsWith('-') ? 'text-green-500' : 'text-red-500'}`}>
                {getWeightTrend()} kg
              </div>
            )}
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Enter today's weight (kg)"
                className="w-full bg-black border-2 border-zinc-700 rounded-2xl px-5 py-5 text-3xl font-black text-center placeholder-zinc-600"
              />
            </div>
            <button
              onClick={saveWeight}
              disabled={!weight || weightHistory[todayKey]}
              className="bg-white text-black px-8 py-5 rounded-2xl font-black text-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {weightHistory[todayKey] ? 'Locked' : 'Log'}
            </button>
          </div>
          {weightHistory[todayKey] && (
            <div className="mt-4 text-center">
              <div className="text-5xl font-black text-white">{weightHistory[todayKey]} kg</div>
              <div className="text-sm text-zinc-400 uppercase tracking-wider">
                Logged today • {getWeightStreak()}-day streak
              </div>
            </div>
          )}
        </div>

        {/* Today's Mission */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-zinc-700 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Utensils size={28} />
              <h3 className="text-xl font-black uppercase">Lunch Target</h3>
            </div>
            <p className="text-lg font-bold text-white leading-tight">{todayLunch}</p>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border-2 border-zinc-700 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Flame size={28} className="text-orange-500" />
              <h3 className="text-xl font-black uppercase">Workout Order</h3>
            </div>
            <p className="text-lg font-bold text-white leading-tight">{todayWorkout}</p>
          </div>
        </div>

        {/* Workout Log */}
        <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl p-6 mb-6">
          <h3 className="text-xl font-black mb-4 flex items-center gap-3 uppercase">
            <Target size={24} /> Log Today's Workout
          </h3>
          <textarea
            value={workoutLog}
            onChange={(e) => setWorkoutLog(e.target.value)}
            placeholder="Exactly what you destroyed today..."
            className="w-full bg-black border border-zinc-700 rounded-2xl p-4 text-white font-medium placeholder-zinc-600"
            rows={3}
          />
          <button
            onClick={saveWorkoutLog}
            className="mt-4 w-full bg-white text-black py-4 rounded-2xl font-black text-lg uppercase tracking-wider hover:bg-zinc-200 transition-all"
          >
            Lock In Training Log
          </button>
        </div>

        {/* PDF Download */}
        <button
          onClick={downloadReport}
          className="w-full bg-white text-black py-6 rounded-3xl font-black text-2xl uppercase tracking-wider flex items-center justify-center gap-4 hover:bg-zinc-200 transition-all shadow-2xl mb-8"
        >
          <Download size={32} /> Download Today's War Report (PDF)
        </button>

        {/* Current Meal Highlight */}
        {getCurrentMeal() && (
          <div className="bg-white text-black rounded-3xl shadow-2xl p-8 mb-6 border-4 border-black">
            <div className="flex items-center gap-4 mb-4">
              <Clock size={40} />
              <div>
                <div className="text-sm font-black opacity-60 uppercase tracking-widest">Active Target</div>
                <div className="text-4xl font-black tracking-tight">{getCurrentMeal().title}</div>
                <div className="text-xl font-bold opacity-70">{getCurrentMeal().subtitle}</div>
              </div>
            </div>
            <div className="bg-black text-white rounded-2xl p-5 mb-4">
              <p className="text-lg font-bold">{getCurrentMeal().description}</p>
            </div>
            {getCurrentMeal().supplements && (
              <div className="bg-zinc-900 text-white rounded-2xl p-5 mb-4">
                <div className="font-black mb-2 text-sm uppercase tracking-widest">💊 Stack:</div>
                <div className="text-sm font-bold">
                  {typeof getCurrentMeal().supplements === 'function' ? getCurrentMeal().supplements().join(' • ') : getCurrentMeal().supplements.join(' • ')}
                </div>
              </div>
            )}
            <button
              onClick={() => markAsComplete(getCurrentMeal().time)}
              className="w-full bg-black text-white px-8 py-5 rounded-2xl font-black text-xl transition-all shadow-xl border-2 border-black hover:bg-zinc-900 uppercase tracking-wider"
            >
              ✓ Execute
            </button>
          </div>
        )}

        {/* Schedule */}
        <div className="space-y-4">
          {mealPlan.map((meal, index) => {
            const taskKey = `${meal.time}-${todayKey}`;
            const isCompleted = completedTasks[taskKey];
            const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();
            const mealMins = getTimeInMinutes(meal.time);
            const isPast = mealMins < currentMins;

            return (
              <div key={index} className={`rounded-3xl shadow-xl transition-all border-2 ${isCompleted ? 'bg-white text-black border-white' : isPast ? 'bg-zinc-900 border-zinc-800 opacity-30' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'}`}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className={`text-2xl font-black px-5 py-3 rounded-xl ${isCompleted ? 'bg-black text-white' : 'bg-zinc-800'}`}>
                          {meal.time}
                        </span>
                        <div>
                          <div className="text-2xl font-black tracking-tight uppercase">{meal.title}</div>
                          <div className="text-sm font-bold opacity-60 uppercase tracking-wider">{meal.subtitle}</div>
                        </div>
                      </div>
                      <div className={`rounded-xl p-4 mb-3 ${isCompleted ? 'bg-zinc-100' : 'bg-zinc-800'}`}>
                        <p className="font-semibold text-sm">{meal.description}</p>
                      </div>
                      {meal.supplements && (
                        <div className={`rounded-xl p-4 border ${isCompleted ? 'bg-zinc-100 border-zinc-300' : 'bg-zinc-800 border-zinc-700'}`}>
                          <div className="text-xs font-black uppercase tracking-widest mb-2 opacity-60">💊 Stack</div>
                          <div className="text-xs font-bold">
                            {typeof meal.supplements === 'function' ? meal.supplements().join(' • ') : meal.supplements.join(' • ')}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isCompleted && !isPast && (
                      <button
                        onClick={() => markAsComplete(meal.time)}
                        className="bg-white text-black px-5 py-4 rounded-xl font-black text-lg hover:scale-110 transition-transform shadow-xl ml-4 border-2 border-black"
                      >
                        ✓
                      </button>
                    )}
                    {isCompleted && (
                      <div className="font-black text-4xl ml-4">✓</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Notifications Log */}
        {notifications.length > 0 && (
          <div className="bg-zinc-900 border-2 border-zinc-800 rounded-3xl shadow-2xl p-6 mt-6">
            <h2 className="text-xl font-black mb-4 flex items-center gap-3 uppercase tracking-wide">
              <Bell size={24} /> Alert Log
            </h2>
            <div className="space-y-3">
              {notifications.slice(-3).reverse().map(notif => (
                <div key={notif.id} className="bg-zinc-800 border border-zinc-700 p-4 rounded-2xl flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-black text-sm uppercase tracking-wide">{notif.title}</div>
                    <div className="text-sm opacity-70 font-medium">{notif.body}</div>
                  </div>
                  <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} className="text-zinc-600 hover:text-white ml-3">
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;