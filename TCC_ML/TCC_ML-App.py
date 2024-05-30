import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from transformers import ViTForImageClassification, ViTImageProcessor, pipeline
import torch
from torchvision.transforms import Normalize, Resize, ToTensor, Compose
from PIL import Image
import streamlit as st

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

# Função para exibir a imagem com o resultado da classificação
def show_image_with_result(image, result):
    confidences = {res['label']: res['score'] for res in result}
    conf_real = confidences.get('Real', 0)
    conf_fake = confidences.get('Fake', 0)
    
    plt.imshow(image)
    plt.title(f"Predição: {result[0]['label']}\n\nConfiança Real: {conf_real:.2f}\nConfiança Fake: {conf_fake:.2f}")
    plt.axis('off')
    st.pyplot(plt.gcf())
    plt.clf()

# Função principal para processar a imagem
def process_image(image_file):
    image = Image.open(image_file).convert("RGB")
    image_tensor = val_transforms(image)
    result = pipe(image)
    return image, result

# Configuração da interface do Streamlit
st.header('Análise percentual do uso de IA na sua imagem')

images = st.file_uploader('Insira sua imagem', type=['png', 'jpg', 'jpeg'], accept_multiple_files=True)

if images:
    for image_file in images:
        image, result = process_image(image_file)
        confidences = {res['label']: res['score'] for res in result}
        conf_real = confidences.get('Real', 0)
        conf_fake = confidences.get('Fake', 0)
        st.image(image=image, caption=image_file.name, width=300)
        st.success(f'{conf_real * 100:.2f}% da imagem não apresenta uso de IA')
        st.error(f'{conf_fake * 100:.2f}% da imagem apresenta uso de IA')
        st.markdown('---')