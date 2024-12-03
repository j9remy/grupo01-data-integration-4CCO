from flask import Flask, request, jsonify
from flask_cors import CORS  # Importa o CORS
from PIL import Image
import io
import base64
from io import BytesIO
import numpy as np
import torch
from torchvision.transforms import Normalize, Resize, ToTensor, Compose
import cv2
import requests
import uuid

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

# Carregar o modelo ResNet salvo
model_path = "best_resnet_model_complete.pth"
model = torch.load(model_path)
model.eval()

# Configuração do dispositivo
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Definir transformações
val_transforms = Compose([
    Resize((224, 224)),
    ToTensor(),
    Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Mapeamento de rótulos
id2label = {0: "Real", 1: "Fake"}
label2id = {"Real": 0, "Fake": 1}

# Função para verificar se a imagem contém um rosto
def contains_face(image):
    image_cv = np.array(image)
    image_cv = cv2.cvtColor(image_cv, cv2.COLOR_RGB2BGR)
    
    # Carrega o classificador Haar Cascade para detecção de rostos
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_alt2.xml')
    eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')

    # Converte a imagem para escala de cinza (necessário para o Haar Cascade)
    gray_image = cv2.cvtColor(image_cv, cv2.COLOR_BGR2GRAY)

    # Detecta os rostos na imagem
    faces = face_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    eyes = eye_cascade.detectMultiScale(gray_image, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    if len(faces) > 0 and len(eyes) >= 2:
        return True

    return len(eyes) > 2

@app.route('/process_images', methods=['POST'])
def process_image():
    files = request.files.getlist('images')
    results = []

    for file in files:
        image = Image.open(file).convert("RGB")
        image_bytes = BytesIO()
        image.save(image_bytes, format='PNG')
        encoded_image = base64.b64encode(image_bytes.getvalue()).decode('utf-8')

        # Aplicar transformações
        image_tensor = val_transforms(image).unsqueeze(0).to(device)  # Add batch dimension
        
        # Passar o tensor processado pelo modelo
        with torch.no_grad():
            if contains_face(image):
                outputs = model(image_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1).cpu().numpy()
                conf_real, conf_fake = probabilities[0]

                results.append({
                    'image': encoded_image,
                    'real_percentage': conf_real * 100,
                    'fake_percentage': conf_fake * 100,
                    'contains_face': True
                })

                # Salvar a imagem no S3 com base na predição
                name_image = f'{uuid.uuid4()}_{round(conf_real * 100)}_real_{round(conf_fake * 100)}_fake.json'

                if conf_real > conf_fake:
                    response = requests.put(
                        f"https://7f3pdsi5hh.execute-api.us-east-1.amazonaws.com/dev/s3-tcc/real/{name_image}",
                        data=encoded_image
                    )
                else:
                    response = requests.put(
                        f"https://7f3pdsi5hh.execute-api.us-east-1.amazonaws.com/dev/s3-tcc/fake/{name_image}",
                        data=encoded_image
                    )
            else:
                results.append({
                    'image': encoded_image,
                    'real_percentage': None,
                    'fake_percentage': None,
                    'contains_face': False
                })
    
    return jsonify({'results': results})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)