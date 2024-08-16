const uploadBtn = document.getElementById('uploadBtn');
const imageBox = document.getElementById('imageBox');

uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;  // Permite selecionar múltiplos arquivos
    input.onchange = handleFileSelect;
    input.click();
});

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
        displayResults(data.results);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayResults(results) {
    imageBox.innerHTML = '';  // Limpa a caixa de imagens

    results.forEach((result, index) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(result.image); // Certifique-se de que 'result.image' está disponível
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

    const circle = document.createElement('svg');
    circle.classList.add('circular-chart');
    circle.setAttribute('viewBox', '0 0 100 100');
    circle.setAttribute('width', '100');
    circle.setAttribute('height', '100');

    const circleBg = document.createElement('circle');
    circleBg.classList.add('circle-bg');
    circleBg.setAttribute('cx', '50');
    circleBg.setAttribute('cy', '50');
    circleBg.setAttribute('r', '45');
    circleBg.setAttribute('stroke-width', '5');
    
    const circleProgress = document.createElement('circle');
    circleProgress.classList.add('circle');
    circleProgress.setAttribute('cx', '50');
    circleProgress.setAttribute('cy', '50');
    circleProgress.setAttribute('r', '45');
    circleProgress.setAttribute('stroke-width', '5');
    circleProgress.style.strokeDasharray = `${percentage} 100`;
    circleProgress.style.strokeDashoffset = '25'; // Ajuste o deslocamento se necessário

    const text = document.createElement('text');
    text.classList.add('percentage');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `${percentage.toFixed(2)}% ${label}`;

    circle.appendChild(circleBg);
    circle.appendChild(circleProgress);
    circle.appendChild(text);

    container.appendChild(circle);
    return container;
}
