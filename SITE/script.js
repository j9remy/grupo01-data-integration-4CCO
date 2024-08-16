const uploadBtn = document.getElementById('uploadBtn');
const imageBox = document.getElementById('imageBox');
let currentFile = null; // Adicionando uma variável para armazenar o arquivo atual

uploadBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
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
    const file = e.dataTransfer.files[0];
    currentFile = file; // Armazena o arquivo atual
    handleFile(file);
});

function handleFileSelect(e) {
    const file = e.target.files[0];
    currentFile = file; // Armazena o arquivo atual
    handleFile(file);
}

function handleFile(file) {
    const formData = new FormData();
    formData.append('image', file);

    fetch('http://44.210.55.160:5000/process_image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        displayResult(data); // Passa os dados para a função displayResult
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function displayResult(data) {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(currentFile); // Usa a variável currentFile
    img.classList.add('imagem');
    imageBox.innerHTML = '';
    imageBox.appendChild(img);

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Ver Resultado';
    confirmBtn.classList.add('button');
    confirmBtn.style.marginTop = '10px';
    confirmBtn.onclick = () => {
        showPopup(data.real_percentage, data.fake_percentage);
    };
    imageBox.appendChild(confirmBtn);

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.classList.add('close-btn');
    closeBtn.onclick = () => {
        window.location.reload();
    };
    imageBox.appendChild(closeBtn);
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

    const barReal = document.createElement('div');
    barReal.classList.add('bar');
    const barFillReal = document.createElement('div');
    barFillReal.classList.add('bar-fill');
    barFillReal.style.width = `${percentageReal}%`;
    barReal.appendChild(barFillReal);
    const textReal = document.createElement('span');
    textReal.classList.add('bar-text');
    textReal.textContent = `${percentageReal}% Real`;
    barReal.appendChild(textReal);

    const barFake = document.createElement('div');
    barFake.classList.add('bar');
    const barFillFake = document.createElement('div');
    barFillFake.classList.add('bar-fill');
    barFillFake.style.width = `${percentageFake}%`;
    barFake.appendChild(barFillFake);
    const textFake = document.createElement('span');
    textFake.classList.add('bar-text');
    textFake.textContent = `${percentageFake}% Fake`;
    barFake.appendChild(textFake);

    content.appendChild(barReal);
    content.appendChild(barFake);

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

document.querySelector('.menu-hamburger').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('show');
});

