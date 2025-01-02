import google.generativeai as genai
from pathlib import Path

# Configuración de la clave API de Google
GOOGLE_API_KEY = 'AIzaSyCTIA2YQmtJsPMhebibj1YMBnbfbS8sncE'  # Reemplaza con tu propia clave API
genai.configure(api_key=GOOGLE_API_KEY)

# Listar modelos compatibles con 'generateContent'
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)

# Configuración del modelo
MODEL_CONFIG = {
    "temperature": 0.2,
    "top_p": 1,
    "top_k": 32,
    "max_output_tokens": 4096,
}

# Configuración de seguridad del modelo
safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
]

# Creación del modelo generativo
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=MODEL_CONFIG,
    safety_settings=safety_settings
)

# Función para formatear la imagen
def image_format(image_path):
    img = Path(image_path)
    if not img.exists():
        raise FileNotFoundError(f"Could not find image: {img}")
    
    image_parts = [
        {
            "mime_type": "image/jpeg",  # Cambia según el tipo de imagen: PNG - image/png, JPEG - image/jpeg, WEBP - image/webp
            "data": img.read_bytes()
        }
    ]
    return image_parts

# Función para obtener la salida del modelo
def gemini_output(image_path, system_prompt, user_prompt):
    image_info = image_format(image_path)
    input_prompt = [system_prompt, image_info[0], user_prompt]
    response = model.generate_content(input_prompt)
    return response.text

# Ejemplo de uso
system_prompt = """
               You are a specialist in understanding medical records.
               Input images in the form of medical histories will be provided to you,
               and your task is to respond to questions based on the content of the input image.
               """
image_path = "pyh\imagen.jpg"  # Cambia esto por la ruta de tu imagen local

# Ejemplo para convertir los datos de la historia clínica a formato JSON con la estructura dada
user_prompt = """
Extract the medical history data from the image and structure it into the following JSON format:

{
  "establecimiento": "MEDIHELP",
  "paciente": {
    "nombre": "ISAAC",
    "apellido": "VEGA",
    "sexo": "MASCULINO",
    "edad": "2 AÑOS, 1 MESES Y 25 DIAS",
    "numeroHistoriaClinica": "SD46132"
  },
  "antecedentesPersonales": "NUNCA",
  "antecedentesQuirurgicos": "REALIZAN DRENAJE DE QUISTE SEBACEO QUE A LOS 7 DIAS VUELVE A CRECER.",
  "alergias": "NO REFIERE",
  "habitos": "NO REFIERE",
  "tratamientosEspeciales": "NO REFIERE",
  "antecedentesGinecologicosObstetricos": "NO REFIERE",
  "antecedentesFamiliares": "NO REFIERE",
  "signosVitales": {
    "fecha": "2023-11-09 16:02:52",
    "temperatura": "",
    "presionArterial": "",
    "pulso": "",
    "frecuenciaRespiratoria": "",
    "saturacionOxigeno": "",
    "talla": "",
    "pesoKg": "",
    "pesoLb": "",
    "imc": ""
  },
  "motivoConsulta": "MADRE REFIERE QUE DESDE HACE 1 MES PRESENTA MASA EN LA CARA",
  "enfermedadProblemaActual": "MADRE REFIERE QUE DESDE HACE 1 MES PRESENTA MASA EN LA CARA QUE HA IDO AUMENTANDO DE TAMAÑO",
  "examenFisico": "PILOMATRIXOMA EN CARA IZQUIERDA",
  "diagnosticosPresuntivos": "2. DIAGNÓSTICOS DEFINITIVOS",
  "diagnosticosDefinitivos": "PLANES DE TRATAMIENTO",
  "tratamiento": "EVOLUCIÓN",
  "evolucion": "PRESCRIPCIONES MEDICAMENTOS CANTIDAD INDICACIONES NO EXISTEN REGISTROS DE PRESCRIPCIÓN PARA ESTA ATENCIÓN.",
  "observaciones": ""
}
Please provide the data in this exact format, filling in the fields based on the content of the image.
"""

output = gemini_output(image_path, system_prompt, user_prompt)
print(output)