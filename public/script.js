const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileListDiv = document.getElementById('fileList');
const form = document.getElementById('convertForm');
const statusDiv = document.getElementById('status');
const resultsDiv = document.getElementById('results');
const submitBtn = document.getElementById('submitBtn');

let selectedFiles = [];

// Prevent default drag behaviors for entire window
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, preventDefaults, false)
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Обработка Drag & Drop
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
    }
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFiles(fileInput.files);
    }
});

function handleFiles(files) {
    selectedFiles = Array.from(files);
    renderFileList();
}

function renderFileList() {
    fileListDiv.innerHTML = '';

    if (selectedFiles.length === 0) {
        // fileListDiv.innerHTML = '<p class="placeholder">Нет выбранных файлов</p>';
        // Better: Keep empty to show the placeholder text from HTML if distinct, 
        // or just ensure dropZone looks empty.
        // Actually, the HTML doesn't have a separate placeholder element that disappears, 
        // the text "Drag files here" is static. 
        // So we just clear the list div.
        return;
    }

    const p = document.createElement('p');
    p.textContent = `Выбрано файлов: ${selectedFiles.length}`;
    p.style.fontWeight = 'bold';
    p.style.marginTop = '10px';
    fileListDiv.appendChild(p);
}

// Отправка формы
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
        alert('Выберите файлы!');
        return;
    }

    const formData = new FormData();
    // Format
    formData.append('format', document.getElementById('format').value);

    // Append all files with same name 'files'
    selectedFiles.forEach(file => {
        formData.append('files', file);
    });

    submitBtn.disabled = true;
    submitBtn.textContent = 'Конвертация...';
    statusDiv.textContent = '';
    resultsDiv.innerHTML = '';

    try {
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сервера');
        }

        const data = await response.json();

        statusDiv.textContent = 'Готово! Скачайте файлы ниже:';
        statusDiv.style.color = 'green';

        renderResults(data);

    } catch (err) {
        console.error(err);
        statusDiv.textContent = 'Ошибка: ' + err.message;
        statusDiv.style.color = 'red';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Конвертировать';
    }
});

function renderResults(data) {
    resultsDiv.innerHTML = '';

    // 2. ZIP Button (Show FIRST if multiple)
    if (data.zip) {
        const zipBtn = document.createElement('a');
        zipBtn.href = data.zip;
        zipBtn.textContent = '📥 Скачать всё архивом (.zip)';
        zipBtn.className = 'btn-download main-zip';
        resultsDiv.appendChild(zipBtn);
    }

    // 1. Individual Files
    if (data.files && data.files.length > 0) {
        const container = document.createElement('div');

        // If ZIP exists, wrap list in accordion
        if (data.zip) {
            const details = document.createElement('details');
            const summary = document.createElement('summary');
            summary.textContent = `Показать файлы по отдельности (${data.files.length})`;
            summary.style.cursor = 'pointer';
            summary.style.marginTop = '15px';
            summary.style.color = '#555';

            details.appendChild(summary);
            details.appendChild(createFileList(data.files));
            container.appendChild(details);
        } else {
            // Single file or error - show directly
            container.appendChild(createFileList(data.files));
        }

        resultsDiv.appendChild(container);
    }
}

function createFileList(files) {
    const list = document.createElement('div');
    list.className = 'download-list';

    files.forEach(f => {
        const row = document.createElement('div');
        row.className = 'download-item';

        const name = document.createElement('span');
        name.textContent = f.originalName + (f.error ? ' (Ошибка)' : ' -> ' + f.filename);

        row.appendChild(name);

        if (!f.error && f.url) {
            const btn = document.createElement('a');
            btn.href = f.url;
            btn.textContent = 'Скачать';
            btn.className = 'btn-download mini';
            btn.target = '_blank';
            row.appendChild(btn);
        }

        list.appendChild(row);
    });
    return list;
}
