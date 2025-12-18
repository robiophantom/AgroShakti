from flask import Flask, request, jsonify
from flask_cors import CORS
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import os
from werkzeug.utils import secure_filename
import logging

# ---------- CONFIGURATION ----------
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODEL_PATH = "trained_model/best_resnet50_3.pth"   # to use this model first download it from this drive link  --- "https://drive.google.com/file/d/1IL-BGWYyYWqAFMKVrsYTwW8kTRmHq0cb/view?usp=sharing"
UPLOAD_FOLDER = "temp_uploads"
IMG_SIZE = 224
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Class names mapping (all 94 classes)
CLASS_NAMES = {
    0: "Black_Pitting_or_Banana_Rust",
    1: "Crown_Rot",
    2: "Healthy",
    3: "fungal_disease",
    4: "leaf_Banana_Scab_Moth",
    5: "leaf_Black_Sigatoka",
    6: "leaf_Healthy",
    7: "Black_Leaf_Streak",
    8: "Panama_Disease",
    9: "Bacterial_spot_rot",
    10: "Black_Rot",
    11: "Downy_Mildew",
    12: "Healthy",
    13: "Blight",
    14: "Common_Rust",
    15: "Gray_Leaf_Spot",
    16: "Healthy",
    17: "Aphids",
    18: "Army worm",
    19: "Bacterial blight",
    20: "Healthy",
    21: "fruit_Anthracnose",
    22: "fruit_Healthy",
    23: "fruit_Scab",
    24: "fruit_Styler_end_root",
    25: "leaf_Anthracnose",
    26: "leaf_Canker",
    27: "leaf_Dot",
    28: "leaf_Healthy",
    29: "leaf_Rust",
    30: "Cescospora Leaf Spot",
    31: "Golden Mosaic",
    32: "Healthy Leaf",
    33: "Anthracnose",
    34: "Bacterial_Canker",
    35: "Cutting_Weevil",
    36: "Gall_Midge",
    37: "Healthy",
    38: "Powdery_Mildew",
    39: "Sooty_Mould",
    40: "die_back",
    41: "Anthracnose",
    42: "BacterialSpot",
    43: "Curl",
    44: "Healthy",
    45: "Mealybug",
    46: "Mite_disease",
    47: "Mosaic",
    48: "Ringspot",
    49: "Black_Scurf",
    50: "Blackleg",
    51: "Blackspot_Bruising",
    52: "Brown_Rot",
    53: "Common_Scab",
    54: "Dry_Rot",
    55: "Healthy_Potatoes",
    56: "Miscellaneous",
    57: "Pink_Rot",
    58: "Soft_Rot",
    59: "Blast",
    60: "Brownspot",
    61: "Tungro",
    62: "bacterial_leaf_blight",
    63: "bacterial_leaf_streak",
    64: "bacterial_panicle_blight",
    65: "dead_heart",
    66: "downy_mildew",
    67: "hispa",
    68: "normal",
    69: "Healthy",
    70: "Mosaic",
    71: "RedRot",
    72: "Rust",
    73: "Yellow",
    74: "Anthracnose",
    75: "algal_leaf",
    76: "bird_eye_spot",
    77: "brown_blight",
    78: "gray_light",
    79: "healthy",
    80: "red_leaf_spot",
    81: "white_spot",
    82: "Bacterial_Spot",
    83: "Early_Blight",
    84: "Late_Blight",
    85: "Leaf_Mold",
    86: "Septoria_Leaf_Spot",
    87: "Spider_Mites_Two-spotted_Spider_Mite",
    88: "Target_Spot",
    89: "Yellow_Leaf_Curl_Virus",
    90: "healthy",
    91: "Healthy",
    92: "septoria",
    93: "stripe_rust"
}

NUM_CLASSES = len(CLASS_NAMES)

# Image preprocessing
transform = transforms.Compose([
    transforms.Resize((IMG_SIZE, IMG_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# ---------- LOAD MODEL ----------
def load_model():
    """Load the trained ResNet50 model"""
    try:
        logger.info(f"Loading model from {MODEL_PATH}")
        logger.info(f"Using device: {DEVICE}")
        
        checkpoint = torch.load(MODEL_PATH, map_location=DEVICE)
        model = models.resnet50(pretrained=False)
        model.fc = nn.Linear(model.fc.in_features, NUM_CLASSES)
        model.load_state_dict(checkpoint["model_state_dict"])
        model.to(DEVICE)
        model.eval()
        
        logger.info("✅ Model loaded successfully!")
        return model
    except Exception as e:
        logger.error(f"❌ Failed to load model: {str(e)}")
        raise e

# Load model at startup
model = load_model()

# ---------- HELPER FUNCTIONS ----------
def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def predict_disease(image_path):
    """
    Run disease detection on the image
    Returns: disease_name, confidence
    """
    try:
        # Load and preprocess image
        image = Image.open(image_path).convert("RGB")
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Run inference
        with torch.no_grad():
            outputs = model(image_tensor)
            probs = torch.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probs, 1)
        
        class_id = predicted.item()
        class_name = CLASS_NAMES[class_id]
        conf = confidence.item()
        
        logger.info(f"Prediction: {class_name} (confidence: {conf:.4f})")
        
        return class_name, conf
    
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise e

# ---------- API ENDPOINTS ----------

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Disease Detection API",
        "device": str(DEVICE),
        "model_loaded": model is not None
    }), 200

@app.route('/detect-disease', methods=['POST'])
def detect_disease():
    """
    Disease detection endpoint
    Expected: multipart/form-data with 'image' field
    Returns: JSON with disease name, confidence, detected status
    """
    try:
        # Check if image file is in request
        if 'image' not in request.files:
            return jsonify({
                "error": "No image file provided",
                "detected": False
            }), 400
        
        file = request.files['image']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                "error": "No file selected",
                "detected": False
            }), 400
        
        # Validate file extension
        if not allowed_file(file.filename):
            return jsonify({
                "error": f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
                "detected": False
            }), 400
        
        # Save file temporarily
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        logger.info(f"Processing image: {filename}")
        
        try:
            # Run disease detection
            disease_name, confidence = predict_disease(filepath)
            
            # Determine if disease was detected (not healthy)
            is_healthy = any(healthy_term in disease_name.lower() 
                           for healthy_term in ['healthy', 'normal'])
            
            response = {
                "detected": not is_healthy,
                "disease": disease_name,
                "confidence": round(confidence, 4),
                "message": "Disease detected successfully" if not is_healthy else "Plant appears healthy"
            }
            
            logger.info(f"✅ Detection complete: {response}")
            return jsonify(response), 200
            
        finally:
            # Clean up temporary file
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"Cleaned up temporary file: {filename}")
    
    except Exception as e:
        logger.error(f"❌ Detection error: {str(e)}")
        return jsonify({
            "error": str(e),
            "detected": False,
            "message": "Failed to process image"
        }), 500

# ---------- RUN SERVER ----------
if __name__ == '__main__':
    logger.info("🚀 Starting Disease Detection Flask Server...")
    logger.info(f"📍 Device: {DEVICE}")
    logger.info(f"🔢 Number of classes: {NUM_CLASSES}")
    
    # Run on port 8001 (as configured in your flaskService.js)
    app.run(host='0.0.0.0', port=8001, debug=True)
