const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileName = document.getElementById('fileName');
const form = document.getElementById('convertForm');
const statusDiv = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');

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
        fileInput.files = e.dataTransfer.files;
        updateFileName();
    }
});

fileInput.addEventListener('change', updateFileName);

function updateFileName() {
    if (fileInput.files.length) {
        fileName.textContent = fileInput.files[0].name;
    }
}

// Отправка формы
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!fileInput.files.length) {
        alert('Выберите файл!');
        return;
    }

    const formData = new FormData(form);
    submitBtn.disabled = true;
    submitBtn.textContent = 'Конвертация...';
    statusDiv.textContent = '';

    try {
        const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка сервера');
        }

        // Скачивание файла
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Пытаемся угадать имя файла
        a.download = `converted-${Date.now()}.${formData.get('format')}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        statusDiv.textContent = 'Готово!';
        statusDiv.style.color = 'green';
    } catch (err) {
        console.error(err);
        statusDiv.textContent = 'Ошибка: ' + err.message;
        statusDiv.style.color = 'red';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Конвертировать';
    }
});
