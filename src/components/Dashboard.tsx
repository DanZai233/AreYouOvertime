import { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, differenceInMinutes, isToday, isFuture } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Edit3, TrendingUp, Calendar, Coffee, AlertCircle, Settings as SettingsIcon, Trash2, X, Wand2, Share2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DailyRecord {
  date: string;
  actualStart: string;
  actualEnd: string;
}

export default function Dashboard({ settings, onEditSettings }: any) {
  const [records, setRecords] = useState<DailyRecord[]>(() => {
    const saved = localStorage.getItem('jialeme_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveTime, setLeaveTime] = useState('18:00');
  const [floatingMoney, setFloatingMoney] = useState<{ id: number, amount: number, x: number }[]>([]);
  const [todayIncome, setTodayIncome] = useState(0);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleClearAll = () => {
    setRecords([]);
    setShowClearConfirm(false);
    showToast('记录已清空');
  };

  const handleClearDay = (dateStr: string) => {
    setRecords(prev => prev.filter(r => r.date !== dateStr));
  };

  const handleFillStandard = () => {
    const filled = weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWorkDay = settings.workDays.includes(day.getDay());
      const existing = records.find(r => r.date === dateStr);
      
      if (existing && (existing.actualStart || existing.actualEnd)) {
        return existing;
      }
      
      if (isWorkDay) {
        return {
          date: dateStr,
          actualStart: settings.shift.morningStart,
          actualEnd: settings.shift.afternoonEnd
        };
      }
      return null;
    }).filter(Boolean) as DailyRecord[];

    const nonWorkDayRecords = records.filter(r => {
      const d = parseISO(r.date);
      return !settings.workDays.includes(d.getDay());
    });

    const newRecords = [...filled];
    nonWorkDayRecords.forEach(r => {
      if (!newRecords.find(nr => nr.date === r.date)) {
        newRecords.push(r);
      }
    });

    setRecords(newRecords);
    showToast('已一键填满标准班次！');
  };

  useEffect(() => {
    localStorage.setItem('jialeme_records', JSON.stringify(records));
  }, [records]);

  // Calculate Income Rates
  const hourlyRate = useMemo(() => {
    const totalMonthlyHours = settings.targetWeeklyHours * (52 / 12);
    return settings.monthlySalary / totalMonthlyHours;
  }, [settings]);

  const minuteRate = hourlyRate / 60;

  // Calculate worked minutes for a day
  const calculateWorkedMinutes = (start: string, end: string) => {
    if (!start || !end) return 0;
    
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const [lsH, lsM] = settings.shift.morningEnd.split(':').map(Number);
    const [leH, leM] = settings.shift.afternoonStart.split(':').map(Number);
    
    const startMin = sH * 60 + sM;
    const endMin = eH * 60 + eM;
    const lunchStartMin = lsH * 60 + lsM;
    const lunchEndMin = leH * 60 + leM;
    
    let total = endMin - startMin;
    
    const overlapStart = Math.max(startMin, lunchStartMin);
    const overlapEnd = Math.min(endMin, lunchEndMin);
    
    if (overlapStart < overlapEnd) {
      total -= (overlapEnd - overlapStart);
    }
    
    return Math.max(0, total);
  };

  // Real-time Today Income Counter
  useEffect(() => {
    const updateIncome = () => {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const todayRecord = records.find(r => r.date === todayStr);
      
      const isWorkDay = settings.workDays.includes(now.getDay());
      if (!isWorkDay) {
        setTodayIncome(0);
        return;
      }

      const startStr = todayRecord?.actualStart || settings.shift.morningStart;
      
      // If actualEnd is set, use it. Otherwise, use current time if it's past start time.
      let endStr = todayRecord?.actualEnd;
      if (!endStr) {
        const currentHHmm = format(now, 'HH:mm');
        if (currentHHmm > startStr) {
          endStr = currentHHmm;
        } else {
          endStr = startStr;
        }
      }

      const workedMins = calculateWorkedMinutes(startStr, endStr);
      setTodayIncome(workedMins * minuteRate);
    };

    updateIncome();
    const interval = setInterval(updateIncome, 1000);
    return () => clearInterval(interval);
  }, [records, settings, minuteRate]);

  // Floating Money Effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only spawn money if it's a workday and within working hours (roughly)
      // For fun, let's just spawn it randomly every 5 seconds to simulate earning
      const amount = (minuteRate / 12).toFixed(2); // 5 seconds worth of money
      if (Number(amount) > 0) {
        setFloatingMoney(prev => [
          ...prev,
          { id: Date.now(), amount: Number(amount), x: Math.random() * 80 + 10 }
        ]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [minuteRate]);

  // Cleanup floating money
  useEffect(() => {
    if (floatingMoney.length > 0) {
      const timer = setTimeout(() => {
        setFloatingMoney(prev => prev.slice(1));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [floatingMoney]);

  // Generate Weekly Calendar
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleRecordChange = (dateStr: string, field: 'actualStart' | 'actualEnd', value: string) => {
    setRecords(prev => {
      const existing = prev.find(r => r.date === dateStr);
      if (existing) {
        return prev.map(r => r.date === dateStr ? { ...r, [field]: value } : r);
      }
      return [...prev, { date: dateStr, actualStart: '', actualEnd: '', [field]: value }];
    });
  };

  // Weekly Progress Calculation (Real-time)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const totalWorkedMinutesThisWeek = weekDays.reduce((total, day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isWorkDay = settings.workDays.includes(day.getDay());
    const record = records.find(r => r.date === dateStr);
    
    if (dateStr < todayStr) {
      // Past days
      if (record && record.actualStart && record.actualEnd) {
        return total + calculateWorkedMinutes(record.actualStart, record.actualEnd);
      } else if (isWorkDay) {
        return total + calculateWorkedMinutes(settings.shift.morningStart, settings.shift.afternoonEnd);
      }
    } else if (dateStr === todayStr) {
      // Today
      const startStr = record?.actualStart || settings.shift.morningStart;
      let endStr = record?.actualEnd;
      if (!endStr) {
        const now = new Date();
        const currentHHmm = format(now, 'HH:mm');
        endStr = currentHHmm > startStr ? currentHHmm : startStr;
      }
      return total + calculateWorkedMinutes(startStr, endStr);
    }
    // Future days don't count towards *current* progress
    return total;
  }, 0);

  const totalWorkedHours = (totalWorkedMinutesThisWeek / 60).toFixed(1);
  const targetMinutes = settings.targetWeeklyHours * 60;
  const remainingMinutes = targetMinutes - totalWorkedMinutesThisWeek;
  const progressPercent = Math.min(100, (totalWorkedMinutesThisWeek / targetMinutes) * 100);

  // Early Leave Predictor
  const calculateFuturePlan = () => {
    let plannedMinutes = 0;
    let unplannedDaysCount = 0;
    
    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isWorkDay = settings.workDays.includes(day.getDay());
      const record = records.find(r => r.date === dateStr);
      
      if (dateStr < todayStr) {
        // Past days
        if (record && record.actualStart && record.actualEnd) {
          plannedMinutes += calculateWorkedMinutes(record.actualStart, record.actualEnd);
        } else if (isWorkDay) {
          plannedMinutes += calculateWorkedMinutes(settings.shift.morningStart, settings.shift.afternoonEnd);
        }
      } else if (dateStr === todayStr) {
        // Today
        const todayStart = record?.actualStart || settings.shift.morningStart;
        const todayEnd = record?.actualEnd || leaveTime; // Use leaveTime if actualEnd not set
        plannedMinutes += calculateWorkedMinutes(todayStart, todayEnd);
      } else {
        // Future days
        if (record && record.actualStart && record.actualEnd) {
          // User planned this future day
          plannedMinutes += calculateWorkedMinutes(record.actualStart, record.actualEnd);
        } else if (isWorkDay) {
          unplannedDaysCount++;
        }
      }
    });

    const minutesNeeded = targetMinutes - plannedMinutes;

    if (unplannedDaysCount === 0) {
      if (minutesNeeded <= 0) {
        return {
          message: `按照你的排班，本周工时超额完成 ${Math.abs(minutesNeeded / 60).toFixed(1)} 小时！可以直接带薪拉屎了！🚽`,
          type: 'success',
          suggestedLeaveTime: null
        };
      } else {
        return {
          message: `警告！按照你目前的排班，本周工时还差 ${(minutesNeeded / 60).toFixed(1)} 小时！老板正在提刀赶来！😱`,
          type: 'warning',
          suggestedLeaveTime: null
        };
      }
    }

    const minutesNeededPerDay = minutesNeeded / unplannedDaysCount;
    const hoursNeededPerDay = (minutesNeededPerDay / 60).toFixed(1);

    if (minutesNeeded <= 0) {
      return {
        message: `太强了！按照目前的排班，你已经超额完成本周工时，剩下的 ${unplannedDaysCount} 个工作日可以直接请假了！🎉`,
        type: 'success',
        suggestedLeaveTime: settings.shift.morningStart // Can leave immediately
      };
    }

    // Calculate what time to leave on unplanned days assuming standard start time
    const [sH, sM] = settings.shift.morningStart.split(':').map(Number);
    const [lsH, lsM] = settings.shift.morningEnd.split(':').map(Number);
    const [leH, leM] = settings.shift.afternoonStart.split(':').map(Number);
    
    let endMin = (sH * 60 + sM) + minutesNeededPerDay;
    // Add lunch break if it crosses
    if (endMin > (lsH * 60 + lsM)) {
      endMin += ((leH * 60 + leM) - (lsH * 60 + lsM));
    }
    
    // Cap at 23:59
    endMin = Math.min(endMin, 23 * 60 + 59);
    
    const endHour = Math.floor(endMin / 60);
    const endMinute = Math.floor(endMin % 60);
    const suggestedLeaveTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

    return {
      message: `如果今天 ${leaveTime} 跑路，接下来的 ${unplannedDaysCount} 个未排班工作日，你每天需要干 ${hoursNeededPerDay} 小时。建议每天 ${suggestedLeaveTime} 下班。`,
      type: 'info',
      suggestedLeaveTime
    };
  };

  const plan = calculateFuturePlan();

  const handleShare = () => {
    const text = `【加了么】打工算命报告 🔮\n\n🎯 本周目标：${settings.targetWeeklyHours}小时\n🧱 已受苦：${totalWorkedHours}小时\n💰 当前时薪：¥${hourlyRate.toFixed(2)}\n💸 今日已赚：¥${todayIncome.toFixed(2)}\n\n🤖 摸鱼局建议：\n${plan.message}\n\n—— 拒绝画大饼，从我做起！`;
    navigator.clipboard.writeText(text).then(() => {
      showToast('报告已复制，快去发朋友圈！');
    }).catch(() => {
      showToast('复制失败，请手动截图~');
    });
  };

  return (
    <div className="min-h-screen bg-emerald-50/50 p-4 sm:p-8 pb-24 relative overflow-hidden">
      {/* Floating Money Animation */}
      <AnimatePresence>
        {floatingMoney.map(money => (
          <motion.div
            key={money.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 1, 0], y: -100, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="fixed pointer-events-none z-50 text-amber-500 font-bold text-lg drop-shadow-sm"
            style={{ left: `${money.x}%`, bottom: '20%' }}
          >
            +¥{money.amount}
          </motion.div>
        ))}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
              <Coffee className="w-6 h-6 text-emerald-500" />
              加了么
            </h1>
            <p className="text-sm text-emerald-600">你的时薪：¥{hourlyRate.toFixed(2)}/小时</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-emerald-500">今日实时收入</p>
              <p className="text-xl font-bold text-amber-500">¥{todayIncome.toFixed(2)}</p>
            </div>
            <button 
              onClick={handleShare}
              className="p-2 bg-white rounded-full shadow-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="炫耀一下"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onEditSettings}
              className="p-2 bg-white rounded-full shadow-sm text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="设置"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Mobile Today Income */}
        <div className="sm:hidden bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 flex justify-between items-center">
          <span className="text-sm text-emerald-600">今日实时收入</span>
          <span className="text-2xl font-bold text-amber-500">¥{todayIncome.toFixed(2)}</span>
        </div>

        {/* Weekly Progress Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-emerald-100/40 border border-emerald-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              本周受苦进度
            </h2>
            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              目标: {settings.targetWeeklyHours}h
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-emerald-700">
              <span>已搬砖 {totalWorkedHours} 小时</span>
              <span>还剩 {(remainingMinutes / 60).toFixed(1)} 小时</span>
            </div>
            <div className="h-4 bg-emerald-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  progressPercent >= 100 ? "bg-amber-400" : "bg-emerald-500"
                )}
              />
            </div>
            {progressPercent >= 100 && (
              <p className="text-xs text-amber-600 font-medium text-center mt-2">
                🎉 恭喜！本周已经白嫖公司电费了！
              </p>
            )}
          </div>
        </div>

        {/* Early Leave Predictor */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-6 shadow-xl shadow-emerald-200/50 text-white">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-emerald-100" />
            早退/摸鱼规划局
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <span className="text-emerald-50">今天我想在</span>
            <input 
              type="time" 
              value={leaveTime}
              onChange={(e) => setLeaveTime(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/20 border border-white/30 text-white outline-none focus:bg-white/30 transition-colors"
            />
            <span className="text-emerald-50">跑路</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
            <p className="text-sm leading-relaxed text-emerald-50">
              {plan.message}
            </p>
          </div>
        </div>

        {/* Weekly Calendar */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 px-2 gap-3">
            <h2 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              排班日历
            </h2>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleFillStandard}
                className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors bg-emerald-50 font-medium"
              >
                <Wand2 className="w-3.5 h-3.5" />
                一键填满
              </button>
              {records.length > 0 && (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空全部
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weekDays.map((day, idx) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isWorkDay = settings.workDays.includes(day.getDay());
              const record = records.find(r => r.date === dateStr);
              const isTodayDate = isToday(day);
              
              const isFutureDate = dateStr > todayStr;
              const isUnplanned = isFutureDate && isWorkDay && (!record || !record.actualEnd);
              
              const workedMins = record 
                ? calculateWorkedMinutes(record.actualStart, record.actualEnd)
                : 0;

              return (
                <div 
                  key={dateStr}
                  className={cn(
                    "bg-white rounded-2xl p-4 border transition-all hover:shadow-md",
                    isTodayDate ? "border-emerald-400 shadow-sm shadow-emerald-100" : "border-emerald-50",
                    !isWorkDay && "opacity-60 bg-gray-50/50"
                  )}
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-bold",
                        isTodayDate ? "text-emerald-600" : "text-emerald-800"
                      )}>
                        周{['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}
                      </span>
                      <span className="text-xs text-emerald-400">{format(day, 'MM/dd')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isWorkDay && (
                        <span className="text-[10px] px-2 py-1 bg-gray-200 text-gray-600 rounded-full">休息日</span>
                      )}
                      {record && (record.actualStart || record.actualEnd) && (
                        <button
                          onClick={() => handleClearDay(dateStr)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                          title="清空本日记录"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 w-8">上班</span>
                      <input
                        type="time"
                        value={record?.actualStart || ''}
                        onChange={(e) => handleRecordChange(dateStr, 'actualStart', e.target.value)}
                        className="flex-1 px-3 py-2 min-h-[40px] rounded-xl bg-emerald-50/50 border border-emerald-100 text-sm outline-none focus:border-emerald-300 focus:bg-white transition-colors"
                        placeholder={settings.shift.morningStart}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-600 w-8">下班</span>
                      <input
                        type="time"
                        value={record?.actualEnd || ''}
                        onChange={(e) => handleRecordChange(dateStr, 'actualEnd', e.target.value)}
                        className="flex-1 px-3 py-2 min-h-[40px] rounded-xl bg-emerald-50/50 border border-emerald-100 text-sm outline-none focus:border-emerald-300 focus:bg-white transition-colors"
                        placeholder={isUnplanned && plan.suggestedLeaveTime ? plan.suggestedLeaveTime : settings.shift.afternoonEnd}
                      />
                    </div>
                  </div>

                  {isUnplanned && plan.suggestedLeaveTime && (
                    <div className="mt-2 text-[10px] text-amber-500 bg-amber-50 px-2 py-1 rounded-md">
                      💡 建议 {plan.suggestedLeaveTime} 跑路
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-emerald-50 flex justify-between items-center">
                    <span className="text-xs text-emerald-500">当日工时</span>
                    <span className="text-sm font-bold text-emerald-700">
                      {(workedMins / 60).toFixed(1)}h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-900/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-emerald-100">
            <h3 className="text-lg font-bold text-emerald-900 mb-2">确认清空？</h3>
            <p className="text-sm text-emerald-600 mb-6">
              这将会清空你所有的打卡和排班记录，确定要重新开始吗？
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
              >
                手滑了
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm shadow-red-200"
              >
                狠心清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-2 bg-emerald-800 text-white px-6 py-3 rounded-full shadow-lg shadow-emerald-900/20 whitespace-nowrap"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
