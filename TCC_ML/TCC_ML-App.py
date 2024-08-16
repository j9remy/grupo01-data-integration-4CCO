from flask import Flask, request, jsonify
from PIL import Image
import io
import numpy as np
from transformers import ViTForImageClassification, ViTImageProcessor
from torchvision.transforms import Normalize, Resize, ToTensor, Compose
import torch

app = Flask(__name__)

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
pipe = torch.nn.Sequential(model, processor)

@app.route('/process_image', methods=['POST'])
def process_image():
    file = request.files['image']
    image = Image.open(file).convert("RGB")
    image_tensor = val_transforms(image).unsqueeze(0)  # Add batch dimension
    with torch.no_grad():
        outputs = pipe(image_tensor)
        logits = outputs.logits
        predictions = torch.nn.functional.softmax(logits, dim=1)
        confidences = predictions[0].cpu().numpy()
        labels = model.config.id2label
        result = {labels[i]: confidences[i] for i in range(len(labels))}
        conf_real = result.get('Real', 0)
        conf_fake = result.get('Fake', 0)
        return jsonify({
            'real_percentage': conf_real * 100,
            'fake_percentage': conf_fake * 100
        })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
