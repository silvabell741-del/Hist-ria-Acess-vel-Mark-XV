
import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import type { Module, ModuleDownloadState } from '../types';
import { Card } from './common/Card';
import { ICONS, SpinnerIcon } from '../constants/index';
import { useNavigation } from '../contexts/NavigationContext';
import { useAuth } from '../contexts/AuthContext';
// Imports diretos dos Contextos para evitar erro de Hook fora do Provider
import { StudentAcademicContext } from '../contexts/StudentAcademicContext';
import { TeacherAcademicContext } from '../contexts/TeacherAcademicContext';
import { saveModuleOffline, removeModuleOffline, listOfflineModules } from '../utils/offlineManager';
import { useToast } from '../contexts/ToastContext';

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ModuleCard: React.FC<{ 
    module: Module; 
    onStartModule: (module: Module) => void; 
    downloadState: ModuleDownloadState;
    onToggleDownload: (module: Module) => void;
}> = React.memo(({ module, onStartModule, downloadState, onToggleDownload }) => {
    
    const isCompleted = module.progress === 100;
    const buttonText = isCompleted ? 'Revisar' : (module.progress && module.progress > 0) ? 'Continuar' : 'Iniciar';

    const difficultyColors: { [key: string]: string } = {
        'Fácil': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/30',
        'Médio': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
        'Difícil': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
    };
    const difficultyColor = module.difficulty ? difficultyColors[module.difficulty] : '';
    
    const displayMateria = Array.isArray(module.materia) ? module.materia.join(', ') : module.materia;
    const displaySeries = Array.isArray(module.series) ? module.series.join(', ') : module.series;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md flex flex-col h-full group overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
            <div className="relative">
                <img 
                    src={module.coverImageUrl || 'https://images.unsplash.com/photo-1519781542343-dc12c611d9e5?q=80&w=800&auto=format&fit=crop'} 
                    alt={`Capa do módulo ${module.title}`} 
                    className="w-full aspect-video object-cover" 
                    loading="lazy" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleDownload(module);
                        }}
                        disabled={downloadState === 'downloading'}
                        className={`p-3 rounded-full backdrop-blur-sm transition-colors shadow-sm border ${
                            downloadState === 'downloaded' 
                                ? 'bg-green-500/90 text-white border-green-400 hover:bg-red-500/90 hover:border-red-400' 
                                : 'bg-[#dc143c] text-white border-[#dc143c] hover:bg-[#b01030]'
                        }`}
                        title={downloadState === 'downloaded' ? "Baixado (Clique para remover)" : "Baixar para offline"}
                        aria-label={downloadState === 'downloaded' ? `Remover download do módulo ${module.title}` : `Baixar módulo ${module.title} para offline`}
                    >
                        {downloadState === 'downloading' ? (
                            <SpinnerIcon className="h-4 w-4 text-white" />
                        ) : downloadState === 'downloaded' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                    </button>
                    
                    {module.difficulty && (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${difficultyColor}`}>{module.difficulty}</span>
                    )}
                </div>
                
                {(module.progress !== undefined && module.progress > 0) && (
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>
                                {isCompleted ? 'Concluído' : 'Progresso'}
                            </span>
                            <span className="text-sm font-bold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}>{module.progress}%</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-2">
                            <div className={`${isCompleted ? 'bg-green-400' : 'bg-yellow-400'} h-2 rounded-full`} style={{ width: `${module.progress}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 hc-text-primary">{module.title}</h3>
                
                <div className="flex items-center flex-wrap gap-2 mt-3 text-xs font-medium">
                    {displaySeries && <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 truncate max-w-[150px]">{displaySeries}</span>}
                    {displayMateria && <span className="px-2 py-1 rounded bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 truncate max-w-[150px]">{displayMateria}</span>}
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 flex-grow hc-text-secondary">{module.description}</p>
                
                <button
                    onClick={() => onStartModule(module)}
                    className="mt-5 w-full font-bold py-3 px-4 rounded-lg text-white bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center hc-button-primary-override"
                    aria-label={`${buttonText} módulo ${module.title}`}
                >
                    <PlayIcon />
                    <span>{buttonText}</span>
                </button>
            </div>
        </div>
    );
});


const Modules: React.FC = () => {
    const { user, userRole } = useAuth();
    const { addToast } = useToast();
    const { startModule } = useNavigation();

    // Consumo Condicional de Contexto
    const studentContext = useContext(StudentAcademicContext);
    const teacherContext = useContext(TeacherAcademicContext);

    const isStudent = userRole === 'aluno' && !!studentContext;
    const isTeacher = userRole === 'professor' && !!teacherContext;

    // Persisted Filters from Context (or defaults if Teacher)
    const storedFilters = studentContext?.moduleFilters;

    // State for filters - Initialize with stored values if student
    const [searchScope, setSearchScope] = useState<'my_modules' | 'public'>(
        isStudent && storedFilters ? storedFilters.scope : 'my_modules'
    );
    const [searchQuery, setSearchQuery] = useState(
        isStudent && storedFilters ? storedFilters.queryText : ''
    );
    const [selectedSerie, setSelectedSerie] = useState(
        isStudent && storedFilters ? storedFilters.serie : (user?.series || 'all')
    );
    const [selectedMateria, setSelectedMateria] = useState(
        isStudent && storedFilters ? storedFilters.materia : 'all'
    );
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'Concluído' | 'Não iniciado' | 'Em andamento'>(
        (isStudent && storedFilters ? storedFilters.status as any : 'Em andamento')
    );
    
    const [offlineStatus, setOfflineStatus] = useState<Record<string, ModuleDownloadState>>({});
    
    // Teacher local state (since they don't use server-side search hook)
    const [teacherFilteredModules, setTeacherFilteredModules] = useState<Module[]>([]);
    const initialSearchDone = useRef(false);

    // Check offline status on mount
    useEffect(() => {
        const checkOffline = async () => {
            const offlineModules = await listOfflineModules();
            const statusMap: Record<string, ModuleDownloadState> = {};
            offlineModules.forEach(m => {
                statusMap[m.id] = 'downloaded';
            });
            setOfflineStatus(prev => ({ ...prev, ...statusMap }));
        };
        checkOffline();
    }, []);

    // Teacher: Load Library on Mount
    useEffect(() => {
        if (isTeacher) {
            teacherContext.fetchModulesLibrary();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTeacher]);

    const handleSearch = () => {
        if (isStudent) {
            // Student Logic (Server Side)
            studentContext.searchModules({
                queryText: searchQuery,
                serie: selectedSerie,
                materia: selectedMateria,
                status: selectedStatus,
                scope: searchScope
            });
        } else if (isTeacher) {
            // Teacher Logic (Client Side Filtering of Library)
            let results = teacherContext.modules; // This is the full library

            // 1. Scope Filter
            if (searchScope === 'my_modules') {
                results = results.filter(m => m.creatorId === user?.id);
            } else {
                results = results.filter(m => m.visibility === 'public');
            }

            // 2. Text Filter
            if (searchQuery) {
                const lower = searchQuery.toLowerCase();
                results = results.filter(m => m.title.toLowerCase().includes(lower));
            }

            // 3. Dropdown Filters
            if (selectedSerie !== 'all') {
                results = results.filter(m => {
                    const series = Array.isArray(m.series) ? m.series : [m.series];
                    return series.includes(selectedSerie);
                });
            }
            if (selectedMateria !== 'all') {
                results = results.filter(m => {
                    const mat = Array.isArray(m.materia) ? m.materia : [m.materia];
                    return mat.includes(selectedMateria);
                });
            }
            
            setTeacherFilteredModules(results);
        }
    };

    // Initial Search / Auto-Search Effect
    useEffect(() => {
        // For students, if we already have results in context that match our filters, we don't need to re-fetch immediately
        if (isStudent && studentContext.searchModules && !initialSearchDone.current) {
            // Only auto-search if the list is empty OR if we just mounted (to respect restored filters)
            if (studentContext.searchedModules.length === 0) {
                handleSearch();
            }
            initialSearchDone.current = true;
        }
        // For teachers, wait until modules are loaded
        if (isTeacher && teacherContext.modules.length > 0 && !initialSearchDone.current) {
            handleSearch();
            initialSearchDone.current = true;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isStudent, isTeacher, teacherContext?.modules]);

    const handleToggleDownload = async (module: Module) => {
        const currentStatus = offlineStatus[module.id] || 'not_downloaded';
        if (currentStatus === 'downloaded') {
            if (window.confirm(`Remover download de "${module.title}"?`)) {
                await removeModuleOffline(module.id);
                setOfflineStatus(prev => ({ ...prev, [module.id]: 'not_downloaded' }));
                addToast('Download removido.', 'info');
            }
        } else if (currentStatus === 'not_downloaded') {
            setOfflineStatus(prev => ({ ...prev, [module.id]: 'downloading' }));
            try {
                await saveModuleOffline(module);
                setOfflineStatus(prev => ({ ...prev, [module.id]: 'downloaded' }));
                addToast('Módulo baixado!', 'success');
            } catch (e) {
                setOfflineStatus(prev => ({ ...prev, [module.id]: 'not_downloaded' }));
                addToast('Erro ao baixar.', 'error');
            }
        }
    };

    // Determine display data
    const displayedModules = isStudent ? studentContext.searchedModules : teacherFilteredModules;
    const isLoading = isStudent ? studentContext.isSearchingModules : (isTeacher ? teacherContext.isLoadingContent : false);

    const seriesOptions = ["6º Ano", "7º Ano", "8º Ano", "9º Ano", "1º Ano (Ensino Médio)", "2º Ano (Ensino Médio)", "3º Ano (Ensino Médio)"];
    const materiaOptions = ["História", "Geografia", "Filosofia", "Sociologia", "História Sergipana", "Artes", "Ciências"];
    
    return (
        <div className="space-y-6">
            {/* Toolbar em Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 border border-slate-300 dark:border-slate-700 hc-bg-override hc-border-override">
                <div className="flex flex-col xl:flex-row gap-4 items-center justify-between">
                    
                    {/* Grupo Esquerdo: Pílula + Busca */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto flex-1 max-w-4xl">
                        
                        {/* Seletor de Escopo - Estilo Pílula */}
                        <div className="relative min-w-[180px] w-full sm:w-auto">
                            <select
                                value={searchScope}
                                onChange={(e) => setSearchScope(e.target.value as any)}
                                aria-label="Escopo da busca"
                                className="w-full appearance-none pl-4 pr-10 py-2.5 rounded-full border-2 border-indigo-600 text-indigo-700 bg-indigo-50 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300 transition-all hover:bg-indigo-100"
                            >
                                <option value="my_modules">Meus Módulos</option>
                                <option value="public">Biblioteca Pública</option>
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-indigo-600 dark:text-indigo-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* Barra de Pesquisa Escura - Flexível */}
                        <div className="relative flex-grow w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="Filtrar meus módulos..."
                                aria-label="Filtrar módulos por texto"
                                className="w-full pl-4 pr-12 py-2.5 bg-[#2d2d2d] text-white placeholder-gray-400 border-none rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner dark:bg-slate-900"
                            />
                            <button 
                                onClick={handleSearch}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-emerald-500 hover:text-emerald-600 transition-colors cursor-pointer"
                                aria-label="Executar pesquisa"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Grupo Direito: Filtros */}
                    <div className="grid grid-cols-2 sm:flex gap-2 w-full xl:w-auto items-center sm:justify-end mt-2 xl:mt-0">
                         <div className="relative w-full sm:w-auto sm:min-w-[130px]">
                            <select 
                                value={selectedSerie} 
                                onChange={e => setSelectedSerie(e.target.value)}
                                aria-label="Filtrar por Série"
                                className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-300 shadow-sm"
                            >
                                <option value="all">Ano</option>
                                {seriesOptions.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                         </div>

                         <div className="relative w-full sm:w-auto sm:min-w-[140px]">
                            <select 
                                value={selectedMateria} 
                                onChange={e => setSelectedMateria(e.target.value)}
                                aria-label="Filtrar por Matéria"
                                className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-300 shadow-sm"
                            >
                                <option value="all">Matérias</option>
                                {materiaOptions.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                         </div>

                         {/* Status Filter */}
                         {isStudent && (
                             <div className="relative w-full sm:w-auto sm:min-w-[120px] col-span-2 sm:col-span-1">
                                <select 
                                    value={selectedStatus} 
                                    onChange={e => setSelectedStatus(e.target.value as any)}
                                    aria-label="Filtrar por Status"
                                    className="w-full appearance-none px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-700 dark:border-slate-500 dark:text-slate-300 shadow-sm"
                                >
                                    <option value="all">Status</option>
                                    <option value="Em andamento">Em andamento</option>
                                    <option value="Concluído">Concluídos</option>
                                    <option value="Não iniciado">Não iniciados</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>

            {/* Resultados da Busca */}
            <div className="mt-6">
                {isLoading ? (
                     <div className="text-center py-20" role="status" aria-live="polite">
                        <SpinnerIcon className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Buscando módulos...</p>
                    </div>
                ) : displayedModules.length > 0 ? (
                    <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                        {displayedModules.map((module) => (
                            <li key={module.id}>
                                <ModuleCard 
                                    module={module} 
                                    onStartModule={startModule} 
                                    downloadState={offlineStatus[module.id] || 'not_downloaded'}
                                    onToggleDownload={handleToggleDownload}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <Card className="text-center py-16 bg-slate-50 dark:bg-slate-800/50 border-dashed border-2 border-slate-300 dark:border-slate-700">
                        <div className="inline-block p-4 bg-white dark:bg-slate-800 rounded-full mb-4 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-500 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                            Não encontrou o que procurava?
                        </h3>
                        <div className="text-left max-w-md mx-auto mt-4 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <p>O sistema busca módulos que correspondam a <strong>todos</strong> os filtros ativos:</p>
                            <ul className="list-disc pl-5 space-y-1 marker:text-indigo-500">
                                <li>Texto digitado na barra de busca.</li>
                                <li>Ano escolar selecionado.</li>
                                <li>Matéria selecionada.</li>
                                <li>Status selecionado (ex: Em andamento).</li>
                            </ul>
                            <p className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <strong>Dica:</strong> Se não encontrou aqui, mude a seleção de "Meus Módulos" para <strong>"Biblioteca Pública"</strong> no menu acima para ver conteúdos de outras escolas.
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Modules;
