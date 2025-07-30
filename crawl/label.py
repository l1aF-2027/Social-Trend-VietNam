import os
import json
import math
from time import sleep
import re
from tqdm import tqdm
import argparse
import google.generativeai as genai

# Đường dẫn và các tham số
IN_PATH = r"E:\Documents\DS200\final_project\facebook_crawl\data\json\data_filled.json"
OUT_DIR_BASE = r"E:\Documents\DS200\final_project\facebook_crawl\data\json"

API_KEYS_FILE = r"E:\Documents\DS200\final_project\facebook_crawl\api_keys.txt"
KEYS_PER_GROUP = 16

MAX_ITEMS_PER_PART = 450

PROMPT_SOFT = (
    "Bạn là một hệ thống phân tích khía cạnh và cảm xúc của các bài viết và bình luận mạng xã hội, "
    "nhằm theo dõi và phân tích mức độ nhắc đến các cá nhân hoặc nội dung liên quan đến họ.\n\n"
    "Dưới đây là nội dung tổng hợp của một bài post và các bình luận liên quan, bao gồm mô tả ảnh nếu có. "
    "Hãy phân tích đầy đủ các ngữ cảnh – kể cả thành ngữ, nói bóng gió, mỉa mai – để xác định chính xác:\n\n"
    "- **Tối đa 2 aspect** (khía cạnh) chỉ được phép thuộc một trong các nhãn sau đây: Health, Fashion, Sport, Food, Art, Law, Other. "
    "- Với mỗi aspect, xác định **sentiment (positive, negative, neutral)**.\n\n"
    "⚠️ RẤT QUAN TRỌNG: Bạn chỉ được phép chọn các nhãn trong danh sách trên. "
    "Không được tạo hoặc suy diễn bất kỳ nhãn nào khác ngoài danh sách này.\n"
    "Nếu không tìm thấy aspect liên quan, hãy đặt: Aspect_1: Other.\n"
    "Nếu chỉ có 1 aspect, Aspect_2 phải là null.\n\n"
    "Nội dung đầy đủ:\n\"\"\"\n{content}\n\"\"\"\n\n"
    "Trả kết quả ngắn gọn như sau (KHÔNG cần JSON):\n"
    "Aspect_1: <tên>\n"
    "Aspect_2: <tên hoặc null>\n"
    "Sentiment: [<sentiment1>, <sentiment2>]\n"
)

PROMPT_STRICT = (
    "Bạn là một hệ thống phân tích khía cạnh và cảm xúc cực kỳ chính xác, được sử dụng để đánh giá chất lượng dữ liệu huấn luyện AI.\n\n"
    "Dưới đây là nội dung tổng hợp của một bài post và các bình luận liên quan (bao gồm mô tả ảnh nếu có).\n"
    "Bạn cần đọc kỹ toàn bộ nội dung, bao gồm ẩn ý, bóng gió, mỉa mai, hoặc thành ngữ để phân tích theo các yêu cầu nghiêm ngặt sau:\n\n"
    "- Chỉ chọn các **aspect** thật sự liên quan trực tiếp đến **chủ thể chính được đề cập đến** trong nội dung.\n"
    "- Tối đa 2 aspect, bắt buộc phải thuộc đúng một trong các nhãn: Health, Fashion, Sport, Food, Art, Law, Other.\n"
    "- **Nghiêm cấm** suy đoán hoặc gán nhãn dựa trên cảm nhận chủ quan nếu không có bằng chứng rõ ràng trong văn bản.\n"
    "- Với mỗi aspect, xác định **sentiment** chính xác nhất (positive, negative, neutral), kể cả khi nội dung có sắc thái mỉa mai hoặc đa nghĩa.\n"
    "- Nếu không có aspect rõ ràng liên quan đến chủ thể, đặt: Aspect_1: Other, Aspect_2: null.\n"
    "- Nếu chỉ có một aspect, Aspect_2 phải là null.\n\n"
    "⚠️ Bài kiểm tra này dùng để đánh giá chất lượng mô hình NLP, vì vậy bạn phải đưa ra đầu ra thật chính xác, đúng định dạng và không suy diễn.\n\n"
    "Nội dung đầy đủ:\n\"\"\"\n{content}\n\"\"\"\n\n"
    "Trả kết quả ngắn gọn như sau (KHÔNG cần JSON):\n"
    "Aspect_1: <tên>\n"
    "Aspect_2: <tên hoặc null>\n"
    "Sentiment: [<sentiment1>, <sentiment2>]\n"
)

def read_api_keys(filepath):
    keys = []
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip().strip('"').strip()
            if line:
                keys.append(line)
    return keys

