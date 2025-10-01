
document.addEventListener('DOMContentLoaded', () => {
    const levelSelect = document.getElementById('level-select');
    const fieldSelect = document.getElementById('field-select');
    const moduleSelect = document.getElementById('module-select');
    const activitySelect = document.getElementById('activity-select');
    const competenciesList = document.getElementById('competencies-list');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchResultsInfo = document.getElementById('search-results-info');
    const printActivityBtn = document.getElementById('print-activity-btn');

    // متغيرات لتخزين البيانات الحالية
    let currentActivity = null;
    let currentModule = null;
    let currentField = null;
    let currentLevel = null;

    // Function to populate select options
    const populateSelect = (selectElement, options) => {
        selectElement.innerHTML = `<option value="">-- اختر --</option>`;
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.trim();
            optionElement.textContent = option.trim();
            selectElement.appendChild(optionElement);
        });
        selectElement.disabled = false;
    };

    // Populate levels on page load
    populateSelect(levelSelect, Object.keys(data.levels));

    // Handle level change
    levelSelect.addEventListener('change', () => {
        const selectedLevel = levelSelect.value;
        fieldSelect.disabled = true;
        moduleSelect.disabled = true;
        activitySelect.disabled = true;
        competenciesList.innerHTML = '';
        printActivityBtn.disabled = true;
        
        // إعادة تعيين البيانات الحالية
        currentLevel = selectedLevel;
        currentField = null;
        currentModule = null;
        currentActivity = null;

        if (selectedLevel) {
            const fields = Object.keys(data.levels[selectedLevel]);
            populateSelect(fieldSelect, fields);
        } else {
            fieldSelect.innerHTML = `<option value="">-- اختر ميدان --</option>`;
            moduleSelect.innerHTML = `<option value="">-- اختر مقطع --</option>`;
            activitySelect.innerHTML = `<option value="">-- اختر نشاط --</option>`;
        }
    });

    // Handle field change
    fieldSelect.addEventListener('change', () => {
        const selectedLevel = levelSelect.value;
        const selectedField = fieldSelect.value;
        moduleSelect.disabled = true;
        activitySelect.disabled = true;
        competenciesList.innerHTML = '';
        printActivityBtn.disabled = true;
        
        // تحديث البيانات الحالية
        currentField = selectedField;
        currentModule = null;
        currentActivity = null;

        if (selectedField) {
            const modules = data.levels[selectedLevel][selectedField];
            populateSelect(moduleSelect, modules);
        } else {
            moduleSelect.innerHTML = `<option value="">-- اختر مقطع --</option>`;
            activitySelect.innerHTML = `<option value="">-- اختر نشاط --</option>`;
        }
    });

    // Handle module change
    moduleSelect.addEventListener('change', () => {
        const selectedModule = moduleSelect.value.trim();
        activitySelect.disabled = true;
        competenciesList.innerHTML = '';
        printActivityBtn.disabled = true;
        
        // تحديث البيانات الحالية
        currentModule = selectedModule;
        currentActivity = null;

        if (selectedModule && data.activities_by_module[selectedModule]) {
            const activities = data.activities_by_module[selectedModule];
            populateSelect(activitySelect, activities);
        } else {
            activitySelect.innerHTML = `<option value="">-- اختر نشاط --</option>`;
        }
    });

    // Handle activity change
    activitySelect.addEventListener('change', () => {
        const selectedActivity = activitySelect.value.trim();
        competenciesList.innerHTML = '';
        
        // تحديث البيانات الحالية
        currentActivity = selectedActivity;

        if (selectedActivity && data.competencies_by_activity[selectedActivity]) {
            const competencies = data.competencies_by_activity[selectedActivity];
            competencies.forEach(competency => {
                const li = document.createElement('li');
                li.textContent = competency.trim();
                competenciesList.appendChild(li);
            });
            printActivityBtn.disabled = false;
        } else {
            printActivityBtn.disabled = true;
        }
    });

    // وظيفة البحث في مؤشرات الكفاءة
    const searchCompetencies = (searchTerm) => {
        if (!searchTerm.trim()) {
            searchResultsInfo.innerHTML = '';
            return;
        }

        const results = [];
        const searchTermLower = searchTerm.toLowerCase();

        // البحث في جميع المستويات والميادين والمقاطع والأنشطة
        for (const level in data.levels) {
            for (const field in data.levels[level]) {
                const modules = data.levels[level][field];
                for (const module of modules) {
                    const activities = data.activities_by_module[module.trim()] || [];
                    for (const activity of activities) {
                        const competencies = data.competencies_by_activity[activity.trim()] || [];
                        for (const competency of competencies) {
                            if (competency.toLowerCase().includes(searchTermLower)) {
                                results.push({
                                    level: level,
                                    field: field,
                                    module: module.trim(),
                                    activity: activity.trim(),
                                    competency: competency.trim()
                                });
                            }
                        }
                    }
                }
            }
        }

        // عرض نتائج البحث
        displaySearchResults(results, searchTerm);
    };

    // عرض نتائج البحث
    const displaySearchResults = (results, searchTerm) => {
        competenciesList.innerHTML = '';
        
        if (results.length === 0) {
            searchResultsInfo.innerHTML = `<p>لم يتم العثور على نتائج للبحث: "${searchTerm}"</p>`;
            printActivityBtn.disabled = true;
            return;
        }

        searchResultsInfo.innerHTML = `<p>تم العثور على ${results.length} نتيجة للبحث: "${searchTerm}"</p>`;
        
        // تجميع النتائج حسب النشاط
        const activitiesMap = new Map();
        
        results.forEach(result => {
            const key = `${result.level}-${result.field}-${result.module}-${result.activity}`;
            if (!activitiesMap.has(key)) {
                activitiesMap.set(key, {
                    level: result.level,
                    field: result.field,
                    module: result.module,
                    activity: result.activity,
                    competencies: []
                });
            }
            activitiesMap.get(key).competencies.push(result.competency);
        });

        // عرض النتائج المجمعة
        activitiesMap.forEach(activityData => {
            const activityHeader = document.createElement('li');
            activityHeader.className = 'search-result-header';
            activityHeader.innerHTML = `
                <strong>${activityData.activity}</strong>
                <span class="activity-path">(${activityData.level} - ${activityData.field} - ${activityData.module})</span>
                <button class="select-activity-btn" data-level="${activityData.level}" 
                        data-field="${activityData.field}" data-module="${activityData.module}" 
                        data-activity="${activityData.activity}">اختيار هذا النشاط</button>
            `;
            competenciesList.appendChild(activityHeader);

            activityData.competencies.forEach(competency => {
                const li = document.createElement('li');
                li.className = 'search-competency';
                li.textContent = competency;
                competenciesList.appendChild(li);
            });
        });

        printActivityBtn.disabled = false;
        
        // إضافة مستمعي الأحداث لأزرار اختيار النشاط
        document.querySelectorAll('.select-activity-btn').forEach(button => {
            button.addEventListener('click', function() {
                const level = this.dataset.level;
                const field = this.dataset.field;
                const module = this.dataset.module;
                const activity = this.dataset.activity;
                
                // تعيين القيم في القوائم المنسدلة
                levelSelect.value = level;
                levelSelect.dispatchEvent(new Event('change'));
                
                setTimeout(() => {
                    fieldSelect.value = field;
                    fieldSelect.dispatchEvent(new Event('change'));
                    
                    setTimeout(() => {
                        moduleSelect.value = module;
                        moduleSelect.dispatchEvent(new Event('change'));
                        
                        setTimeout(() => {
                            activitySelect.value = activity;
                            activitySelect.dispatchEvent(new Event('change'));
                        }, 100);
                    }, 100);
                }, 100);
                
                // إعادة تعيين البحث
                searchInput.value = '';
                searchResultsInfo.innerHTML = '';
            });
        });
    };

    // البحث عند النقر على زر البحث
    searchButton.addEventListener('click', () => {
        searchCompetencies(searchInput.value);
    });

    // البحث عند الضغط على Enter
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchCompetencies(searchInput.value);
        }
    });

    // وظيفة طباعة النشاط بتنسيق Word
    printActivityBtn.addEventListener('click', () => {
        if (!currentActivity || !currentModule || !currentField || !currentLevel) {
            alert('الرجاء اختيار نشاط أولاً');
            return;
        }

        const competencies = data.competencies_by_activity[currentActivity] || [];
        
        // إنشاء محتوى الطباعة
        const printContent = `
        <html dir="rtl">
        <head>
            <title>نشاط: ${currentActivity}</title>
            <link href="https://fonts.googleapis.com/css2?family=Amiri&display=swap" rel="stylesheet">
            <style>
                body {
                    font-family: 'Amiri', serif;
                    margin: 1cm;
                    line-height: 1.5;
                    direction: rtl;
                }

                .activity-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    border: 1px solid #000;
                }

                .activity-table td {
                    border: 1px solid #000;
                    padding: 12px;
                    vertical-align: top;
                }

                .right-column {
                    width: 40%;
                    background-color: #f0f0f0;
                }

                .info-item {
                    margin-bottom: 10px;
                }

                .info-label {
                    display: inline-block;
                    width: 80px;
                    font-weight: bold;
                }

                .left-column {
                    width: 60%;
                }

                .activity-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 18px;
                    margin-top: 30px;
                    padding-bottom: 5px;
                    border-bottom: 2px solid #000;
                }

                .competencies-list {
                    margin-right: 20px;
                    padding-right: 0;
                }

                .competencies-list li {
                    margin-bottom: 8px;
                }

                @media print {
                    body {
                        margin: 0.5cm;
                        background: white;
                    }

                    .right-column {
                        background-color: transparent !important;
                    }
                }
            </style>
        </head>
        <body>
            <table class="activity-table">
                <tr>
                    <td class="right-column">
                        <div class="info-item">
                            <span class="info-label">المستوى:</span> ${currentLevel}
                        </div>
                        <div class="info-item">
                            <span class="info-label">الميدان:</span> ${currentField}
                        </div>
                        <div class="info-item">
                            <span class="info-label">المقطع:</span> ${currentModule}
                        </div>
                    </td>
                    <td class="left-column">
                        <strong>مؤشرات الكفاءة:</strong>
                        <ul class="competencies-list">
                            ${competencies.map(comp => `<li>${comp}</li>`).join('')}
                        </ul>
                    </td>
                </tr>
            </table>

            <div class="activity-title">النشاط: ${currentActivity}</div>
            <div style="border-bottom: 1px solid #000; margin-top: 5px;"></div>
        </body>
        </html>
        `;


        // فتح نافذة الطباعة
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        
        // الانتظار قليلاً قبل الطباعة لضمان تحميل المحتوى
        setTimeout(() => {
            printWindow.print();
        }, 500);
    });
});
