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

    data.results.forEach((result, index) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(result.image);
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

    const circle = document.createElement('div');
    circle.classList.add('circle');
    
    const progress = document.createElement('div');
    progress.classList.add('progress');
    progress.style.strokeDasharray = `${percentage} 100`;

    const text = document.createElement('span');
    text.classList.add('progress-text');
    text.textContent = `${percentage.toFixed(2)}% ${label}`;

    circle.appendChild(progress);
    container.appendChild(circle);
    container.appendChild(text);

    return container;
}

function showPopup(percentageReal, percentageFake) {
    const popup = document.createElement('div');
    popup.classList.add('popup');
    popup.onclick = () => {
        popup.remove();
        window.location.reload();
    };

    const content = document.createElement('div');
    content.classList.add('popup-content');
    content.onclick = (e) => {
        e.stopPropagation();
    };

    const title = document.createElement('h2');
    title.textContent = 'Resultado da Análise';
    content.appendChild(title);

    // Cria os contêineres para os gráficos
    const realChartContainer = document.createElement('div');
    realChartContainer.classList.add('chart-container');
    const fakeChartContainer = document.createElement('div');
    fakeChartContainer.classList.add('chart-container');

    content.appendChild(realChartContainer);
    content.appendChild(fakeChartContainer);

    // Cria o gráfico circular para "Real"
    new Chart(realChartContainer, {
        type: 'doughnut',
        data: {
            labels: ['Real', 'Fake'],
            datasets: [{
                data: [percentageReal, 100 - percentageReal],
                backgroundColor: ['#4caf50', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: {
            circumference: Math.PI,
            rotation: -Math.PI,
            cutout: '80%',
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    color: '#000',
                    formatter: (value, ctx) => {
                        return value === 0 ? '' : `${Math.round(value)}%`;
                    }
                }
            }
        }
    });

    // Cria o gráfico circular para "Fake"
    new Chart(fakeChartContainer, {
        type: 'doughnut',
        data: {
            labels: ['Fake', 'Real'],
            datasets: [{
                data: [percentageFake, 100 - percentageFake],
                backgroundColor: ['#f44336', '#e0e0e0'],
                borderWidth: 0
            }]
        },
        options: {
            circumference: Math.PI,
            rotation: -Math.PI,
            cutout: '80%',
            plugins: {
                tooltip: {
                    enabled: false
                },
                legend: {
                    display: false
                },
                datalabels: {
                    display: true,
                    color: '#000',
                    formatter: (value, ctx) => {
                        return value === 0 ? '' : `${Math.round(value)}%`;
                    }
                }
            }
        }
    });

    const closeButton = document.createElement('span');
    closeButton.classList.add('close-btn-popup');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => {
        popup.remove();
        window.location.reload();
    };

    content.appendChild(closeButton);
    popup.appendChild(content);
    document.body.appendChild(popup);
}
