import os
import json
import math
from time import sleep
import re
from tqdm import tqdm
import argparse
import requests

# Đường dẫn và các tham số
IN_PATH = r"D:\ASUS\Test\Social-Trend-VietNam\label_upgrade\data_labeled_soft_cleaned.json"
OUT_DIR_BASE = r"D:\ASUS\Test\Social-Trend-VietNam\label_upgrade\json"

API_KEY_FILE = r"D:\ASUS\Test\Social-Trend-VietNam\label_upgrade\groq_api_key.txt"

# NVIDIA API settings
NVIDIA_INVOKE_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = "meta/llama-4-maverick-17b-128e-instruct"
RPM_LIMIT = 40  # Requests per minute
REQUEST_INTERVAL = 60.0 / RPM_LIMIT  # Seconds between requests

MAX_ITEMS_PER_PART = 450

PROMPT_SOFT = (
    "Bạn là một hệ thống phân tích khía cạnh và cảm xúc của các bài viết và bình luận mạng xã hội, "
    "nhằm nhận diện nhân vật chính được nhắc đến và phân tích sentiment về họ.\n\n"
    
    "Dưới đây là nội dung tổng hợp của một bài post và các bình luận liên quan, bao gồm mô tả ảnh nếu có. "
    "Hãy thực hiện theo thứ tự:\n\n"
    
    "**BƯỚC 1: NHẬN DIỆN NHÂN VẬT CHÍNH**\n"
    "- Xác định nhân vật chính được nhắc đến nhiều nhất hoặc là trọng tâm của bài viết\n"
    "- Nêu tên/danh tính của nhân vật đó\n\n"
    
    "**BƯỚC 2: PHÂN TÍCH KHÍA CẠNH VÀ CảM XÚC**\n"
    "Chỉ phân tích các khía cạnh liên quan đến nhân vật chính đã xác định:\n"
    "- **Tối đa 2 aspect** thuộc một trong các nhãn: Health, Fashion, Sport, Food, Art, Law, Other\n"
    "- Với mỗi aspect, xác định **sentiment (positive, negative, neutral)**\n"
    "- Phân tích đầy đủ các ngữ cảnh – kể cả thành ngữ, nói bóng gió, mỉa mai\n\n"
    
    "⚠️ QUAN TRỌNG: \n"
    "- Chỉ được chọn nhãn trong danh sách đã cho\n"
    "- Chỉ phân tích aspect/sentiment liên quan đến nhân vật chính\n"
    "- Nếu không có aspect rõ ràng: Aspect_1: Other\n"
    "- Nếu chỉ có 1 aspect: Aspect_2 = null\n\n"
    
    "Nội dung đầy đủ:\n"
    "\"\"\"\n"
    "{content}\n"
    "\"\"\"\n\n"
    
    "Trả kết quả ngắn gọn:\n"
    "Main_Character: <tên nhân vật chính>\n"
    "Aspect_1: <tên>\n"
    "Aspect_2: <tên hoặc null>\n"
    "Sentiment: [<sentiment1>, <sentiment2>]\n"
)

def read_api_key(filepath):
    """Đọc API key từ file"""
    with open(filepath, "r", encoding="utf-8") as f:
        key = f.read().strip().strip('"').strip()
    return key

def split_data(data, num_parts, out_dir):
    """Chia dữ liệu thành nhiều phần"""
    os.makedirs(out_dir, exist_ok=True)
    chunk_size = math.ceil(len(data) / num_parts)
    for i in range(num_parts):
        part = data[i*chunk_size : (i+1)*chunk_size]
        with open(os.path.join(out_dir, f"data_part_{i:02}.json"), "w", encoding="utf-8") as fout:
            json.dump(part, fout, ensure_ascii=False, indent=2)
    print(f"Split {len(data)} items into {num_parts} parts in {out_dir}")

def build_full_text(item):
    """Xây dựng text đầy đủ từ item"""
    parts = []

    if post := item.get("post_content"):
        parts.append("Bài viết chính:\n" + post)

    parent_comments = item.get("comment", {}).get("parent_comment_texts", [])
    if parent_comments:
        parent_text = "\n\n---\n\n".join(parent_comments)
        parts.append("Bình luận cha:\n" + parent_text)

    if ct := item.get("comment", {}).get("comment_text", ""):
        parts.append("Bình luận hiện tại:\n" + ct)

    def extract_img_descs(arr, label):
        if not arr:
            return ""
        descs = []
        for img in arr:
            if desc := img.get("image_description", ""):
                descs.append(desc)
        if descs:
            return f"{label}:\n" + "\n".join(descs)
        return ""

    img_post = extract_img_descs(item.get("image_descriptions"), "Mô tả ảnh bài viết")
    if img_post:
        parts.append(img_post)

    img_comment = extract_img_descs(item.get("comment", {}).get("comment_image_descriptions", []), "Mô tả ảnh bình luận")
    if img_comment:
        parts.append(img_comment)

    img_parent_comment = extract_img_descs(item.get("comment", {}).get("parent_comment_image_descriptions", []), "Mô tả ảnh bình luận cha")
    if img_parent_comment:
        parts.append(img_parent_comment)

    full_text = "\n\n".join(parts)
    return full_text