def split_data(data, num_parts, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    chunk_size = math.ceil(len(data) / num_parts)
    for i in range(num_parts):
        part = data[i*chunk_size : (i+1)*chunk_size]
        with open(os.path.join(out_dir, f"data_part_{i:02}.json"), "w", encoding="utf-8") as fout:
            json.dump(part, fout, ensure_ascii=False, indent=2)
    print(f"Split {len(data)} items into {num_parts} parts in {out_dir}")

def build_full_text(item):
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

def call_gemini(api_key, text, prompt):
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    sleep(1)
    resp = model.generate_content([prompt.format(content=text)], stream=False)
    if resp.candidates and resp.candidates[0].content.parts:
        txt = resp.candidates[0].content.parts[0].text.strip()
    else:
        return {"Aspect_1": "Other", "Aspect_2": None, "Sentiment": ["neutral"]}

    if "Aspect_1" not in txt:
        return {"Aspect_1": "Other", "Aspect_2": None, "Sentiment": ["neutral"]}

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
    ALLOWED_ASPECTS = {"Health", "Fashion", "Sport", "Food", "Art", "Law", "Other"}
    a1 = labels.get("Aspect_1")
    a2 = labels.get("Aspect_2")
    if a1 not in ALLOWED_ASPECTS:
        a1 = "Other"
    if a2 not in ALLOWED_ASPECTS:
        a2 = None
    sentiments = labels.get("Sentiment", ["neutral"])
    return {"Aspect_1": a1, "Aspect_2": a2, "Sentiment": sentiments}

def process_part(idx, api_key, prompt, input_dir, output_dir, max_items=MAX_ITEMS_PER_PART, delay_sec=0):
    print(f"⏳ Waiting {delay_sec}s before starting part {idx:02}...")
    sleep(delay_sec)

    input_path = os.path.join(input_dir, f"data_part_{idx:02}.json")
    output_jsonl = os.path.join(output_dir, f"data_labeled_{idx:02}.jsonl")
    output_json = os.path.join(output_dir, f"data_labeled_{idx:02}.json")
    error_log = os.path.join(output_dir, f"errors_{idx:02}.txt")

    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)[:max_items]

    error_items = []
    labeled_data = []
    start_idx = 0

    if os.path.exists(output_jsonl):
        with open(output_jsonl, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    item = json.loads(line)
                    labeled_data.append(item)
                except:
                    break
        start_idx = len(labeled_data)

    with open(output_jsonl, "a", encoding="utf-8") as fout:
        for i in tqdm(range(start_idx, len(data)), desc=f"Part {idx:02}"):
            item = data[i]
            full_text = build_full_text(item)

            try:
                sleep(1)
                labels = call_gemini(api_key, full_text, prompt)
                item.update(labels)
                labeled_data.append(item)
                fout.write(json.dumps(item, ensure_ascii=False) + "\n")
                tqdm.write(f"[{idx:02}] {i} → A1={labels['Aspect_1']}, A2={labels['Aspect_2']}, S={labels['Sentiment']}")
            except Exception as e:
                error_items.append({"part": idx, "index": i, "error": str(e)})
                tqdm.write(f"[Part {idx:02}] Item {i} ERROR: {e}. Sleeping 2 minutes before retry...")
                sleep(120)

    with open(output_json, "w", encoding="utf-8") as fout:
        json.dump(labeled_data, fout, ensure_ascii=False, indent=2)

    with open(error_log, "w", encoding="utf-8") as ferr:
        for err in error_items:
            ferr.write(f"Part {err['part']:02} | Index {err['index']} | Error: {err['error']}\n")

    print(f"Done part {idx:02} → labeled: {len(labeled_data)}, errors: {len(error_items)}")

def main():
    parser = argparse.ArgumentParser(description="Run Gemini labeling with multiple API key groups and prompts.")
    parser.add_argument("--key-group", type=int, choices=[0,1], required=True,
                        help="Which key group to use: 0 = first 16 keys (soft prompt), 1 = second 16 keys (strict prompt)")
    args = parser.parse_args()

    api_keys = read_api_keys(API_KEYS_FILE)
    total_keys = len(api_keys)
    if total_keys < 32:
        raise ValueError(f"Expected at least 32 API keys, found {total_keys}")

    # Chọn 16 keys theo nhóm
    start_idx = args.key_group * KEYS_PER_GROUP
    selected_keys = api_keys[start_idx : start_idx + KEYS_PER_GROUP]

    # Chọn prompt theo nhóm
    prompt = PROMPT_SOFT if args.key_group == 0 else PROMPT_STRICT

    # Chuẩn bị thư mục output cho từng loại prompt
    out_dir = os.path.join(OUT_DIR_BASE, "soft" if args.key_group == 0 else "strict")
    os.makedirs(out_dir, exist_ok=True)

    with open(IN_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    split_data(data, KEYS_PER_GROUP, out_dir)

    for idx, api_key in enumerate(selected_keys):
        delay = 0
        process_part(idx, api_key, prompt, out_dir, out_dir, delay_sec=delay)

if __name__ == "__main__":
    main()
