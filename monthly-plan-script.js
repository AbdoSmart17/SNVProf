// Function to generate the academic calendar based on start and end dates and periods
function generateAcademicCalendar(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    const holidays = JSON.parse(localStorage.getItem('holidays') || '[]');
    const exams = JSON.parse(localStorage.getItem('exams') || '[]');
    const allPeriods = [...holidays, ...exams];
    
    const calendar = [];
    let currentDate = new Date(startDate);
    
    // ضبط تاريخ البداية ليبدأ من الأحد (أول يوم دراسة)
    let startDayOfWeek = currentDate.getDay();
    if (startDayOfWeek !== 0) { // إذا لم يكن الأحد
        // الانتقال إلى الأحد القادم
        currentDate.setDate(currentDate.getDate() + (7 - startDayOfWeek));
    }

    let weekNumber = 1;
    let currentMonth = null;
    let monthWeeks = [];

    while (currentDate <= endDate) {
        let weekStart = new Date(currentDate);
        let weekEnd = new Date(currentDate);
        // نهاية الأسبوع الدراسي هي الخميس (بعد 4 أيام من الأحد)
        weekEnd.setDate(currentDate.getDate() + 4);

        let weekType = 'دراسة';
        let periodName = '';

        // التحقق إذا كانت هذه الأسبوع تقع ضمن عطلة أو امتحانات
        const period = allPeriods.find(p => {
            const periodStart = new Date(p.start);
            const periodEnd = new Date(p.end);
            return (weekStart <= periodEnd && weekEnd >= periodStart);
        });

        if (period) {
            weekType = (period.type === 'holiday') ? 'عطلة' : 'امتحانات';
            periodName = period.name;
        }

        const monthName = weekStart.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' });
        
        // إذا تغير الشهر
        if (currentMonth !== monthName) {
            // حفظ الشهر السابق إذا كان يحتوي على أسابيع
            if (monthWeeks.length > 0) {
                calendar.push({
                    name: currentMonth,
                    weeks: [...monthWeeks]
                });
            }
            // نبدأ شهر جديد
            currentMonth = monthName;
            monthWeeks = [];
        }

        // إضافة الأسبوع للشهر الحالي
        monthWeeks.push({
            number: weekNumber,
            type: weekType,
            periodName: periodName,
            startDate: new Date(weekStart),
            endDate: new Date(weekEnd)
        });

        // الانتقال للأسبوع التالي (نضيف 7 أيام للانتقال للأحد القادم)
        currentDate.setDate(currentDate.getDate() + 7);
        weekNumber++;
    }

    // إضافة الشهر الأخير
    if (monthWeeks.length > 0) {
        calendar.push({
            name: currentMonth,
            weeks: [...monthWeeks]
        });
    }

    return calendar;
}
// Function to get all activities with their details (field, module, and activity)
function getAllActivitiesWithDetails(levelName, pattern = 'continuous') {
    const activitiesWithDetails = [];
    const fieldsData = data.levels[levelName];

    if (!fieldsData) {
        return activitiesWithDetails;
    }

    const fieldNames = Object.keys(fieldsData);

    if (levelName === 'الأولى' && pattern === 'alternating' && fieldNames.length >= 2) {
        const field1 = fieldNames[0];
        const field2 = fieldNames[1];
        
        const modules1 = fieldsData[field1];
        const modules2 = fieldsData[field2];

        let i = 0, j = 0;
        const totalModules = Math.max(modules1.length, modules2.length);

        for (let k = 0; k < totalModules; k++) {
            if (i < modules1.length) {
                const moduleName = modules1[i];
                if (data.activities_by_module[moduleName]) {
                    data.activities_by_module[moduleName].forEach(activity => {
                        activitiesWithDetails.push({ field: field1, module: moduleName, activity: activity });
                    });
                }
                i++;
            }
            if (j < modules2.length) {
                const moduleName = modules2[j];
                if (data.activities_by_module[moduleName]) {
                    data.activities_by_module[moduleName].forEach(activity => {
                        activitiesWithDetails.push({ field: field2, module: moduleName, activity: activity });
                    });
                }
                j++;
            }
        }
    } else {
        // Continuous pattern logic (for all levels)
        for (const fieldName in fieldsData) {
            const modules = fieldsData[fieldName];
            if (Array.isArray(modules)) { // For First and Second levels
                modules.forEach(moduleName => {
                    if (data.activities_by_module[moduleName]) {
                        data.activities_by_module[moduleName].forEach(activity => {
                            activitiesWithDetails.push({ field: fieldName, module: moduleName, activity: activity });
                        });
                    }
                });
            } else { // For third and fourth levels
                for (const moduleName in modules) {
                    if (Array.isArray(modules[moduleName])) {
                        modules[moduleName].forEach(activity => {
                            activitiesWithDetails.push({ field: fieldName, module: moduleName, activity: activity });
                        });
                    }
                }
            }
        }
    }

    return activitiesWithDetails;
}