def call_nvidia_api(api_key, text, prompt):
    """Gọi NVIDIA API để phân loại"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": NVIDIA_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt.format(content=text)
            }
        ],
        "max_tokens": 512,
        "temperature": 0.1,
        "top_p": 0.9
    }
    
    # Tuân thủ rate limit
    sleep(REQUEST_INTERVAL)
    
    try:
        response = requests.post(NVIDIA_INVOKE_URL, headers=headers, json=payload)
        response.raise_for_status()
        
        result = response.json()
        if 'choices' in result and len(result['choices']) > 0:
            txt = result['choices'][0]['message']['content'].strip()
        else:
            return {"Aspect_1": "Other", "Aspect_2": None, "Sentiment": ["neutral"]}
            
    except requests.exceptions.RequestException as e:
        print(f"API request failed: {e}")
        return {"Aspect_1": "Other", "Aspect_2": None, "Sentiment": ["neutral"]}

    if "Aspect_1" not in txt:
        return {"Aspect_1": "Other", "Aspect_2": None, "Sentiment": ["neutral"]}

    # Parse kết quả
    a1 = re.search(r"Aspect_1:\s*(\w+)", txt)
    a2 = re.search(r"Aspect_2:\s*(\w+|null)", txt)
    s_match = re.search(r"Sentiment:\s*\[(.*?)\]", txt)

    a1 = a1.group(1) if a1 else "Other"
    a2 = a2.group(1)
    a2 = None if a2 and a2.lower() == "null" else a2
    sentiments = [s.strip().lower() for s in s_match.group(1).split(",")] if s_match else ["neutral"]

    raw_labels = {"Aspect_1": a1, "Aspect_2": a2, "Sentiment": sentiments}
    return sanitize_labels(raw_labels)

def sanitize_labels(labels):
    """Làm sạch và kiểm tra labels"""
    ALLOWED_ASPECTS = {"Health", "Fashion", "Sport", "Food", "Art", "Law", "Other"}
    a1 = labels.get("Aspect_1")
    a2 = labels.get("Aspect_2")
    if a1 not in ALLOWED_ASPECTS:
        a1 = "Other"
    if a2 not in ALLOWED_ASPECTS:
        a2 = None
    sentiments = labels.get("Sentiment", ["neutral"])
    return {"Aspect_1": a1, "Aspect_2": a2, "Sentiment": sentiments}

def process_data(api_key, prompt, input_path, output_dir, max_items=None):
    """Xử lý toàn bộ dữ liệu với 1 API key"""
    os.makedirs(output_dir, exist_ok=True)
    
    output_jsonl = os.path.join(output_dir, "data_labeled_nvidia.jsonl")
    output_json = os.path.join(output_dir, "data_labeled_nvidia.json")
    error_log = os.path.join(output_dir, "errors_nvidia.txt")

    # Đọc dữ liệu
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if max_items:
        data = data[:max_items]

    error_items = []
    labeled_data = []
    start_idx = 0

    # Kiểm tra nếu đã có dữ liệu được xử lý trước đó
    if os.path.exists(output_jsonl):
        with open(output_jsonl, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    item = json.loads(line)
                    labeled_data.append(item)
                except:
                    break
        start_idx = len(labeled_data)
        print(f"Resume from item {start_idx}")

    # Xử lý dữ liệu
    with open(output_jsonl, "a", encoding="utf-8") as fout:
        for i in tqdm(range(start_idx, len(data)), desc="Processing"):
            item = data[i]
            full_text = build_full_text(item)

            try:
                labels = call_nvidia_api(api_key, full_text, prompt)
                item.update(labels)
                labeled_data.append(item)
                fout.write(json.dumps(item, ensure_ascii=False) + "\n")
                fout.flush()  # Ensure data is written immediately
                tqdm.write(f"{i} → A1={labels['Aspect_1']}, A2={labels['Aspect_2']}, S={labels['Sentiment']}")
            except Exception as e:
                error_items.append({"index": i, "error": str(e)})
                tqdm.write(f"Item {i} ERROR: {e}. Sleeping 2 minutes before retry...")
                sleep(120)

    # Lưu kết quả cuối cùng
    with open(output_json, "w", encoding="utf-8") as fout:
        json.dump(labeled_data, fout, ensure_ascii=False, indent=2)

    # Lưu log lỗi
    with open(error_log, "w", encoding="utf-8") as ferr:
        for err in error_items:
            ferr.write(f"Index {err['index']} | Error: {err['error']}\n")

    print(f"Processing completed → labeled: {len(labeled_data)}, errors: {len(error_items)}")
    print(f"Results saved to: {output_json}")

def main():
    parser = argparse.ArgumentParser(description="Run NVIDIA API labeling for ABSA task.")
    parser.add_argument("--max-items", type=int, default=None,
                        help="Maximum number of items to process (for testing)")
    args = parser.parse_args()

    # Đọc API key
    api_key = read_api_key(API_KEY_FILE)
    print(f"Using NVIDIA API with model: {NVIDIA_MODEL}")
    print(f"Rate limit: {RPM_LIMIT} RPM (interval: {REQUEST_INTERVAL:.2f}s)")

    # Chuẩn bị thư mục output
    out_dir = os.path.join(OUT_DIR_BASE, "nvidia_results")
    os.makedirs(out_dir, exist_ok=True)

    # Xử lý dữ liệu
    process_data(api_key, PROMPT_SOFT, IN_PATH, out_dir, max_items=args.max_items)

if __name__ == "__main__":
    main()