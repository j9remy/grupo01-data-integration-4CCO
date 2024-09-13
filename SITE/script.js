const uploadBtn = document.getElementById('uploadBtn');
const imageBox = document.getElementById('imageBox');
const resultBox = document.getElementById('resultBox');

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
    resultBox.innerHTML = '';  // Limpa a caixa de imagens
    resultBox.classList.add('result-grid')

    if (data.results) {
        data.results.forEach((result, index) => {
            
            const resultItem = document.createElement('div');  // Contêiner para cada imagem + progresso
            resultItem.classList.add('result-item');

            const imageContainer = document.createElement('div');
            imageContainer.classList.add('imagem-result-container');

            if (result.contains_face){
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${result.image}`;
                img.classList.add('imagem-result');
                resultItem.appendChild(img);
    
                // Criação das barras de progresso
                const progressContainer = document.createElement('div');
                progressContainer.classList.add('progress-container');
    
                const realProgress = createCircularProgress(result.real_percentage, 'Real');
                const fakeProgress = createCircularProgress(result.fake_percentage, 'Fake');
    
                progressContainer.appendChild(realProgress);
                progressContainer.appendChild(fakeProgress);
    
                resultItem.appendChild(progressContainer);
            } else {
                const img = document.createElement('img');
                img.src = `data:image/png;base64,${result.image}`;
                img.classList.add('imagem-result');
                resultItem.appendChild(img);

                const notFaceContainer = document.createElement('div');

                notFaceContainer.textContent = "Nenhuma face foi detectada na imagem.";
    
                resultItem.appendChild(notFaceContainer);
            }
            resultBox.appendChild(resultItem);
        });
    } else {
        console.error('Invalid data format:', data);
    }
}

function createCircularProgress(percentage, label) {
    const container = document.createElement('div');
    container.classList.add('circular-chart');

    // Criar o SVG e o círculo de fundo
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('viewBox', '0 0 36 36');

    // Círculo de fundo (background)
    const circleBg = document.createElementNS("http://www.w3.org/2000/svg", "path");
    circleBg.setAttribute('class', 'circle-bg');
    circleBg.setAttribute('d', "M18 2.0845 a 15.9155 15.9155 0 1 0 0.00001 0");
    svg.appendChild(circleBg);

    // Círculo de progresso (frontal)
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "path");
    circle.setAttribute('class', 'circle');
    circle.setAttribute('stroke-dasharray', `${percentage}, 100`);
    circle.setAttribute('d', "M18 2.0845 a 15.9155 15.9155 0 1 0 0.00001 0");

    if (label === 'Fake') {
        circle.setAttribute('stroke', 'red');  // Cor para "Fake"
    } else {
        circle.setAttribute('stroke', '#4caf50');  // Cor para "Real" (mantendo verde)
    }

    svg.appendChild(circle);

    // Adicionar o texto centralizado
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', '18');
    text.setAttribute('y', '20.35');
    text.setAttribute('class', 'percentage');
    text.setAttribute('text-anchor', 'middle');
    text.textContent = `${percentage.toFixed(2)}%`;
    svg.appendChild(text);

    container.appendChild(svg);

    const labelText = document.createElement('div');
    labelText.textContent = label;
    labelText.classList.add('label-text'); // Adiciona uma classe para o rótulo
    container.appendChild(labelText);

    return container;
}



