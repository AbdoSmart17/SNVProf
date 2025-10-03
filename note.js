// note.js - إدارة نقاط التلاميذ
document.addEventListener('DOMContentLoaded', function() {
    let studentsData = [];
    let currentSheet = null;
    let selectedRows = new Set();
    let isSelecting = false;
    let allRows = [];
    let currentSheetName = '';
    let lastNameColumn = -1;
    let firstNameColumn = -1;
    let studentRowsStart = -1;
    let studentRowsEnd = -1;
    
    // أعمدة العلامات
    let notebookColumn = -1;
    let homeworkColumn = -1;
    let behaviorColumn = -1;
    let participationColumn = -1;
    let continuousColumn = -1;
    let testColumn = -1;
    let examColumn = -1;
    
    // إعدادات التقديرات
    let gradeSettings = [
        { min: 18, max: 20, comment: 'نتائج ممتازة ومرضية واصل' },
        { min: 16, max: 17.99, comment: 'نتائج جيدة و مرضية واصل' },
        { min: 14, max: 15.99, comment: 'واصل الاجتهاد و المثابرة' },
        { min: 12, max: 13.99, comment: 'نتائج مقبولة بإمكانك تحسينها' },
        { min: 10, max: 11.99, comment: 'بمقدورك تحقيق نتائج أفضل' },
        { min: 7, max: 9.99, comment: 'ينقصك الحرص و التركيز' },
        { min: 0, max: 6.99, comment: 'احذر التهاون' }
    ];

    // تحميل الإعدادات من localStorage إذا كانت موجودة
    function loadGradeSettings() {
        const savedSettings = localStorage.getItem('gradeSettings');
        if (savedSettings) {
            gradeSettings = JSON.parse(savedSettings);
        }
        updateGradeSettingsTable();
    }

    // حفظ الإعدادات في localStorage
    function saveGradeSettings() {
        const inputs = document.querySelectorAll('#gradeSettingsBody input');
        const newSettings = [];
        
        for (let i = 0; i < inputs.length; i += 2) {
            const minInput = inputs[i];
            const commentInput = inputs[i + 1];
            
            newSettings.push({
                min: parseFloat(minInput.value) || 0,
                max: i === 0 ? 20 : parseFloat(inputs[i - 2].value) - 0.01,
                comment: commentInput.value
            });
        }
        
        // ترتيب الإعدادات من الأعلى إلى الأقل
        newSettings.sort((a, b) => b.min - a.min);
        
        // تحديث الحد الأقصى لكل تقدير
        for (let i = 0; i < newSettings.length; i++) {
            if (i === 0) {
                newSettings[i].max = 20;
            } else {
                newSettings[i].max = newSettings[i - 1].min - 0.01;
            }
        }
        
        gradeSettings = newSettings;
        localStorage.setItem('gradeSettings', JSON.stringify(gradeSettings));
        alert('تم حفظ إعدادات التقديرات بنجاح!');
    }

    // استعادة الإعدادات الافتراضية
    function resetGradeSettings() {
        if (confirm('هل تريد استعادة الإعدادات الافتراضية؟ سيتم فقدان التغييرات الحالية.')) {
            gradeSettings = [
                { min: 18, max: 20, comment: 'نتائج ممتازة ومرضية واصل' },
                { min: 16, max: 17.99, comment: 'نتائج جيدة و مرضية واصل' },
                { min: 14, max: 15.99, comment: 'واصل الاجتهاد و المثابرة' },
                { min: 12, max: 13.99, comment: 'نتائج مقبولة بإمكانك تحسينها' },
                { min: 10, max: 11.99, comment: 'بمقدورك تحقيق نتائج أفضل' },
                { min: 7, max: 9.99, comment: 'ينقصك الحرص و التركيز' },
                { min: 0, max: 6.99, comment: 'احذر التهاون' }
            ];
            localStorage.removeItem('gradeSettings');
            updateGradeSettingsTable();
            alert('تم استعادة الإعدادات الافتراضية بنجاح!');
        }
    }

    // تحديث جدول إعدادات التقديرات
    function updateGradeSettingsTable() {
        const tbody = document.getElementById('gradeSettingsBody');
        tbody.innerHTML = '';
        
        // ترتيب الإعدادات من الأعلى إلى الأقل
        const sortedSettings = [...gradeSettings].sort((a, b) => b.min - a.min);
        
        sortedSettings.forEach((setting, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><input type="number" value="${setting.min}" min="0" max="20" step="0.5"></td>
                <td><input type="text" value="${setting.comment}" style="width: 100%;"></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // دالة الحصول على التقدير المعدلة
    function getGradeComment(average) {
        for (const setting of gradeSettings) {
            if (average >= setting.min && average <= setting.max) {
                return setting.comment;
            }
        }
        return 'غير محدد';
    }

    function showTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.note-tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.note-nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(tabName + '-tab').classList.add('active');
        event.target.classList.add('active');

        if (tabName === 'statistics') {
            updateStatistics();
        }
    }

    function handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            const workbook = XLSX.read(data, {type: 'binary'});
            
            // Populate sheet selector
            const sheetSelect = document.getElementById('sheetSelect');
            sheetSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
            
            workbook.SheetNames.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                sheetSelect.appendChild(option);
            });

            document.getElementById('sheetSelector').style.display = 'block';
            window.currentWorkbook = workbook;
        };
        reader.readAsBinaryString(file);
    }

    function loadSheet() {
        const sheetName = document.getElementById('sheetSelect').value;
        if (!sheetName || !window.currentWorkbook) return;

        currentSheetName = sheetName;
        const worksheet = window.currentWorkbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1, defval: ""});
        
        currentSheet = jsonData;
        allRows = jsonData;
        
        // البحث عن أعمدة اللقب والاسم وصفوف التلاميذ والعلامات
        findNameColumnsAndStudentRowsAndGrades(jsonData);
        
        displayPreview(jsonData);
        document.getElementById('previewSection').style.display = 'block';
    }

    // البحث عن أعمدة اللقب والاسم وصفوف التلاميذ والعلامات
    function findNameColumnsAndStudentRowsAndGrades(data) {
        lastNameColumn = -1;
        firstNameColumn = -1;
        studentRowsStart = -1;
        studentRowsEnd = -1;
        
        // إعادة تعيين أعمدة العلامات
        notebookColumn = -1;
        homeworkColumn = -1;
        behaviorColumn = -1;
        participationColumn = -1;
        continuousColumn = -1;
        testColumn = -1;
        examColumn = -1;
        
        // الكلمات المفتاحية للبحث عنها
        const lastNameKeywords = ['اللقب', 'لقب', 'اسم العائلة', 'Nom', 'Last Name', 'Surname'];
        const firstNameKeywords = ['الاسم', 'اسم', 'الاسم الشخصي', 'Prénom', 'First Name', 'Name'];
        
        // الكلمات المفتاحية للعلامات
        const notebookKeywords = ['الكراس', 'كراس', 'Cahier', 'Notebook'];
        const homeworkKeywords = ['الواجبات', 'واجبات', 'Devoirs', 'Homework'];
        const behaviorKeywords = ['السلوك', 'سلوك', 'Comportement', 'Behavior'];
        const participationKeywords = ['المشاركة', 'مشاركة', 'Participation'];
        const continuousKeywords = ['التقويم المستمر', 'تقويم مستمر','معدل تقويم النشاطات','التقويم', 'تقويم', 'Continu', 'Continuous'];
        const testKeywords = ['الفرض', 'فرض', 'Devoir', 'Test'];
        const examKeywords = ['الاختبار', 'اختبار','الإختبار','إختبار','الامتحان' , 'امتحان','Examen', 'Exam'];
        
        let headerRowIndex = -1;
        
        // البحث في الصفوف عن صف العناوين
        for (let rowIndex = 0; rowIndex < Math.min(20, data.length); rowIndex++) {
            const row = data[rowIndex];
            
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const cellValue = String(row[colIndex] || '').trim();
                
                // البحث عن عمود اللقب
                if (lastNameColumn === -1 && lastNameKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    lastNameColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                // البحث عن عمود الاسم
                if (firstNameColumn === -1 && firstNameKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    firstNameColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                // البحث عن أعمدة العلامات الجزئية
                if (notebookColumn === -1 && notebookKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    notebookColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                if (homeworkColumn === -1 && homeworkKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    homeworkColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                if (behaviorColumn === -1 && behaviorKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    behaviorColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                if (participationColumn === -1 && participationKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    participationColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                // البحث عن أعمدة العلامات الإجمالية
                if (continuousColumn === -1 && continuousKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    continuousColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                if (testColumn === -1 && testKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    testColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
                
                if (examColumn === -1 && examKeywords.some(keyword => 
                    cellValue.includes(keyword))) {
                    examColumn = colIndex;
                    headerRowIndex = rowIndex;
                }
            }
            
            // إذا وجدنا صف العناوين، نتوقف عن البحث
            if (headerRowIndex !== -1) {
                break;
            }
        }
        
        // إذا وجدنا صف العناوين، نحدد صفوف التلاميذ
        if (headerRowIndex !== -1) {
            studentRowsStart = headerRowIndex + 1;
            studentRowsEnd = data.length - 1;
            
            // البحث عن نهاية قائمة التلاميذ (أول صف فارغ بعد بداية التلاميذ)
            for (let i = studentRowsStart; i < data.length; i++) {
                const row = data[i];
                const hasData = row && (
                    (lastNameColumn !== -1 && row[lastNameColumn] && String(row[lastNameColumn]).trim()) ||
                    (firstNameColumn !== -1 && row[firstNameColumn] && String(row[firstNameColumn]).trim())
                );
                
                if (!hasData) {
                    studentRowsEnd = i - 1;
                    break;
                }
            }
        }
        
        // عرض معلومات الأعمدة وصفوف التلاميذ والعلامات المكتشفة
        displayColumnAndStudentAndGradesInfo();
    }

    // عرض معلومات الأعمدة وصفوف التلاميذ والعلامات المكتشفة
    function displayColumnAndStudentAndGradesInfo() {
        const columnInfo = document.getElementById('columnInfo');
        const studentRowsInfo = document.getElementById('studentRowsInfo');
        
        let infoHTML = '<strong>تم التعرف على الأعمدة التالية:</strong><br>';
        
        if (lastNameColumn !== -1) {
            infoHTML += `- عمود اللقب: العمود ${lastNameColumn + 1} (${getColumnName(lastNameColumn)})<br>`;
        } else {
            infoHTML += '- لم يتم العثور على عمود اللقب<br>';
        }
        
        if (firstNameColumn !== -1) {
            infoHTML += `- عمود الاسم: العمود ${firstNameColumn + 1} (${getColumnName(firstNameColumn)})<br>`;
        } else {
            infoHTML += '- لم يتم العثور على عمود الاسم<br>';
        }
        
        // عرض معلومات العلامات الجزئية
        if (notebookColumn !== -1 || homeworkColumn !== -1 || behaviorColumn !== -1 || participationColumn !== -1) {
            infoHTML += '<strong>العلامات الجزئية:</strong><br>';
            if (notebookColumn !== -1) infoHTML += `- الكراس: العمود ${notebookColumn + 1}<br>`;
            if (homeworkColumn !== -1) infoHTML += `- الواجبات: العمود ${homeworkColumn + 1}<br>`;
            if (behaviorColumn !== -1) infoHTML += `- السلوك: العمود ${behaviorColumn + 1}<br>`;
            if (participationColumn !== -1) infoHTML += `- المشاركة: العمود ${participationColumn + 1}<br>`;
        }
        
        // عرض معلومات العلامات الإجمالية
        if (continuousColumn !== -1 || testColumn !== -1 || examColumn !== -1) {
            infoHTML += '<strong>العلامات الإجمالية:</strong><br>';
            if (continuousColumn !== -1) infoHTML += `- التقويم المستمر: العمود ${continuousColumn + 1}<br>`;
            if (testColumn !== -1) infoHTML += `- الفرض: العمود ${testColumn + 1}<br>`;
            if (examColumn !== -1) infoHTML += `- الاختبار: العمود ${examColumn + 1}<br>`;
        }
        
        columnInfo.innerHTML = infoHTML;
        columnInfo.style.display = 'block';
        
        if (studentRowsStart !== -1 && studentRowsEnd !== -1) {
            const studentCount = studentRowsEnd - studentRowsStart + 1;
            studentRowsInfo.innerHTML = `
                <strong>تم التعرف على صفوف التلاميذ:</strong><br>
                - بداية التلاميذ: الصف ${studentRowsStart + 1}<br>
                - نهاية التلاميذ: الصف ${studentRowsEnd + 1}<br>
                - عدد التلاميذ: ${studentCount} تلميذ
            `;
            studentRowsInfo.style.display = 'block';
        } else {
            studentRowsInfo.innerHTML = '<strong>لم يتم التعرف على صفوف التلاميذ تلقائياً.</strong>';
            studentRowsInfo.style.display = 'block';
        }
    }

    // الحصول على اسم العمود (A, B, C, ...)
    function getColumnName(columnIndex) {
        let result = '';
        let index = columnIndex;
        
        do {
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26) - 1;
        } while (index >= 0);
        
        return result;
    }

    function displayPreview(data) {
        const table = document.getElementById('previewTable');
        table.innerHTML = '';

        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // إنشاء رأس الجدول مع عرض أسماء الأعمدة
        let headerHTML = '<th>الصف</th>';
        for (let i = 0; i < Math.min(8, data[0] ? data[0].length : 8); i++) {
            let columnName = `العمود ${i + 1}`;
            if (i === lastNameColumn) columnName += ' (اللقب)';
            if (i === firstNameColumn) columnName += ' (الاسم)';
            if (i === continuousColumn) columnName += ' (التقويم)';
            if (i === testColumn) columnName += ' (الفرض)';
            if (i === examColumn) columnName += ' (الاختبار)';
            headerHTML += `<th>${columnName}</th>`;
        }
        headerRow.innerHTML = headerHTML;
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        
        // عرض كافة الصفوف
        data.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.classList.add('selectable-row');
            tr.dataset.rowIndex = index;
            
            // تحديد إذا كان هذا الصف ضمن صفوف التلاميذ
            const isStudentRow = (index >= studentRowsStart && index <= studentRowsEnd);
            
            // Check if this row likely contains student data
            const hasStudentData = isStudentRow && 
                                  (lastNameColumn !== -1 && firstNameColumn !== -1 && 
                                   row[lastNameColumn] && row[firstNameColumn] && 
                                   String(row[lastNameColumn]).trim() && String(row[firstNameColumn]).trim());
            
            if (hasStudentData) {
                tr.style.background = '#f0f8ff';
            } else if (isStudentRow) {
                tr.style.background = '#fff3cd';
            }
            
            // إنشاء محتوى الصف
            let rowHTML = `<td style="font-weight: bold; color: #007bff;">${index + 1}</td>`;
            for (let i = 0; i < Math.min(8, row.length); i++) {
                let cellValue = row[i] || '';
                let cellStyle = '';
                
                if (i === lastNameColumn || i === firstNameColumn) cellStyle = 'background: #e8f5e8;';
                if (i === continuousColumn || i === testColumn || i === examColumn) cellStyle = 'background: #e3f2fd;';
                
                rowHTML += `<td style="${cellStyle}">${cellValue}</td>`;
            }
            
            tr.innerHTML = rowHTML;
            
            // Add mouse events for selection
            tr.addEventListener('mousedown', startSelection);
            tr.addEventListener('mouseenter', continueSelection);
            tr.addEventListener('mouseup', endSelection);
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        // تحديث عدد الصفوف الكلي
        document.getElementById('totalRowsCount').textContent = `إجمالي الصفوف: ${data.length}`;

        // Clear previous selection
        selectedRows.clear();
        updateSelectionCount();
    }

    let startRowIndex = -1;
    let dragSelecting = false;

    function startSelection(event) {
        event.preventDefault();
        const row = event.currentTarget;
        const rowIndex = parseInt(row.dataset.rowIndex);
        
        if (event.ctrlKey) {
            // Toggle selection for Ctrl+Click
            if (selectedRows.has(rowIndex)) {
                selectedRows.delete(rowIndex);
                row.classList.remove('selected');
            } else {
                selectedRows.add(rowIndex);
                row.classList.add('selected');
            }
        } else {
            // Start new selection or range selection
            if (!event.shiftKey) {
                // Clear previous selection if not using Shift
                clearSelection();
            }
            
            startRowIndex = rowIndex;
            selectedRows.add(rowIndex);
            row.classList.add('selected');
            dragSelecting = true;
        }
        updateSelectionCount();
    }

    function continueSelection(event) {
        if (!dragSelecting || startRowIndex === -1) return;
        
        const row = event.currentTarget;
        const rowIndex = parseInt(row.dataset.rowIndex);
        
        // Clear previous range selection
        document.querySelectorAll('.selectable-row').forEach(r => {
            const rIndex = parseInt(r.dataset.rowIndex);
            if (selectedRows.has(rIndex) && rIndex !== startRowIndex) {
                selectedRows.delete(rIndex);
                r.classList.remove('selected');
            }
        });
        
        // Select range from startRowIndex to current row
        const minIndex = Math.min(startRowIndex, rowIndex);
        const maxIndex = Math.max(startRowIndex, rowIndex);
        
        selectedRows.clear();
        selectedRows.add(startRowIndex); // Keep the start row
        
        for (let i = minIndex; i <= maxIndex; i++) {
            selectedRows.add(i);
            const rowElement = document.querySelector(`[data-row-index="${i}"]`);
            if (rowElement) {
                rowElement.classList.add('selected');
            }
        }
        updateSelectionCount();
    }

    function endSelection(event) {
        dragSelecting = false;
        updateSelectionCount();
    }

    function clearSelection() {
        document.querySelectorAll('.selectable-row').forEach(r => r.classList.remove('selected'));
        selectedRows.clear();
        startRowIndex = -1;
        dragSelecting = false;
        updateSelectionCount();
    }

    // تحديد جميع الصفوف
    function selectAllRows() {
        document.querySelectorAll('.selectable-row').forEach(row => {
            const rowIndex = parseInt(row.dataset.rowIndex);
            selectedRows.add(rowIndex);
            row.classList.add('selected');
        });
        updateSelectionCount();
    }

    // إلغاء تحديد جميع الصفوف
    function deselectAllRows() {
        clearSelection();
    }

    // عكس التحديد
    function invertSelection() {
        document.querySelectorAll('.selectable-row').forEach(row => {
            const rowIndex = parseInt(row.dataset.rowIndex);
            if (selectedRows.has(rowIndex)) {
                selectedRows.delete(rowIndex);
                row.classList.remove('selected');
            } else {
                selectedRows.add(rowIndex);
                row.classList.add('selected');
            }
        });
        updateSelectionCount();
    }

    function selectStudentRows() {
        clearSelection();
        
        if (studentRowsStart === -1 || studentRowsEnd === -1) {
            alert('لم يتم التعرف على صفوف التلاميذ. يرجى التحديد يدوياً.');
            return;
        }
        
        // Auto-select student rows only
        document.querySelectorAll('.selectable-row').forEach(row => {
            const rowIndex = parseInt(row.dataset.rowIndex);
            
            if (rowIndex >= studentRowsStart && rowIndex <= studentRowsEnd) {
                selectedRows.add(rowIndex);
                row.classList.add('selected');
            }
        });
        
        updateSelectionCount();
        
        if (selectedRows.size > 0) {
            alert(`تم تحديد ${selectedRows.size} صف تلقائياً يحتوي على بيانات التلاميذ`);
        } else {
            alert('لم يتم العثور على صفوف تحتوي على بيانات التلاميذ. يرجى التحديد يدوياً.');
        }
    }

    function updateSelectionCount() {
        const count = selectedRows.size;
        const countElement = document.getElementById('selectionCount');
        if (count === 0) {
            countElement.textContent = 'لم يتم التحديد';
            countElement.style.color = '#6c757d';
        } else {
            countElement.textContent = `تم تحديد ${count} صف`;
            countElement.style.color = '#007bff';
        }
    }

    function confirmSelection() {
        if (selectedRows.size === 0) {
            alert('يرجى تحديد الصفوف التي تحتوي على أسماء التلاميذ');
            return;
        }

        studentsData = [];
        const validStudents = [];
        
        selectedRows.forEach(rowIndex => {
            const rowData = currentSheet[rowIndex];
            if (rowData && 
                (lastNameColumn === -1 || rowData[lastNameColumn]) && 
                (firstNameColumn === -1 || rowData[firstNameColumn])) {
                
                const lastName = lastNameColumn !== -1 ? String(rowData[lastNameColumn]).trim() : '';
                const firstName = firstNameColumn !== -1 ? String(rowData[firstNameColumn]).trim() : '';
                
                if (lastName && firstName) {
                    // استخراج العلامات من الأعمدة المكتشفة
                    let notebook = parseFloat(rowData[notebookColumn]) || 0;
                    let homework = parseFloat(rowData[homeworkColumn]) || 0;
                    let behavior = parseFloat(rowData[behaviorColumn]) || 0;
                    let participation = parseFloat(rowData[participationColumn]) || 0;
                    let continuous = parseFloat(rowData[continuousColumn]) || 0;
                    let test = parseFloat(rowData[testColumn]) || 0;
                    let exam = parseFloat(rowData[examColumn]) || 0;
                    
                    // إذا كان هناك علامات إجمالية ولكن لا توجد علامات جزئية، نستخدم العلامات الإجمالية
                    if (continuous > 0 && notebook === 0 && homework === 0 && behavior === 0 && participation === 0) {
                        // توزيع علامة التقويم المستمر على العلامات الجزئية بالتساوي
                        notebook = homework = behavior = participation = continuous;
                    }
                    
                    validStudents.push({
                        name: `${lastName} ${firstName}`,
                        lastName: lastName,
                        firstName: firstName,
                        notebook: notebook,
                        homework: homework,
                        behavior: behavior,
                        participation: participation,
                        test: test,
                        exam: exam,
                        continuous: 0,
                        average: 0,
                        comment: ''
                    });
                }
            }
        });

        if (validStudents.length === 0) {
            alert('لم يتم العثور على بيانات صالحة للتلاميذ.');
            return;
        }

        studentsData = validStudents;
        
        // حساب المعدلات للتلاميذ المستوردين
        studentsData.forEach((student, index) => {
            calculateAverage(index);
        });
        
        updateGradesTable();
        
        const message = `تم تحديد ${studentsData.length} تلميذ بنجاح!\n\nمن أصل ${selectedRows.size} صف محدد، تم قبول ${studentsData.length} تلميذ يحتوون على بيانات صالحة.`;
        alert(message);
        showTab('grades');
    }

    function updateGradesTable() {
        const tbody = document.getElementById('gradesTableBody');
        tbody.innerHTML = '';

        studentsData.forEach((student, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${student.name}</td>
                <td><input type="number" class="grade-input" value="${student.notebook}" min="0" max="20" onchange="updateStudentGrade(${index}, 'notebook', this.value)"></td>
                <td><input type="number" class="grade-input" value="${student.homework}" min="0" max="20" onchange="updateStudentGrade(${index}, 'homework', this.value)"></td>
                <td><input type="number" class="grade-input" value="${student.behavior}" min="0" max="20" onchange="updateStudentGrade(${index}, 'behavior', this.value)"></td>
                <td><input type="number" class="grade-input" value="${student.participation}" min="0" max="20" onchange="updateStudentGrade(${index}, 'participation', this.value)"></td>
                <td class="average-display">${student.continuous.toFixed(2)}</td>
                <td><input type="number" class="grade-input" value="${student.test}" min="0" max="20" onchange="updateStudentGrade(${index}, 'test', this.value)"></td>
                <td><input type="number" class="grade-input" value="${student.exam}" min="0" max="20" onchange="updateStudentGrade(${index}, 'exam', this.value)"></td>
                <td class="average-display">${student.average.toFixed(2)}</td>
                <td class="grade-comment">${student.comment}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateStudentGrade(index, field, value) {
        const numValue = parseFloat(value) || 0;
        studentsData[index][field] = Math.max(0, Math.min(20, numValue));
        calculateAverage(index);
        updateGradesTable();
    }

    function calculateAverage(index) {
        const student = studentsData[index];
        
        // Calculate continuous assessment average
        student.continuous = (student.notebook + student.homework + student.behavior + student.participation) / 4;
        
        // Calculate final average: (continuous + test + exam*3) / 5
        student.average = (student.continuous + student.test + (student.exam * 3)) / 5;
        
        // Add grade comment using the custom settings
        student.comment = getGradeComment(student.average);
    }

    function updateGradeInputs() {
        const gradeType = document.getElementById('gradeType').value;
        const continuousDiv = document.getElementById('continuousGrades');
        const singleDiv = document.getElementById('singleGrade');
        const label = document.getElementById('singleGradeLabel');

        if (gradeType === 'continuous') {
            continuousDiv.style.display = 'grid';
            singleDiv.style.display = 'none';
        } else {
            continuousDiv.style.display = 'none';
            singleDiv.style.display = 'grid';
            label.textContent = gradeType === 'test' ? 'الفرض' : 'الإختبار';
        }
    }

    function applyGradeToAll() {
        const gradeType = document.getElementById('gradeType').value;
        
        if (gradeType === 'continuous') {
            const notebook = parseFloat(document.getElementById('notebook').value) || 0;
            const homework = parseFloat(document.getElementById('homework').value) || 0;
            const behavior = parseFloat(document.getElementById('behavior').value) || 0;
            const participation = parseFloat(document.getElementById('participation').value) || 0;
            
            studentsData.forEach((student, index) => {
                student.notebook = notebook;
                student.homework = homework;
                student.behavior = behavior;
                student.participation = participation;
                calculateAverage(index);
            });
        } else {
            const gradeValue = parseFloat(document.getElementById('singleGradeInput').value) || 0;
            const field = gradeType === 'test' ? 'test' : 'exam';
            
            studentsData.forEach((student, index) => {
                student[field] = gradeValue;
                calculateAverage(index);
            });
        }
        
        updateGradesTable();
    }

    function searchStudents() {
        const searchTerm = document.getElementById('searchBox').value.toLowerCase();
        const rows = document.querySelectorAll('#gradesTableBody tr');
        
        rows.forEach(row => {
            const name = row.cells[0].textContent.toLowerCase();
            row.style.display = name.includes(searchTerm) ? '' : 'none';
        });
    }

    function sortStudents(criteria) {
        if (criteria === 'name') {
            studentsData.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        } else if (criteria === 'average') {
            studentsData.sort((a, b) => b.average - a.average);
        }
        updateGradesTable();
    }

    function resetGrades() {
        if (confirm('هل أنت متأكد من إعادة تعيين جميع النقاط؟')) {
            studentsData.forEach((student, index) => {
                student.notebook = 0;
                student.homework = 0;
                student.behavior = 0;
                student.participation = 0;
                student.test = 0;
                student.exam = 0;
                calculateAverage(index);
            });
            updateGradesTable();
        }
    }

    function updateStatistics() {
        if (studentsData.length === 0) return;

        const totalStudents = studentsData.length;
        const averages = studentsData.map(s => s.average);
        const overallAverage = averages.reduce((sum, avg) => sum + avg, 0) / totalStudents;
        const highestGrade = Math.max(...averages);
        const lowestGrade = Math.min(...averages);
        const passedStudents = studentsData.filter(s => s.average >= 10).length;
        const failedStudents = totalStudents - passedStudents;

        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('overallAverage').textContent = overallAverage.toFixed(2);
        document.getElementById('highestGrade').textContent = highestGrade.toFixed(2);
        document.getElementById('lowestGrade').textContent = lowestGrade.toFixed(2);
        document.getElementById('passedStudents').textContent = passedStudents;
        document.getElementById('failedStudents').textContent = failedStudents;

        // Grade distribution
        const distribution = {};
        studentsData.forEach(student => {
            const comment = student.comment;
            distribution[comment] = (distribution[comment] || 0) + 1;
        });

        let distributionHTML = '';
        Object.entries(distribution).forEach(([grade, count]) => {
            const percentage = ((count / totalStudents) * 100).toFixed(1);
            distributionHTML += `
                <div style="display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <span>${grade}</span>
                    <span>${count} تلميذ (${percentage}%)</span>
                </div>
            `;
        });
        document.getElementById('gradeDistribution').innerHTML = distributionHTML;
    }

    function exportToExcel() {
        if (studentsData.length === 0) {
            alert('لا توجد بيانات للتصدير');
            return;
        }

        // Prepare data for export
        const exportData = [
            ['اللقب والاسم', 'الكراس', 'الواجبات', 'السلوك', 'المشاركة', 'التقويم المستمر', 'الفرض', 'الاختبار', 'المعدل', 'التقدير']
        ];

        studentsData.forEach(student => {
            exportData.push([
                student.name,
                student.notebook,
                student.homework,
                student.behavior,
                student.participation,
                student.continuous.toFixed(2),
                student.test,
                student.exam,
                student.average.toFixed(2),
                student.comment
            ]);
        });

        // Add statistics
        exportData.push([]);
        exportData.push(['الإحصائيات']);
        exportData.push(['عدد التلاميذ', studentsData.length]);
        exportData.push(['المعدل العام', (studentsData.reduce((sum, s) => sum + s.average, 0) / studentsData.length).toFixed(2)]);
        exportData.push(['أعلى معدل', Math.max(...studentsData.map(s => s.average)).toFixed(2)]);
        exportData.push(['أقل معدل', Math.min(...studentsData.map(s => s.average)).toFixed(2)]);
        exportData.push(['الناجحون', studentsData.filter(s => s.average >= 10).length]);
        exportData.push(['الراسبون', studentsData.filter(s => s.average < 10).length]);

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        
        // Add some styling
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = {c: C, r: R};
                const cell_ref = XLSX.utils.encode_cell(cell_address);
                if (!ws[cell_ref]) continue;
                
                // Header row styling
                if (R === 0) {
                    ws[cell_ref].s = {
                        font: { bold: true },
                        fill: { fgColor: { rgb: "CCCCCC" } }
                    };
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, "نقاط التلاميذ");
        
        // Generate filename with current date and sheet name
        const now = new Date();
        const sheetName = currentSheetName || 'غير محدد';
        const filename = `نقاط_التلاميذ_${sheetName}_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}.xlsx`;
        
        XLSX.writeFile(wb, filename);
    }

    // Initialize the application
    function init() {
        // Initialize grade inputs visibility
        updateGradeInputs();
        
        // Load grade settings when page loads
        loadGradeSettings();
        
        // Add event listeners
        document.getElementById('fileInput').addEventListener('change', handleFile);
        document.getElementById('sheetSelect').addEventListener('change', loadSheet);
        document.getElementById('gradeType').addEventListener('change', updateGradeInputs);
        document.getElementById('applyGradeToAll').addEventListener('click', applyGradeToAll);
        document.getElementById('searchBox').addEventListener('keyup', searchStudents);
        document.getElementById('exportBtn').addEventListener('click', exportToExcel);
        document.getElementById('resetGradesBtn').addEventListener('click', resetGrades);
        document.getElementById('saveSettingsBtn').addEventListener('click', saveGradeSettings);
        document.getElementById('resetSettingsBtn').addEventListener('click', resetGradeSettings);
        
        // Add selection buttons event listeners
        document.getElementById('selectAllBtn').addEventListener('click', selectAllRows);
        document.getElementById('deselectAllBtn').addEventListener('click', deselectAllRows);
        document.getElementById('selectStudentsBtn').addEventListener('click', selectStudentRows);
        document.getElementById('invertSelectionBtn').addEventListener('click', invertSelection);
        document.getElementById('confirmSelectionBtn').addEventListener('click', confirmSelection);
        document.getElementById('clearSelectionBtn').addEventListener('click', clearSelection);
    }

    // Make functions available globally for HTML event handlers
    window.showTab = showTab;
    window.handleFile = handleFile;
    window.loadSheet = loadSheet;
    window.startSelection = startSelection;
    window.continueSelection = continueSelection;
    window.endSelection = endSelection;
    window.selectAllRows = selectAllRows;
    window.deselectAllRows = deselectAllRows;
    window.selectStudentRows = selectStudentRows;
    window.invertSelection = invertSelection;
    window.confirmSelection = confirmSelection;
    window.clearSelection = clearSelection;
    window.updateStudentGrade = updateStudentGrade;
    window.updateGradeInputs = updateGradeInputs;
    window.applyGradeToAll = applyGradeToAll;
    window.searchStudents = searchStudents;
    window.sortStudents = sortStudents;
    window.resetGrades = resetGrades;
    window.updateStatistics = updateStatistics;
    window.exportToExcel = exportToExcel;
    window.saveGradeSettings = saveGradeSettings;
    window.resetGradeSettings = resetGradeSettings;

    // Initialize when DOM is loaded
    init();
});
