import React, { useState } from 'react';
import { BookOpen, Brain, ChevronRight } from 'lucide-react';
import { educationContent, Difficulty } from '../data/educationContent';
import { UserProfile } from '../types';

interface FinancialEducationProps {
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
}

export const FinancialEducation: React.FC<FinancialEducationProps> = ({ profile, updateProfile }) => {
  const [level, setLevel] = useState<Difficulty>(profile.knowledgeLevel || 'Beginner');
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  const handleLevelChange = (newLevel: Difficulty) => {
    setLevel(newLevel);
    updateProfile({ ...profile, knowledgeLevel: newLevel });
  };

  const selectedLesson = educationContent.find(l => l.id === selectedLessonId);

  return (
    <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="text-indigo-400" />
          Módulo de Educación Financiera
        </h2>
        <select 
          value={level} 
          onChange={(e) => handleLevelChange(e.target.value as Difficulty)}
          className="bg-slate-800 text-white text-xs font-semibold px-3 py-1 rounded-full border border-slate-700 focus:outline-none"
        >
          <option value="Beginner">Principiante</option>
          <option value="Intermediate">Intermedio</option>
          <option value="Advanced">Avanzado</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {educationContent.map(lesson => (
            <button
              key={lesson.id}
              onClick={() => setSelectedLessonId(lesson.id)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${selectedLessonId === lesson.id ? 'bg-slate-800 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
            >
              <span className="text-sm font-medium text-slate-200">{lesson.title}</span>
              <ChevronRight size={16} className="text-slate-400" />
            </button>
          ))}
        </div>

        {selectedLesson ? (
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-2">{selectedLesson.title}</h3>
            <span className="text-xs font-mono uppercase text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded">{selectedLesson.topic}</span>
            <p className="text-sm text-slate-300 mt-4 leading-relaxed">
              {selectedLesson.content[level]}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500">
            <Brain size={48} className="mb-4 opacity-50" />
            <p className="text-sm">Selecciona una lección para comenzar</p>
          </div>
        )}
      </div>
    </div>
  );
};
