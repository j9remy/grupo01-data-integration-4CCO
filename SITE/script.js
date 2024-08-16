// Certifique-se de que o código é carregado apenas uma vez e não há declarações duplicadas
const uploadBtn = document.getElementById('uploadBtn');
const imageBox = document.getElementById('imageBox');

// Adiciona o listener ao botão de upload
uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;  // Permite selecionar múltiplos arquivos
    input.onchange = handleFileSelect;
    input.click();
});

// Configura o arrastar e soltar
imageBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageBox.classList.add('dragover');
});

imageBox.addEventListener('dragleave', () => {
    imageBox.classList.remove('dragover');
});

imageBox.addEventListener('drop', (e) => {
    e.preventDefault();
    imageBox.classList.remove('dragover');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

function handleFiles(files) {
    const formData = new FormData();
    for (const file of files) {
        formData.append('images', file);
    }

    fetch('http://44.210.55.160:5000/process_images', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.results && Array.isArray(data.results)) {
            console.log(data);
            displayResults(data);
        } else {
            console.error('Invalid data format:', data);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayResults(data) {
    imageBox.innerHTML = '';  // Limpa a caixa de imagens

    data.results.forEach((result) => {
        const img = document.createElement('img');
        img.src = result.image; // Verifique se 'result.image' é uma URL ou base64
        img.classList.add('imagem');
        imageBox.appendChild(img);

        const progressContainer = document.createElement('div');
        progressContainer.classList.add('progress-container');

        const realProgress = createCircularProgress(result.real_percentage, 'Real');
        const fakeProgress = createCircularProgress(result.fake_percentage, 'Fake');

        progressContainer.appendChild(realProgress);
        progressContainer.appendChild(fakeProgress);

        imageBox.appendChild(progressContainer);
    });
}

function createCircularProgress(percentage, label) {
    const container = document.createElement('div');
    container.classList.add('circular-progress');

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '100');
    svg.classList.add('circular-chart');

    const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circleBg.setAttribute('cx', '50');
    circleBg.setAttribute('cy', '50');
    circleBg.setAttribute('r', '45');
    circleBg.classList.add('circle-bg');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', '45');
    circle.classList.add('circle');
    circle.style.strokeDasharray = `${percentage} 100`;

    svg.appendChild(circleBg);
    svg.appendChild(circle);

    const text = document.createElement('span');
    text.classList.add('progress-text');
    text.textContent = `${percentage.toFixed(2)}% ${label}`;

    container.appendChild(svg);
    container.appendChild(text);

    return container;
}
