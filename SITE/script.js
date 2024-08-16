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
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    svg.setAttribute("class", "circular-chart");

    const circleBg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circleBg.setAttribute("class", "circle-bg");
    circleBg.setAttribute("cx", "50");
    circleBg.setAttribute("cy", "50");
    circleBg.setAttribute("r", "45");
    svg.appendChild(circleBg);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("class", "circle");
    circle.setAttribute("cx", "50");
    circle.setAttribute("cy", "50");
    circle.setAttribute("r", "45");
    circle.setAttribute("stroke-dasharray", `${percentage} 100`);
    svg.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "percentage");
    text.setAttribute("x", "50");
    text.setAttribute("y", "50");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.textContent = `${percentage.toFixed(2)}% ${label}`;
    svg.appendChild(text);

    container.appendChild(svg);
    return container;
}
