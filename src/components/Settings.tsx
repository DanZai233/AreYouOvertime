import React, { useState } from 'react';
import { Settings as SettingsIcon, Briefcase, Clock, DollarSign, CalendarDays, RotateCcw, X } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Settings({ onSave, initialSettings, onCancel }: any) {
  const defaultSettings = {
    monthlySalary: 10000,
    targetWeeklyHours: 40,
    workDays: [1, 2, 3, 4, 5], // Mon-Fri
    shift: {
      morningStart: '09:00',
      morningEnd: '12:00',
      afternoonStart: '13:00',
      afternoonEnd: '18:00',
    }
  };

  const [formData, setFormData] = useState(initialSettings || defaultSettings);

  const handleReset = () => {
    if (window.confirm('确定要重置为默认设置吗？')) {
      setFormData(defaultSettings);
    }
  };

  const handleDayToggle = (day: number) => {
    setFormData((prev: any) => {
      const newDays = prev.workDays.includes(day)
        ? prev.workDays.filter((d: number) => d !== day)
        : [...prev.workDays, day];
      return { ...prev, workDays: newDays.sort() };
    });
  };

  const handleChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-100/50 p-6 sm:p-8 border border-emerald-50">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-900">加了么</h1>
              <p className="text-sm text-emerald-600/80">你的打工人专属算命器</p>
            </div>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Salary */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              虚假月薪 (元)
            </label>
            <input
              type="number"
              value={formData.monthlySalary}
              onChange={(e) => handleChange('monthlySalary', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-emerald-900"
              placeholder="10000"
              required
            />
          </div>

          {/* Target Hours */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <Briefcase className="w-4 h-4 text-emerald-500" />
              公司规定的每周工时 (小时)
            </label>
            <input
              type="number"
              value={formData.targetWeeklyHours}
              onChange={(e) => handleChange('targetWeeklyHours', Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl bg-emerald-50/50 border border-emerald-100 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-emerald-900"
              placeholder="40"
              required
            />
          </div>

          {/* Work Days */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              每周打工天数
            </label>
            <div className="flex justify-between gap-1">
              {daysOfWeek.map((day, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDayToggle(index)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    formData.workDays.includes(index)
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                  )}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Shift Times */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-800">
              <Clock className="w-4 h-4 text-emerald-500" />
              标准班次 (用于扣除午休)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs text-emerald-600">上午上班</span>
                <input
                  type="time"
                  value={formData.shift.morningStart}
                  onChange={(e) => handleChange('shift.morningStart', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100 focus:border-emerald-300 outline-none text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-emerald-600">上午下班</span>
                <input
                  type="time"
                  value={formData.shift.morningEnd}
                  onChange={(e) => handleChange('shift.morningEnd', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100 focus:border-emerald-300 outline-none text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-emerald-600">下午上班</span>
                <input
                  type="time"
                  value={formData.shift.afternoonStart}
                  onChange={(e) => handleChange('shift.afternoonStart', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100 focus:border-emerald-300 outline-none text-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-emerald-600">下午下班</span>
                <input
                  type="time"
                  value={formData.shift.afternoonEnd}
                  onChange={(e) => handleChange('shift.afternoonEnd', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-emerald-50/50 border border-emerald-100 focus:border-emerald-300 outline-none text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl font-medium text-lg transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              重置
            </button>
            <button
              type="submit"
              className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium text-lg transition-colors shadow-lg shadow-emerald-200"
            >
              {initialSettings ? '保存设置' : '开始算命'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
