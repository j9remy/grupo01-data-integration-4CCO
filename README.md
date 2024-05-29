👨🏻‍💻 grupo01-data-integration-4CCO
<p>
  
# Configurando o Repositório Após o Clone Devido ao GIT LFS

<h3>Passo 1: Instalar Git LFS</h3>
<p>
Primeiro, você precisa ter o Git LFS instalado na sua máquina. Você pode instalar o Git LFS seguindo as instruções abaixo:
</p>
<ul>
  <li>
    <strong>No Windows:</strong><br>
    Baixe e execute o instalador do Git LFS a partir do site oficial. 
    <a href="https://git-lfs.github.com/">https://git-lfs.github.com/</a>
  </li>
  <li>
    <strong>No Linux:</strong><br>
    Você pode instalar o Git LFS usando seu gerenciador de pacotes preferido. Por exemplo, no Ubuntu:
    <pre><code>sudo apt-get install git-lfs</code></pre>
  </li>
</ul>

<h3>Passo 2: Clonar o Repositório</h3>
<p>
Ao clonar o repositório, use o comando <code>git clone</code> normalmente:
</p>
<pre><code>git clone https://github.com/j9remy/grupo01-data-integration-4CCO.git</code></pre>

<h3>Passo 3: Inicializar o Git LFS</h3>
<p>
Depois de instalar o Git LFS, você precisa inicializá-lo no seu repositório local. Execute o seguinte comando no diretório raiz do repositório clonado:
</p>
<pre><code>git lfs install</code></pre>

<h3>Passo 4: Baixar os Arquivos Grandes</h3>
<p>
Após clonar o repositório, você precisa baixar os arquivos grandes que são gerenciados pelo Git LFS. Execute o comando:
</p>
<pre><code>git lfs pull</code></pre>

<p>
Este comando fará o download de todos os arquivos grandes rastreados pelo Git LFS, garantindo que você tenha todos os dados necessários para trabalhar no projeto.
</p>
