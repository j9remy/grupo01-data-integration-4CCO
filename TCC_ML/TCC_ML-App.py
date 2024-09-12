from flask import Flask, request, jsonify
from flask_cors import CORS  # Importa o CORS
from PIL import Image
import io
import base64
from io import BytesIO
import numpy as np
from transformers import ViTForImageClassification, ViTImageProcessor
from torchvision.transforms import Normalize, Resize, ToTensor, Compose
import torch
import boto3
import uuid
import cv2

app = Flask(__name__)
CORS(app)  # Habilita CORS para todas as rotas

# Carregar o modelo salvo e o processador
model_dir = "deepfake_vs_real_image_detection"
model = ViTForImageClassification.from_pretrained(model_dir)
processor = ViTImageProcessor.from_pretrained(model_dir)

# Definir transformações
image_mean, image_std = processor.image_mean, processor.image_std
size = processor.size["height"]

normalize = Normalize(mean=image_mean, std=image_std)
val_transforms = Compose([
    Resize((size, size)),
    ToTensor(),
    normalize
])

# Definição do modelo
pipe = model

def contains_face(image):
    # Carregar o modelo de detecção de rosto (deep learning)
    proto_file = 'MobileNetSSD_deploy.prototxt'
    model_file = 'MobileNetSSD_deploy.caffemodel'
    net = cv2.dnn.readNetFromCaffe(proto_file, model_file)
    
    # Carregar a imagem
    imagem = cv2.imread(caminho_imagem)
    
    if imagem is None:
        print("Erro ao carregar a imagem.")
        return False
    
    # Obter as dimensões da imagem
    (h, w) = imagem.shape[:2]
    
    # Pré-processar a imagem: redimensionar para 300x300 e normalizar
    blob = cv2.dnn.blobFromImage(imagem, 1.0, (300, 300), (104.0, 177.0, 123.0))
    
    # Passar o blob pela rede para obter detecções
    net.setInput(blob)
    detections = net.forward()
    
    # Percorrer todas as detecções
    for i in range(0, detections.shape[2]):
        # Extrair a confiança (probabilidade associada à detecção)
        confiança = detections[0, 0, i, 2]
        
        # Considerar detecções com confiança maior que 0.5
        if confiança > 0.5:
            # Computar as coordenadas da caixa delimitadora do rosto
            box = detections[0, 0, i, 3:7] * [w, h, w, h]
            (startX, startY, endX, endY) = box.astype("int")
            
            # Se houver um rosto detectado, retornar True
            return True
    
    # Se nenhum rosto foi detectado, retornar False
    return False

@app.route('/process_images', methods=['POST'])
def process_image():
    files = request.files.getlist('images')
    results = []
    #s3 = boto3.client('s3')

    for file in files:
        image = Image.open(file).convert("RGB")
        image_bytes = BytesIO()
        image.save(image_bytes, format='PNG')
        encoded_image = base64.b64encode(image_bytes.getvalue()).decode('utf-8')

        # Aplicar transformações
        image_tensor = val_transforms(image).unsqueeze(0)  # Add batch dimension
        
        # Passar o tensor processado pelo modelo
        with torch.no_grad():

            #image_cv = np.array(image)
            #image_cv = cv2.cvtColor(image_cv, cv2.COLOR_RGB2BGR)

            if contains_face(image):
                outputs = pipe(image_tensor)
                logits = outputs.logits
                predictions = torch.nn.functional.softmax(logits, dim=1)
                confidences = predictions[0].cpu().numpy()
                labels = model.config.id2label
                result = {labels[i]: confidences[i] for i in range(len(labels))}
                conf_real = result.get('Real', 0)
                conf_fake = result.get('Fake', 0)
                results.append({
                    'image': encoded_image,
                    'real_percentage': conf_real * 100,
                    'fake_percentage': conf_fake * 100,
                    'contains_face': True
                })

                #name_image = f'{uuid.uuid4()}_{round(conf_real * 100)}_real_{round(conf_fake * 100)}_fake.png'

                #if conf_real>conf_fake:
                    #s3.upload_file(encoded_image, 's3-tcc', f'real/{name_image}')

                #else:
                    #s3.upload_file(encoded_image, 's3-tcc', f'fake/{name_image}')

                

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

