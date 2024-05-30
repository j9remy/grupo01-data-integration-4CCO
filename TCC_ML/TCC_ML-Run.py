import warnings
warnings.filterwarnings("ignore")

import gc
import numpy as np
import pandas as pd
from collections import Counter
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, roc_auc_score, confusion_matrix, classification_report, f1_score
from imblearn.over_sampling import RandomOverSampler
import evaluate
from datasets import Dataset, Image, ClassLabel
from transformers import ViTForImageClassification, ViTImageProcessor, TrainingArguments, Trainer, DefaultDataCollator
import torch
from torch.utils.data import DataLoader
from torchvision.transforms import CenterCrop, Compose, Normalize, RandomRotation, RandomResizedCrop, RandomHorizontalFlip, RandomAdjustSharpness, Resize, ToTensor
from PIL import ImageFile
from pathlib import Path
from tqdm import tqdm
import os
import streamlit as st

ImageFile.LOAD_TRUNCATED_IMAGES = True

# Carregando dataset
file_names = []
labels = []
for file in sorted((Path('deepfake_database/deepfake_database').glob('*/*/*.*'))):
    parts = file.parts
    label = parts[-2]
    labels.append(label)
    file_names.append(str(file))

df = pd.DataFrame.from_dict({"image": file_names, "label": labels})
y = df[['label']]
df = df.drop(['label'], axis=1)
ros = RandomOverSampler(random_state=83)
df, y_resampled = ros.fit_resample(df, y)
df['label'] = y_resampled

dataset = Dataset.from_pandas(df).cast_column("image", Image())

labels_list = ['real', 'df']
label2id, id2label = {label: i for i, label in enumerate(labels_list)}, {i: label for i, label in enumerate(labels_list)}

ClassLabels = ClassLabel(num_classes=len(labels_list), names=labels_list)
def map_label2id(example):
    example['label'] = ClassLabels.str2int(example['label'])
    return example

dataset = dataset.map(map_label2id, batched=True)
dataset = dataset.cast_column('label', ClassLabels)
dataset = dataset.train_test_split(test_size=0.3, shuffle=True, stratify_by_column="label")

train_data = dataset['train']
test_data = dataset['test']

from transformers import ViTForImageClassification, ViTImageProcessor, pipeline

# Diretório onde o modelo foi salvo
model_dir = "deepfake_vs_real_image_detection"

# Carregar o modelo salvo
model = ViTForImageClassification.from_pretrained(model_dir)
processor = ViTImageProcessor.from_pretrained(model_dir)

# Definir transformações
image_mean, image_std = processor.image_mean, processor.image_std
size = processor.size["height"]

normalize = Normalize(mean=image_mean, std=image_std)
_train_transforms = Compose([
    Resize((size, size)),
    RandomRotation(90),
    RandomAdjustSharpness(2),
    ToTensor(),
    normalize
])
_val_transforms = Compose([
    Resize((size, size)),
    ToTensor(),
    normalize
])

def train_transforms(examples):
    examples['pixel_values'] = [_train_transforms(image.convert("RGB")) for image in examples['image']]
    return examples

def val_transforms(examples):
    examples['pixel_values'] = [_val_transforms(image.convert("RGB")) for image in examples['image']]
    return examples

train_data.set_transform(train_transforms)
test_data.set_transform(val_transforms)

# Função para preparar os dados em batch para o treinamento do modelo
def collate_fn(examples):
    pixel_values = torch.stack([example["pixel_values"] for example in examples])
    labels = torch.tensor([example['label'] for example in examples])
    return {"pixel_values": pixel_values, "labels": labels}

# Criação do pipeline para classificação de imagens

# - 'model_name': O nome do modelo pré-treinado a ser usado para a classificação de imagem
# - 'device': Especifica o dispositivo a ser usado para executar o modelo (0 para GPU, -1 para CPU).

pipe = pipeline('image-classification', model=model, feature_extractor=processor, device=-1)

# Função para exibir a imagem com o resultado da classificação
def show_image_with_result(image, result, true_label):
    confidences = {res['label']: res['score'] for res in result}
    conf_real = confidences.get('Real', 0)
    conf_fake = confidences.get('Fake', 0)
    
    plt.imshow(image)
    plt.title(f"Predição: {result[0]['label']}\n\nConfiança Real: {conf_real:.2f}\nConfiança Fake: {conf_fake:.2f}\n\nRótulo Verdadeiro: {true_label}")
    plt.axis('off')
    plt.show()

# Trecho para acessar uma imagem do conjunto e exibir o seu resultado
example = test_data[39]
# image = example["image"]
true_label = id2label[example["label"]]
# result = pipe(image)
# print(result)

st.header('Análise percentual do uso de IA na sua imagem')

#st.divider()

images = st.file_uploader('Insira sua imagem', type= ['png','jpg', 'jpeg'],accept_multiple_files=True)

if images:
    for image in images:
        result = pipe(image)
        confidences = {res['label']: res['score'] for res in result}
        conf_real = confidences.get('Real', 0)
        conf_fake = confidences.get('Fake', 0)
        st.image(image=image,caption=image.name,width=300)
        st.success(f'{conf_real*100:.2f}% da imagem não apresenta uso de IA')
        st.error(f'{conf_fake*100:.2f}% da imagem apresenta uso de IA')
        st.markdown('---')

show_image_with_result(image, result, true_label)