// Function to generate the HTML table based on the provided data
function generateTable() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const selectedLevel = document.getElementById('level-select').value;
    const sessionsPerWeek = parseInt(document.getElementById('sessions-per-week').value, 10);
    const institutionName = document.getElementById('institution-name').value;
    const teacherName = document.getElementById('teacher-name').value;
    const teachingPattern = document.getElementById('teaching-pattern') ? document.getElementById('teaching-pattern').value : 'continuous';

    if (!startDate || !endDate || !selectedLevel || sessionsPerWeek <= 0 || !institutionName || !teacherName) {
        alert('الرجاء إدخال جميع البيانات المطلوبة.');
        return;
    }

    const calendarData = generateAcademicCalendar(startDate, endDate);
    const allActivities = getAllActivitiesWithDetails(selectedLevel, teachingPattern);

    if (allActivities.length === 0) {
        alert('لا توجد أنشطة لهذا المستوى أو النمط المحدد.');
        return;
    }

    let activityIndex = 0;
    const tableHeaders = ['الشهر', 'الأسبوع', 'الميدان', 'المقطع', 'الأنشطة'];

    let tableHTML = `
        <div class="printable-content">
            <header class="print-header">
                <div class="header-info">
                    <p><strong>المؤسسة:</strong> ${institutionName}</p>
                    <p><strong>الأستاذ:</strong> ${teacherName}</p>
                </div>
                <div class="header-title">
                    <h2>التدرج السنوي</h2>
                    <p>مستوى: ${selectedLevel}</p>
                </div>
            </header>
            <table class="monthly-plan-table">
                <thead>
                    <tr>
                        ${tableHeaders.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
    `;

    // إحصاءات
    let totalStudyWeeks = 0;
    let usedSessions = 0;
    
    // حساب إجمالي أسابيع الدراسة في الأسابيع الأربعة الأولى من كل شهر
    calendarData.forEach(month => {
        const weeksToShow = month.weeks.slice(0, 4); // نأخذ فقط أول 4 أسابيع
        const studyWeeksInMonth = weeksToShow.filter(week => week.type === 'دراسة').length;
        totalStudyWeeks += studyWeeksInMonth;
    });

    usedSessions = Math.min(totalStudyWeeks * sessionsPerWeek, allActivities.length);
    const remainingActivities = allActivities.length - usedSessions;

    calendarData.forEach(month => {
        // نأخذ فقط أول 4 أسابيع من كل شهر (نتجاهل الأسبوع الخامس تماماً)
        const weeksToShow = month.weeks.slice(0, 4);
        
        weeksToShow.forEach((week, weekIndex) => {
            const isStudyWeek = week.type === 'دراسة';
            let activitiesInWeek = [];
            let currentField = '';
            let currentModule = '';
            
            if (isStudyWeek) {
                const sessionsAvailable = sessionsPerWeek;
                
                for (let i = 0; i < sessionsAvailable; i++) {
                    if (activityIndex < allActivities.length) {
                        const activity = allActivities[activityIndex];
                        activitiesInWeek.push(activity.activity);
                        currentField = activity.field;
                        currentModule = activity.module;
                        activityIndex++;
                    }
                }
            } else {
                // نعرض فقط فترات العطل والامتحانات في الأسابيع الأربعة الأولى
                activitiesInWeek.push(week.periodName);
            }
            
            tableHTML += `
                <tr>
                    ${weekIndex === 0 ? `<td rowspan="${weeksToShow.length}" class="month-cell">${month.name}</td>` : ''}
                    <td>${week.number}</td>
                    <td class="field-cell">${currentField}</td>
                    <td class="module-cell">${currentModule}</td>
                    <td class="activities-cell">
                        ${activitiesInWeek.map(item => `<div class="activity-item">${item}</div>`).join('')}
                    </td>
                </tr>
            `;
        });
    });

    tableHTML += `
                </tbody>
            </table>
            <div class="table-summary">
                <p>عدد الحصص الأسبوعية: ${sessionsPerWeek}</p>
                <p>إجمالي الأنشطة المقررة: ${allActivities.length}</p>
                <p>الحصص المستخدمة: ${usedSessions}</p>
                <p>الأنشطة المتبقية: ${remainingActivities}</p>
                <p class="note">ملاحظة: يتم عرض 4 أسابيع فقط لكل شهر، وقد تكون هناك أسابيع إضافية غير معروضة.</p>
            </div>
        </div>
    `;

    const calendarContainer = document.getElementById('calendar-container');
    calendarContainer.innerHTML = tableHTML;
    
    // إنشاء زر الطباعة
    let printBtn = document.getElementById('print-table-btn');
    if (!printBtn) {
        printBtn = document.createElement('button');
        printBtn.id = 'print-table-btn';
        printBtn.textContent = 'طباعة الجدول';
        printBtn.classList.add('print-btn');
        calendarContainer.appendChild(printBtn);
    }
    
    printBtn.style.display = 'block';

    printBtn.onclick = function() {
        const printContent = document.querySelector('.printable-content');
        if (printContent) {
            const printWindow = window.open('', '_blank');
            const printHTML = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <title>طباعة التدرج السنوي</title>
                    <meta charset="UTF-8">
                    <style>
                        ${getPrintStyles()}
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
                </html>
            `;
            printWindow.document.write(printHTML);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        } else {
            alert('الجدول غير موجود للطباعة.');
        }
    };
}

function getPrintStyles() {
    return `
        body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            text-align: right;
            margin: 0;
            padding: 2cm;
            font-size: 12pt;
        }
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2cm;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
        }
        .header-info {
            text-align: right;
        }
        .header-info p {
            margin: 0;
        }
        .header-title {
            text-align: left;
        }
        .header-title h2, .header-title p {
            margin: 0;
            color: #000;
        }
        .monthly-plan-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
            table-layout: fixed;
        }
        .monthly-plan-table th, .monthly-plan-table td {
            border: 1px solid #ccc;
            padding: 10px;
            text-align: center;
            vertical-align: middle;
        }
        .monthly-plan-table th {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #333;
        }
        .month-cell {
            font-size: 1.2em;
            font-weight: bold;
            background-color: #e0eaf2;
        }
        .activities-cell {
            text-align: right;
        }
        .activity-item {
            display: block;
            margin-bottom: 5px;
            border-bottom: 1px dotted #ccc;
            padding-bottom: 3px;
        }
        .activity-item:last-child {
            border-bottom: none;
        }
        .table-summary {
            margin-top: 30px;
            padding: 15px;
            border: 1px dashed #ccc;
            background-color: #f9f9f9;
        }
        /* Hide non-printable elements */
        @media print {
            body { margin: 0; padding: 0; }
        }
    `;
}

// Event Listeners and Initializations
document.addEventListener('DOMContentLoaded', function() {
    
    // Populate levels from data.js
    const levelSelect = document.getElementById('level-select');
    if (data && data.levels) {
        Object.keys(data.levels).forEach(level => {
            const option = document.createElement('option');
            option.value = level;
            option.textContent = level;
            levelSelect.appendChild(option);
        });
    }
    
    // Load existing periods
    loadPeriods();
    
    // Add event listeners
    document.getElementById('add-period').addEventListener('click', addPeriod);
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('delete-period')) {
            deletePeriod(e.target);
        }
    });
    
    document.getElementById('level-select').addEventListener('change', function() {
        const patternSelectGroup = document.getElementById('pattern-select-group');
        if (this.value === 'الأولى') {
            patternSelectGroup.style.display = 'flex';
        } else {
            patternSelectGroup.style.display = 'none';
        }
    });

    document.getElementById('generate-table-btn').addEventListener('click', generateTable);

    function loadPeriods() {
        const holidays = JSON.parse(localStorage.getItem('holidays') || '[]');
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        
        const holidaysList = document.getElementById('holidays-list');
        const examsList = document.getElementById('exams-list');

        holidaysList.innerHTML = holidays.length > 0 ? holidays.map((holiday, index) => `
            <div class="period-item">
                <span>${holiday.name} (${new Date(holiday.start).toLocaleDateString('ar-DZ')} - ${new Date(holiday.end).toLocaleDateString('ar-DZ')})</span>
                <button class="delete-period" data-type="holiday" data-index="${index}">حذف</button>
            </div>
        `).join('') : '<p>لا توجد عطل مضافة</p>';

        examsList.innerHTML = exams.length > 0 ? exams.map((exam, index) => `
            <div class="period-item">
                <span>${exam.name} (${new Date(exam.start).toLocaleDateString('ar-DZ')} - ${new Date(exam.end).toLocaleDateString('ar-DZ')})</span>
                <button class="delete-period" data-type="exam" data-index="${index}">حذف</button>
            </div>
        `).join('') : '<p>لا توجد فترات امتحانات مضافة</p>';
    }

    function addPeriod() {
        const periodName = document.getElementById('period-name').value;
        const periodStart = document.getElementById('period-start').value;
        const periodEnd = document.getElementById('period-end').value;
        const periodType = document.getElementById('period-type').value;

        if (!periodName || !periodStart || !periodEnd) {
            alert('الرجاء إدخال جميع بيانات الفترة.');
            return;
        }

        const newPeriod = {
            name: periodName,
            start: periodStart,
            end: periodEnd,
            type: periodType
        };

        let periods = JSON.parse(localStorage.getItem(periodType === 'holiday' ? 'holidays' : 'exams') || '[]');
        periods.push(newPeriod);
        localStorage.setItem(periodType === 'holiday' ? 'holidays' : 'exams', JSON.stringify(periods));
        
        // Reset input fields
        document.getElementById('period-name').value = '';
        document.getElementById('period-start').value = '';
        document.getElementById('period-end').value = '';
        
        loadPeriods();
    }

    function deletePeriod(button) {
        const type = button.getAttribute('data-type');
        const index = button.getAttribute('data-index');
        let periods = JSON.parse(localStorage.getItem(type === 'holiday' ? 'holidays' : 'exams'));
        periods.splice(index, 1);
        localStorage.setItem(type === 'holiday' ? 'holidays' : 'exams', JSON.stringify(periods));
        loadPeriods();
    }
});