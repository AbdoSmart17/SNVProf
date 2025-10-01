// teacher-tasks-script.js - الإصدار المصحح
document.addEventListener('DOMContentLoaded', () => {
    // التحقق من وجود البيانات
    if (typeof data === 'undefined') {
        console.error('❌ ملف data.js لم يتم تحميله بشكل صحيح');
        showNotification('خطأ في تحميل البيانات الأساسية', 'error');
        return;
    }

    console.log('✅ البيانات محملة بنجاح:', Object.keys(data.levels));

    const arabicDays = {
        'السبت': 6,
        'الأحد': 0,
        'الإثنين': 1,
        'الثلاثاء': 2,
        'الأربعاء': 3,
        'الخميس': 4,
    };
    
    // عناصر واجهة التوقيت الأسبوعي
    const daySelect = document.getElementById('day-select');
    const scheduleLevelSelect = document.getElementById('schedule-level');
    const scheduleClassSelect = document.getElementById('schedule-class');
    const startTimeInput = document.getElementById('start-time');
    const endTimeInput = document.getElementById('end-time');
    const addScheduleBtn = document.getElementById('add-schedule-btn');
    
    // خلايا الجدول الأسبوعي
    const saturdayCell = document.getElementById('saturday-cell');
    const sundayCell = document.getElementById('sunday-cell');
    const mondayCell = document.getElementById('monday-cell');
    const tuesdayCell = document.getElementById('tuesday-cell');
    const wednesdayCell = document.getElementById('wednesday-cell');
    const thursdayCell = document.getElementById('thursday-cell');

    // عناصر واجهة المهام
    const taskDateInput = document.getElementById('task-date');
    const taskScheduleSelect = document.getElementById('task-schedule');
    const taskTimeInput = document.getElementById('task-time');
    const taskFieldSelect = document.getElementById('task-field');
    const taskModuleSelect = document.getElementById('task-module');
    const taskActivitySelect = document.getElementById('task-activity');
    const taskNotesTextarea = document.getElementById('task-notes');
    const addTaskBtn = document.getElementById('add-task-btn');
    const tasksUl = document.getElementById('tasks-ul');

    // عناصر فلاتر المهام وأزرار Excel
    const filterAllBtn = document.getElementById('filter-all');
    const filterIncompleteBtn = document.getElementById('filter-incomplete');
    const filterCompletedBtn = document.getElementById('filter-completed');
    const exportExcelBtn = document.getElementById('export-excel-btn');
    const importExcelBtn = document.getElementById('import-excel-btn');
    const importFileInput = document.getElementById('import-file-input');

    let weeklySchedule = JSON.parse(localStorage.getItem('weeklySchedule')) || [];
    let teacherTasks = JSON.parse(localStorage.getItem('teacherTasks')) || [];

    // متغير لتخزين الحصة المحددة حالياً
    let currentSelectedSchedule = null;

    // دالة مطابقة المستويات المحسنة
    const matchLevel = (storedLevel) => {
        if (!storedLevel) return null;
        
        const levels = Object.keys(data.levels);
        
        // البحث المباشر أولاً
        if (levels.includes(storedLevel)) {
            return storedLevel;
        }
        
        // البحث بالمرادفات
        const levelSynonyms = {
            'الأولى': ['الأولى', 'الاولى', 'أولى', '1'],
            'الثانية': ['الثانية', 'الثانيه', 'ثانية', '2'],
            'الثالثة': ['الثالثة', 'الثالثه', 'ثالثة', '3'],
            'الرابعة': ['الرابعة', 'الرابعه', 'رابعة', '4']
        };
        
        for (const [correctLevel, synonyms] of Object.entries(levelSynonyms)) {
            if (synonyms.includes(storedLevel)) {
                return correctLevel;
            }
        }
        
        return null;
    };

    // تعبئة خيارات المستويات والأقسام
    const populateLevelClassSelects = () => {
        try {
            // تعبئة المستويات
            scheduleLevelSelect.innerHTML = '<option value="">-- اختر مستوى --</option>';
            Object.keys(data.levels).forEach(level => {
                const option = document.createElement('option');
                option.value = level;
                option.textContent = level;
                scheduleLevelSelect.appendChild(option);
            });

            // تعبئة الأقسام (1 إلى 10)
            scheduleClassSelect.innerHTML = '<option value="">-- اختر قسماً --</option>';
            for (let i = 1; i <= 10; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `القسم ${i}`;
                scheduleClassSelect.appendChild(option);
            }
            
            console.log('✅ تم تعبئة خيارات المستويات والأقسام بنجاح');
        } catch (error) {
            console.error('❌ خطأ في تعبئة خيارات المستويات:', error);
        }
    };

    // عرض التوقيت الأسبوعي في شكل جدول
    const renderWeeklySchedule = () => {
        // إعادة تعيين جميع الخلايا
        const dayCells = {
            'السبت': saturdayCell,
            'الأحد': sundayCell,
            'الإثنين': mondayCell,
            'الثلاثاء': tuesdayCell,
            'الأربعاء': wednesdayCell,
            'الخميس': thursdayCell
        };
        
        // تنظيف جميع الخلايا أولاً
        Object.values(dayCells).forEach(cell => {
            cell.innerHTML = '';
        });
        
        if (weeklySchedule.length === 0) {
            Object.values(dayCells).forEach(cell => {
                cell.innerHTML = '<div class="no-schedule">لا توجد حصص</div>';
            });
            return;
        }
        
        // تجميع الحصص حسب اليوم
        const schedulesByDay = {
            'السبت': [],
            'الأحد': [],
            'الإثنين': [],
            'الثلاثاء': [],
            'الأربعاء': [],
            'الخميس': []
        };
        
        weeklySchedule.forEach(schedule => {
            if (schedulesByDay[schedule.day]) {
                schedulesByDay[schedule.day].push(schedule);
            }
        });
        
        // عرض الحصص في الخلايا المناسبة
        Object.entries(schedulesByDay).forEach(([day, schedules]) => {
            const cell = dayCells[day];
            
            if (schedules.length === 0) {
                cell.innerHTML = '<div class="no-schedule">لا توجد حصص</div>';
                return;
            }
            
            // ترتيب الحصص حسب وقت البدء
            schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
            
            schedules.forEach((schedule, index) => {
                const scheduleCard = document.createElement('div');
                scheduleCard.className = 'schedule-item-card';
                scheduleCard.setAttribute('data-id', schedule.id);
                
                scheduleCard.innerHTML = `
                    <div class="schedule-class-info">${schedule.level} - القسم ${schedule.class}</div>
                    <div class="schedule-time-info">${schedule.startTime} - ${schedule.endTime}</div>
                    <div class="schedule-actions">
                        <button class="schedule-delete-btn" data-id="${schedule.id}" title="حذف الحصة">
                            🗑️
                        </button>
                    </div>
                `;
                
                cell.appendChild(scheduleCard);
            });
        });
    };

    // إضافة حصة جديدة إلى التوقيت
    const addSchedule = () => {
        const day = daySelect.value;
        const level = scheduleLevelSelect.value;
        const classNum = scheduleClassSelect.value;
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;

        if (!day || !level || !classNum || !startTime || !endTime) {
            showNotification('يرجى ملء جميع حقول التوقيت الأسبوعي', 'error');
            return;
        }

        if (startTime >= endTime) {
            showNotification('توقيت البداية يجب أن يكون قبل توقيت النهاية', 'error');
            return;
        }

        const newSchedule = { 
            day, 
            level, 
            class: classNum, 
            startTime, 
            endTime,
            id: Date.now() // معرّف فريد
        };
        
        weeklySchedule.push(newSchedule);
        localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
        
        showNotification('تم إضافة الحصة بنجاح ✓', 'success');
        renderWeeklySchedule();
        
        // إعادة تعيين الحقول
        daySelect.value = '';
        scheduleLevelSelect.value = '';
        scheduleClassSelect.value = '';
        startTimeInput.value = '';
        endTimeInput.value = '';
    };

    // حذف حصة من التوقيت
    const deleteSchedule = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الحصة؟')) {
            weeklySchedule = weeklySchedule.filter(s => s.id !== id);
            localStorage.setItem('weeklySchedule', JSON.stringify(weeklySchedule));
            renderWeeklySchedule();
            showNotification('تم حذف الحصة', 'info');
        }
    };

    // تعبئة قائمة الحصص بناءً على التاريخ - الإصدار المصحح
    const populateTaskScheduleSelect = (date) => {
        taskScheduleSelect.innerHTML = '<option value="">-- اختر حصة --</option>';
        taskScheduleSelect.disabled = true;
        resetTaskFormFields();
        
        if (!date) return;

        const dateObj = new Date(date + 'T00:00:00');
        const dayOfWeekIndex = dateObj.getDay();
        const dayOfWeekArabic = Object.keys(arabicDays).find(key => arabicDays[key] === dayOfWeekIndex);
        
        console.log('📅 التاريخ المحدد:', date, 'اليوم:', dayOfWeekArabic);
        
        if (dayOfWeekArabic) {
            const schedulesForDay = weeklySchedule.filter(s => s.day === dayOfWeekArabic);
            console.log('📚 الحصص المتاحة لهذا اليوم:', schedulesForDay);

            if (schedulesForDay.length > 0) {
                schedulesForDay.forEach((schedule) => {
                    const option = document.createElement('option');
                    option.value = schedule.id; // استخدام الـ ID بدلاً من الفهرس
                    option.textContent = `${schedule.level} - القسم ${schedule.class} (${schedule.startTime}-${schedule.endTime})`;
                    option.setAttribute('data-level', schedule.level);
                    option.setAttribute('data-start', schedule.startTime);
                    option.setAttribute('data-end', schedule.endTime);
                    taskScheduleSelect.appendChild(option);
                });
                taskScheduleSelect.disabled = false;
            } else {
                taskScheduleSelect.innerHTML = '<option value="">لا توجد حصص مبرمجة لهذا اليوم</option>';
            }
        } else {
            taskScheduleSelect.innerHTML = '<option value="">اليوم المحدد غير متاح</option>';
        }
    };

    // تعبئة خيارات الميدان بناءً على المستوى - الإصدار المصحح
    const populateFieldSelect = (level) => {
        console.log('🎯 بدء تعبئة حقول الميدان للمستوى:', level);
        taskFieldSelect.innerHTML = '<option value="">-- اختر ميدان --</option>';
        taskFieldSelect.disabled = true;
        
        if (!level) {
            console.warn('⚠️ لم يتم توفير مستوى لتعبيئة الحقول');
            return;
        }

        const matchedLevel = matchLevel(level);
        console.log('🔍 مطابقة المستوى:', level, '→', matchedLevel);
        
        if (matchedLevel && data.levels[matchedLevel]) {
            const fields = Object.keys(data.levels[matchedLevel]);
            console.log('📚 الحقول المتاحة:', fields);
            
            fields.forEach(field => {
                const option = document.createElement('option');
                option.value = field;
                option.textContent = field;
                taskFieldSelect.appendChild(option);
            });
            taskFieldSelect.disabled = false;
            console.log('✅ تم تعبئة حقول الميدان بنجاح');
        } else {
            console.warn('⚠️ لم يتم العثور على حقول للمستوى:', level);
            taskFieldSelect.innerHTML = '<option value="">لا توجد حقول لهذا المستوى</option>';
        }
        
        resetModuleActivitySelects();
        updateAddTaskButton();
    };

    // تعبئة خيارات المقطع بناءً على الميدان - الإصدار المصحح
    const populateModuleSelect = (level, field) => {
        console.log('🎯 بدء تعبئة مقاطع الميدان:', field, 'للمستوى:', level);
        taskModuleSelect.innerHTML = '<option value="">-- اختر مقطع --</option>';
        taskModuleSelect.disabled = true;
        
        if (!level || !field) {
            console.warn('⚠️ مستوى أو ميدان مفقود لتعبيئة المقاطع');
            return;
        }

        const matchedLevel = matchLevel(level);
        console.log('🔍 مطابقة المستوى للمقاطع:', level, '→', matchedLevel);
        
        if (matchedLevel && data.levels[matchedLevel] && data.levels[matchedLevel][field]) {
            const modules = data.levels[matchedLevel][field];
            console.log('📖 المقاطع المتاحة:', modules);
            
            modules.forEach(module => {
                const option = document.createElement('option');
                option.value = module;
                option.textContent = module;
                taskModuleSelect.appendChild(option);
            });
            taskModuleSelect.disabled = false;
            console.log('✅ تم تعبئة المقاطع بنجاح');
        } else {
            console.warn('⚠️ لم يتم العثور على مقاطع للميدان:', field, 'في المستوى:', level);
            taskModuleSelect.innerHTML = '<option value="">لا توجد مقاطع لهذا الميدان</option>';
        }
        
        resetActivitySelect();
        updateAddTaskButton();
    };

    // تعبئة خيارات النشاط بناءً على المقطع - الإصدار المصحح
    const populateActivitySelect = (module) => {
        console.log('🎯 بدء تعبئة الأنشطة للمقطع:', module);
        taskActivitySelect.innerHTML = '<option value="">-- اختر نشاط --</option>';
        taskActivitySelect.disabled = true;
        
        if (!module) {
            console.warn('⚠️ مقطع مفقود لتعبيئة الأنشطة');
            return;
        }

        // البحث في الأنشطة حسب المقطع
        if (data.activities_by_module && data.activities_by_module[module]) {
            const activities = data.activities_by_module[module];
            console.log('🎯 الأنشطة المتاحة:', activities);
            
            activities.forEach(activity => {
                const option = document.createElement('option');
                option.value = activity;
                option.textContent = activity;
                taskActivitySelect.appendChild(option);
            });
            taskActivitySelect.disabled = false;
            console.log('✅ تم تعبئة الأنشطة بنجاح');
        } else {
            // البحث في جميع الأنشطة إذا لم تكن مجمعة حسب المقطع
            console.log('🔍 البحث في جميع الأنشطة...');
            const allActivities = Object.values(data.activities_by_module || {}).flat();
            const filteredActivities = allActivities.filter(activity => 
                activity.includes(module) || module.includes(activity)
            );
            
            if (filteredActivities.length > 0) {
                filteredActivities.forEach(activity => {
                    const option = document.createElement('option');
                    option.value = activity;
                    option.textContent = activity;
                    taskActivitySelect.appendChild(option);
                });
                taskActivitySelect.disabled = false;
                console.log('✅ تم تعبئة الأنشطة من البحث العام');
            } else {
                console.warn('⚠️ لم يتم العثور على أنشطة للمقطع:', module);
                taskActivitySelect.innerHTML = '<option value="">لا توجد أنشطة لهذا المقطع</option>';
            }
        }
        
        updateAddTaskButton();
    };

    // إعادة تعيين الحقول
    const resetTaskFormFields = () => {
        taskTimeInput.value = '';
        taskFieldSelect.innerHTML = '<option value="">-- اختر ميدان --</option>';
        taskFieldSelect.disabled = true;
        taskModuleSelect.innerHTML = '<option value="">-- اختر مقطع --</option>';
        taskModuleSelect.disabled = true;
        taskActivitySelect.innerHTML = '<option value="">-- اختر نشاط --</option>';
        taskActivitySelect.disabled = true;
        taskNotesTextarea.value = '';
        currentSelectedSchedule = null;
        updateAddTaskButton();
    };

    // تحديث حالة زر إضافة المهمة
    const updateAddTaskButton = () => {
        const isFormValid = taskDateInput.value && 
                           taskScheduleSelect.value !== '' && 
                           taskFieldSelect.value && 
                           taskModuleSelect.value && 
                           taskActivitySelect.value;
        
        addTaskBtn.disabled = !isFormValid;
    };

    // إضافة مهمة جديدة - الإصدار المصحح
    const addTask = () => {
        const date = taskDateInput.value;
        const scheduleId = taskScheduleSelect.value;
        const field = taskFieldSelect.value;
        const module = taskModuleSelect.value;
        const activity = taskActivitySelect.value;
        const notes = taskNotesTextarea.value;

        if (!date || !scheduleId || !field || !module || !activity) {
            showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
            return;
        }

        // البحث عن الحصة المحددة باستخدام الـ ID
        const schedule = weeklySchedule.find(s => s.id == scheduleId);
        
        if (!schedule) {
            showNotification('لم يتم العثور على الحصة المحددة', 'error');
            return;
        }

        const newTask = {
            id: Date.now(),
            date,
            level: schedule.level,
            class: schedule.class,
            time: `${schedule.startTime}-${schedule.endTime}`,
            field,
            module,
            activity,
            notes,
            completed: false,
            createdAt: new Date().toISOString()
        };

        teacherTasks.push(newTask);
        localStorage.setItem('teacherTasks', JSON.stringify(teacherTasks));
        
        showNotification('تم إضافة المهمة بنجاح ✓', 'success');
        renderTasks(getActiveFilter());
        clearTaskForm();
    };

    const clearTaskForm = () => {
        taskDateInput.value = '';
        taskScheduleSelect.innerHTML = '<option value="">-- اختر تاريخاً أولاً --</option>';
        taskScheduleSelect.disabled = true;
        resetTaskFormFields();
    };

    // عرض المهام
    const renderTasks = (filter) => {
        tasksUl.innerHTML = '';
        let filteredTasks = teacherTasks;

        if (filter === 'incomplete') {
            filteredTasks = teacherTasks.filter(task => !task.completed);
        } else if (filter === 'completed') {
            filteredTasks = teacherTasks.filter(task => task.completed);
        }

        if (filteredTasks.length === 0) {
            tasksUl.innerHTML = '<li class="no-tasks">لا توجد مهام لعرضها</li>';
            return;
        }

        // ترتيب المهام حسب التاريخ (الأحدث أولاً)
        filteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        filteredTasks.forEach((task, index) => {
            const originalIndex = teacherTasks.findIndex(t => t.id === task.id);
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="task-header">
                    <div class="task-title">
                        <h4>${task.activity}</h4>
                        <span class="task-date">${task.date}</span>
                    </div>
                    <div class="task-actions">
                        <button class="btn-complete" title="${task.completed ? 'إلغاء الإكمال' : 'تمت المهمة'}">
                            ${task.completed ? '↶' : '✓'}
                        </button>
                        <button class="btn-delete" title="حذف المهمة">🗑️</button>
                    </div>
                </div>
                <div class="task-details">
                    <div class="task-meta">
                        <span>🎓 ${task.level} - القسم ${task.class}</span>
                        <span>⏰ ${task.time}</span>
                    </div>
                    <div class="task-content">
                        <p><strong>📚 الميدان:</strong> ${task.field}</p>
                        <p><strong>📖 المقطع:</strong> ${task.module}</p>
                        ${task.notes ? `<p><strong>💬 الملاحظات:</strong> ${task.notes}</p>` : ''}
                    </div>
                </div>
            `;
            
            li.querySelector('.btn-complete').addEventListener('click', () => toggleTaskCompletion(originalIndex));
            li.querySelector('.btn-delete').addEventListener('click', () => deleteTask(originalIndex));
            tasksUl.appendChild(li);
        });
    };

    // تبديل حالة الإكمال
    const toggleTaskCompletion = (index) => {
        teacherTasks[index].completed = !teacherTasks[index].completed;
        localStorage.setItem('teacherTasks', JSON.stringify(teacherTasks));
        renderTasks(getActiveFilter());
        showNotification(teacherTasks[index].completed ? 'تم إكمال المهمة ✓' : 'تم إلغاء إكمال المهمة', 'info');
    };

    // حذف مهمة
    const deleteTask = (index) => {
        if (confirm('هل أنت متأكد من حذف هذه المهمة؟')) {
            teacherTasks.splice(index, 1);
            localStorage.setItem('teacherTasks', JSON.stringify(teacherTasks));
            renderTasks(getActiveFilter());
            showNotification('تم حذف المهمة', 'info');
        }
    };

    // الحصول على الفلتر النشط
    const getActiveFilter = () => {
        if (filterIncompleteBtn.classList.contains('active')) return 'incomplete';
        if (filterCompletedBtn.classList.contains('active')) return 'completed';
        return 'all';
    };

    // ==================== دوال Excel ====================

    // دالة تصدير المهام إلى Excel
    const exportTasksToExcel = () => {
        if (teacherTasks.length === 0) {
            showNotification('لا توجد مهام لتصديرها', 'error');
            return;
        }

        try {
            // تحويل البيانات إلى تنسيق مناسب لـ Excel
            const excelData = teacherTasks.map(task => ({
                'التاريخ': task.date,
                'المستوى': task.level,
                'القسم': task.class,
                'الوقت': task.time,
                'الميدان': task.field,
                'المقطع': task.module,
                'النشاط': task.activity,
                'الملاحظات': task.notes || '',
                'الحالة': task.completed ? 'مكتملة' : 'غير مكتملة',
                'تاريخ الإنشاء': new Date(task.createdAt).toLocaleDateString('ar-DZ')
            }));

            // إنشاء ورقة عمل
            const worksheet = XLSX.utils.json_to_sheet(excelData);
            
            // إنشاء مصنف وإضافة الورقة
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'مهام الأستاذ');
            
            // توليد اسم الملف بالتاريخ الحالي
            const date = new Date().toISOString().split('T')[0];
            const fileName = `مهام_الأستاذ_${date}.xlsx`;
            
            // حفظ الملف
            XLSX.writeFile(workbook, fileName);
            
            showNotification('تم تصدير المهام إلى ملف Excel بنجاح ✓', 'success');
        } catch (error) {
            console.error('❌ خطأ في التصدير:', error);
            showNotification('حدث خطأ أثناء التصدير', 'error');
        }
    };

    // دالة استيراد البيانات من Excel
    const importTasksFromExcel = (file) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // الحصول على الورقة الأولى
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                // تحويل البيانات إلى تنسيق التطبيق
                const importedTasks = jsonData.map(item => ({
                    id: Date.now() + Math.random(),
                    date: item['التاريخ'],
                    level: item['المستوى'],
                    class: item['القسم'],
                    time: item['الوقت'],
                    field: item['الميدان'],
                    module: item['المقطع'],
                    activity: item['النشاط'],
                    notes: item['الملاحظات'] || '',
                    completed: item['الحالة'] === 'مكتملة',
                    createdAt: new Date().toISOString()
                }));
                
                // دمج المهام المستوردة مع المهام الحالية
                teacherTasks = [...teacherTasks, ...importedTasks];
                localStorage.setItem('teacherTasks', JSON.stringify(teacherTasks));
                
                showNotification(`تم استيراد ${importedTasks.length} مهمة بنجاح ✓`, 'success');
                renderTasks(getActiveFilter());
                
            } catch (error) {
                console.error('❌ خطأ في الاستيراد:', error);
                showNotification('حدث خطأ أثناء استيراد الملف', 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    };

    // دالة النسخ الاحتياطي التلقائي (كل أسبوع)
    const autoBackup = () => {
        const lastBackup = localStorage.getItem('lastAutoBackup');
        const now = new Date().getTime();
        const oneWeek = 7 * 24 * 60 * 60 * 1000; // أسبوع بالميلي ثانية
        
        if (!lastBackup || (now - parseInt(lastBackup)) > oneWeek) {
            if (teacherTasks.length > 0) {
                exportTasksToExcel();
                localStorage.setItem('lastAutoBackup', now.toString());
            }
        }
    };

    // ==================== نهاية دوال Excel ====================

    // عرض الإشعارات
    const showNotification = (message, type) => {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };

    // تهيئة التطبيق
    const initApp = () => {
        console.log('🚀 تهيئة تطبيق مهام الأستاذ...');
        
        populateLevelClassSelects();
        renderWeeklySchedule();
        renderTasks('all');
        
        // تعيين الحد الأدنى للتاريخ إلى اليوم
        const today = new Date().toISOString().split('T')[0];
        taskDateInput.min = today;
        
        // تشغيل النسخ الاحتياطي التلقائي
        autoBackup();
        
        console.log('✅ التطبيق جاهز للاستخدام');
    };

    // ربط الأحداث
    initApp();

    addScheduleBtn.addEventListener('click', addSchedule);
    
    // ربط حدث الحذف على جدول التوقيت
    document.getElementById('schedule-list').addEventListener('click', (e) => {
        if (e.target.classList.contains('schedule-delete-btn')) {
            const id = parseInt(e.target.dataset.id);
            deleteSchedule(id);
        }
    });

    // حدث اختيار التاريخ - الإصدار المصحح
    taskDateInput.addEventListener('change', (e) => {
        console.log('📅 تم اختيار تاريخ:', e.target.value);
        populateTaskScheduleSelect(e.target.value);
    });

    // حدث اختيار الحصة - الإصدار المصحح
    taskScheduleSelect.addEventListener('change', (e) => {
        console.log('🕒 تم اختيار حصة:', e.target.value);
        
        if (e.target.value !== '') {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const scheduleId = e.target.value;
            const level = selectedOption.getAttribute('data-level');
            const startTime = selectedOption.getAttribute('data-start');
            const endTime = selectedOption.getAttribute('data-end');
            
            console.log('📋 بيانات الحصة المختارة:', { scheduleId, level, startTime, endTime });
            
            // تعيين وقت الحصة
            taskTimeInput.value = `${startTime} - ${endTime}`;
            
            // تخزين الحصة المحددة
            currentSelectedSchedule = { id: scheduleId, level, startTime, endTime };
            
            // تعبئة حقول الميدان بناءً على مستوى الحصة
            populateFieldSelect(level);
        } else {
            resetTaskFormFields();
        }
    });

    // حدث اختيار الميدان - الإصدار المصحح
    taskFieldSelect.addEventListener('change', () => {
        console.log('📚 تم اختيار ميدان:', taskFieldSelect.value);
        
        if (taskFieldSelect.value && currentSelectedSchedule) {
            populateModuleSelect(currentSelectedSchedule.level, taskFieldSelect.value);
        } else {
            taskModuleSelect.innerHTML = '<option value="">-- اختر مقطع --</option>';
            taskModuleSelect.disabled = true;
            resetActivitySelect();
        }
        updateAddTaskButton();
    });

    // حدث اختيار المقطع - الإصدار المصحح
    taskModuleSelect.addEventListener('change', () => {
        console.log('📖 تم اختيار مقطع:', taskModuleSelect.value);
        
        if (taskModuleSelect.value) {
            populateActivitySelect(taskModuleSelect.value);
        } else {
            resetActivitySelect();
        }
        updateAddTaskButton();
    });

    taskActivitySelect.addEventListener('change', updateAddTaskButton);
    taskNotesTextarea.addEventListener('input', updateAddTaskButton);

    addTaskBtn.addEventListener('click', addTask);

    // أحداث الفلترة
    [filterAllBtn, filterIncompleteBtn, filterCompletedBtn].forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tasks-filter button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderTasks(e.target.id.replace('filter-', ''));
        });
    });

    // أحداث التصدير والاستيراد
    exportExcelBtn.addEventListener('click', exportTasksToExcel);

    importExcelBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (confirm('هل تريد استيراد المهام من هذا الملف؟ سيتم إضافتها إلى المهام الحالية.')) {
                importTasksFromExcel(file);
            }
        }
        // إعادة تعيين حقل الملف للسماح باختيار نفس الملف مرة أخرى
        e.target.value = '';
    });
});

// دوال مساعدة
function resetModuleActivitySelects() {
    taskModuleSelect.innerHTML = '<option value="">-- اختر مقطع --</option>';
    taskModuleSelect.disabled = true;
    resetActivitySelect();
}

function resetActivitySelect() {
    taskActivitySelect.innerHTML = '<option value="">-- اختر نشاط --</option>';
    taskActivitySelect.disabled = true;
}