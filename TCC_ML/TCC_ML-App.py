from flask import Flask, request, jsonify
from PIL import Image
import io
import torch
from transformers import ViTForImageClassification, ViTImageProcessor, pipeline
from torchvision.transforms import Normalize, Resize, ToTensor, Compose

app = Flask(__name__)

app.run(host='0.0.0.0', port=5000)

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

# Criação do pipeline para classificação de imagens
pipe = pipeline('image-classification', model=model, feature_extractor=processor, device=-1)

@app.route('/process_image', methods=['POST'])
def process_image():
    image_file = request.files['image']
    image = Image.open(io.BytesIO(image_file.read())).convert('RGB')

    # Aplicar as transformações na imagem
    image_tensor = val_transforms(image)

    # Executar a classificação
    result = pipe(image)

    # Extrair as porcentagens
    confidences = {res['label']: res['score'] for res in result}
    conf_real = confidences.get('Real', 0) * 100
    conf_fake = confidences.get('Fake', 0) * 100

    return jsonify({'real_percentage': conf_real, 'fake_percentage': conf_fake})

if __name__ == "__main__":
    app.run(debug=True)
