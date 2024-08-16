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
        displayResults(data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayResults(data) {
    imageBox.innerHTML = '';  // Limpa a caixa de imagens

    if (data.results) {
        data.results.forEach((result, index) => {
            // Criação da imagem a partir da string base64
            const img = document.createElement('img');
            img.src = `data:image/png;base64,${result.image}`;
            img.classList.add('imagem');
            imageBox.appendChild(img);

            // Criação das barras de progresso
            const progressContainer = document.createElement('div');
            progressContainer.classList.add('progress-container');

            const realProgress = createCircularProgress(result.real_percentage, 'Real');
            const fakeProgress = createCircularProgress(result.fake_percentage, 'Fake');

            progressContainer.appendChild(realProgress);
            progressContainer.appendChild(fakeProgress);

            imageBox.appendChild(progressContainer);
        });
    } else {
        console.error('Invalid data format:', data);
    }
}

function createCircularProgress(percentage, label) {
    const container = document.createElement('div');
    container.classList.add('circular-chart');

    // Criar o fundo da barra de progresso
    const circleBg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    circleBg.setAttribute('viewBox', '0 0 100 100');
    circleBg.classList.add('circle-bg');

    const circleBgPath = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleBgPath.setAttribute('cx', '50');
    circleBgPath.setAttribute('cy', '50');
    circleBgPath.setAttribute('r', '45');
    circleBgPath.setAttribute('stroke', '#f0f0f0');
    circleBgPath.setAttribute('stroke-width', '8');
    circleBgPath.setAttribute('fill', 'none');
    circleBg.appendChild(circleBgPath);
    container.appendChild(circleBg);

    // Criar a barra de progresso
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    circle.setAttribute('viewBox', '0 0 100 100');
    circle.classList.add('circle');

    const circlePath = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circlePath.setAttribute('cx', '50');
    circlePath.setAttribute('cy', '50');
    circlePath.setAttribute('r', '45');
    circlePath.setAttribute('stroke', '#4caf50');  // Cor da progressão
    circlePath.setAttribute('stroke-width', '8');
    circlePath.setAttribute('stroke-linecap', 'round');
    circlePath.setAttribute('fill', 'none');
    circlePath.setAttribute('stroke-dasharray', `${percentage} 100`);
    circle.appendChild(circlePath);
    container.appendChild(circle);

    // Adicionar o texto centralizado
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', '50');
    text.setAttribute('y', '50');
    text.setAttribute('class', 'percentage');
    text.setAttribute('dy', '.3em');  // Ajustar a posição vertical do texto
    text.textContent = `${percentage.toFixed(2)}% ${label}`;
    container.appendChild(text);

    return container;
}

